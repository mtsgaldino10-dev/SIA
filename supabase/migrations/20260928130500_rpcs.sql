-- =====================================================================
-- SIA · Passo 1.5 — RPCs
-- Toda mudança de estado passa por aqui: security definer, search_path
-- fixo, checagem explícita de permissão, transação única. Baixas de
-- saldo usam pg_advisory_xact_lock por (almox, material) e os itens são
-- processados em ordem de material_id para evitar deadlock.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Auxiliares internas
-- ---------------------------------------------------------------------
create or replace function interno.fn_usuario()
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_id uuid := auth.uid();
begin
  if v_id is null then
    raise exception 'Sessão não identificada. Entre novamente no sistema.' using errcode = '28000';
  end if;
  if not exists (select 1 from public.perfis where id = v_id and ativo) then
    raise exception 'Usuário sem perfil ativo. Fale com o administrador.' using errcode = '42501';
  end if;
  return v_id;
end;
$$;

create or replace function interno.fn_texto(p_texto text)
returns text
language sql
immutable
set search_path = ''
as $$ select nullif(btrim(p_texto), '') $$;

create or replace function interno.fn_doc(p_prefixo text, p_numero bigint)
returns text
language sql
immutable
set search_path = ''
as $$ select p_prefixo || '-' || lpad(p_numero::text, 6, '0') $$;

create or replace function interno.fn_almox_nome(p_almox_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$ select coalesce((select nome from public.almoxarifados where id = p_almox_id), 'almoxarifado desconhecido') $$;

create or replace function interno.fn_material_rotulo(p_material_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select codigo_sap || ' ' || descricao from public.materiais where id = p_material_id),
    'material desconhecido'
  )
$$;

create or replace function interno.fn_exigir_responsavel(p_almox_id uuid)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.fn_eh_responsavel(p_almox_id) then
    raise exception 'Você não é responsável por %. Peça a atribuição ao administrador.',
      interno.fn_almox_nome(p_almox_id)
      using errcode = '42501';
  end if;
end;
$$;

create or replace function interno.fn_checar_data(p_data date, p_rotulo text)
returns void
language plpgsql
stable
set search_path = ''
as $$
begin
  if p_data is null then
    raise exception 'Informe a %.', p_rotulo;
  end if;
  if p_data > public.fn_hoje() then
    raise exception 'A % (%) não pode ser no futuro.', p_rotulo, to_char(p_data, 'DD/MM/YYYY');
  end if;
end;
$$;

-- Lista de itens: array não vazio, material informado, existente e sem repetição.
create or replace function interno.fn_checar_itens(p_itens jsonb)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if p_itens is null or jsonb_typeof(p_itens) <> 'array' or jsonb_array_length(p_itens) = 0 then
    raise exception 'Informe ao menos um item.';
  end if;
  if exists (select 1 from jsonb_to_recordset(p_itens) as x (material_id uuid) where x.material_id is null) then
    raise exception 'Há item sem material na lista.';
  end if;
  if exists (
    select 1 from jsonb_to_recordset(p_itens) as x (material_id uuid)
     group by x.material_id having count(*) > 1
  ) then
    raise exception 'Material repetido na lista de itens. Junte as quantidades em uma linha só.';
  end if;
  if exists (
    select 1 from jsonb_to_recordset(p_itens) as x (material_id uuid)
     where not exists (select 1 from public.materiais m where m.id = x.material_id)
  ) then
    raise exception 'Material não encontrado no catálogo.';
  end if;
end;
$$;

create or replace function interno.fn_travar_saldo(p_almox_id uuid, p_material_id uuid)
returns void
language sql
set search_path = ''
as $$
  select pg_advisory_xact_lock(hashtextextended(p_almox_id::text || ':' || p_material_id::text, 0))
$$;

create or replace function interno.fn_saldo(p_almox_id uuid, p_material_id uuid)
returns numeric
language sql
volatile
security definer
set search_path = ''
as $$
  select coalesce(sum(quantidade), 0)
    from public.movimentacoes
   where almox_id = p_almox_id and material_id = p_material_id
$$;

-- Único ponto de escrita em movimentacoes. Saída só passa se houver saldo.
create or replace function interno.fn_lancar(
  p_almox_id      uuid,
  p_material_id   uuid,
  p_quantidade    numeric,
  p_tipo          public.tipo_movimentacao,
  p_data          date,
  p_remessa_id    uuid default null,
  p_saida_id      uuid default null,
  p_ajuste_id     uuid default null,
  p_tratamento_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_saldo numeric;
begin
  if p_quantidade = 0 then
    return;
  end if;

  if p_quantidade < 0 then
    perform interno.fn_travar_saldo(p_almox_id, p_material_id);
    v_saldo := interno.fn_saldo(p_almox_id, p_material_id);
    if v_saldo + p_quantidade < 0 then
      raise exception 'Saldo insuficiente em % para %: saldo %, necessário %. Faça um ajuste de inventário se o material existir.',
        interno.fn_almox_nome(p_almox_id),
        interno.fn_material_rotulo(p_material_id),
        trim_scale(v_saldo),
        trim_scale(-p_quantidade)
        using errcode = 'P0001', hint = 'saldo_insuficiente';
    end if;
  end if;

  insert into public.movimentacoes (
    almox_id, material_id, quantidade, tipo, data_ocorrencia,
    remessa_id, saida_id, ajuste_id, tratamento_id, criado_por
  ) values (
    p_almox_id, p_material_id, p_quantidade, p_tipo, p_data,
    p_remessa_id, p_saida_id, p_ajuste_id, p_tratamento_id, auth.uid()
  );
end;
$$;

-- Duas bases têm o mesmo supervisor?
create or replace function interno.fn_mesmo_supervisor(p_almox_a uuid, p_almox_b uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.atribuicoes s1
      join public.atribuicoes s2 on s2.usuario_id = s1.usuario_id
      join public.perfis p on p.id = s1.usuario_id
     where p.ativo
       and s1.almox_id = p_almox_a and s1.funcao = 'supervisor'
       and s2.almox_id = p_almox_b and s2.funcao = 'supervisor'
  )
$$;

-- Foto obrigatória, na pasta da remessa, já enviada ao Storage.
create or replace function interno.fn_checar_foto(p_remessa_id uuid, p_foto_path text)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if interno.fn_texto(p_foto_path) is null then
    raise exception 'Anexe a foto da guia assinada ou da carga.';
  end if;
  if split_part(p_foto_path, '/', 1) <> p_remessa_id::text then
    raise exception 'A foto precisa estar na pasta da remessa. Envie a foto novamente.';
  end if;
  if not exists (
    select 1 from storage.objects
     where bucket_id = 'recebimentos' and name = p_foto_path
  ) then
    raise exception 'Foto não encontrada no armazenamento. Envie a foto novamente.';
  end if;
end;
$$;

-- Grava a contagem de uma remessa e lança a entrada no destino.
-- p_itens: [{material_id, qtd_recebida, motivo_divergencia, observacao}]
-- Todos os itens da guia precisam estar na lista; material fora da guia
-- entra como item novo com qtd_enviada = 0 (sobra, ou trocado).
-- Retorna true quando há divergência.
create or replace function interno.fn_processar_recebimento(
  p_remessa_id uuid,
  p_destino_id uuid,
  p_itens      jsonb,
  p_data       date
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item       record;
  v_faltou     uuid;
  v_enviada    numeric;
  v_motivo     public.motivo_divergencia;
  v_item_id    uuid;
  v_divergente boolean := false;
begin
  perform interno.fn_checar_itens(p_itens);

  select ri.material_id into v_faltou
    from public.remessa_itens ri
   where ri.remessa_id = p_remessa_id
     and not exists (
       select 1 from jsonb_to_recordset(p_itens) as x (material_id uuid)
        where x.material_id = ri.material_id
     )
   limit 1;
  if v_faltou is not null then
    raise exception 'Informe a contagem de todos os itens da guia. Faltou %.', interno.fn_material_rotulo(v_faltou);
  end if;

  for v_item in
    select x.material_id, x.qtd_recebida, x.motivo_divergencia, x.observacao,
           ri.id as remessa_item_id, ri.qtd_enviada
      from jsonb_to_recordset(p_itens) as x (
             material_id uuid, qtd_recebida numeric,
             motivo_divergencia public.motivo_divergencia, observacao text)
      left join public.remessa_itens ri
        on ri.remessa_id = p_remessa_id and ri.material_id = x.material_id
     order by x.material_id
  loop
    if v_item.qtd_recebida is null or v_item.qtd_recebida < 0 then
      raise exception 'Informe a quantidade contada de %.', interno.fn_material_rotulo(v_item.material_id);
    end if;

    v_enviada := coalesce(v_item.qtd_enviada, 0);

    if v_item.remessa_item_id is null and v_item.qtd_recebida = 0 then
      raise exception 'Item fora da guia precisa de quantidade maior que zero (%).',
        interno.fn_material_rotulo(v_item.material_id);
    end if;

    if v_item.qtd_recebida = v_enviada then
      v_motivo := null;
    elsif v_item.qtd_recebida > v_enviada then
      v_motivo := coalesce(v_item.motivo_divergencia, 'sobra');
      if v_motivo not in ('sobra', 'trocado') then
        raise exception 'Chegou mais % do que o enviado: o motivo deve ser sobra ou trocado.',
          interno.fn_material_rotulo(v_item.material_id);
      end if;
      v_divergente := true;
    else
      v_motivo := v_item.motivo_divergencia;
      if v_motivo is null then
        raise exception 'Informe o motivo da diferença em % (falta, avaria ou trocado).',
          interno.fn_material_rotulo(v_item.material_id);
      end if;
      if v_motivo = 'sobra' then
        raise exception 'Chegou menos % do que o enviado: o motivo não pode ser sobra.',
          interno.fn_material_rotulo(v_item.material_id);
      end if;
      v_divergente := true;
    end if;

    if v_item.remessa_item_id is null then
      insert into public.remessa_itens (remessa_id, material_id, qtd_enviada, qtd_recebida, motivo_divergencia, observacao)
      values (p_remessa_id, v_item.material_id, 0, v_item.qtd_recebida, v_motivo, interno.fn_texto(v_item.observacao))
      returning id into v_item_id;
    else
      update public.remessa_itens
         set qtd_recebida = v_item.qtd_recebida,
             motivo_divergencia = v_motivo,
             observacao = interno.fn_texto(v_item.observacao)
       where id = v_item.remessa_item_id;
    end if;

    perform interno.fn_lancar(p_destino_id, v_item.material_id, v_item.qtd_recebida,
                              'recebimento_remessa', p_data, p_remessa_id => p_remessa_id);
  end loop;

  return v_divergente;
end;
$$;

-- Encerra a remessa (e o pedido) quando não resta divergência em aberto.
create or replace function interno.fn_encerrar_se_resolvida(p_remessa_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pedido_id uuid;
begin
  if exists (
    select 1
      from public.remessa_itens ri
     where ri.remessa_id = p_remessa_id
       and ri.qtd_recebida is not null
       and ri.qtd_recebida <> ri.qtd_enviada
       and abs(ri.qtd_enviada - ri.qtd_recebida)
           - coalesce((select sum(t.quantidade) from public.divergencia_tratamentos t
                        where t.remessa_item_id = ri.id), 0) > 0
  ) then
    return false;
  end if;

  update public.remessas
     set status = 'encerrada', encerrada_em = now()
   where id = p_remessa_id
  returning pedido_id into v_pedido_id;

  if v_pedido_id is not null then
    update public.pedidos
       set status = 'encerrado', encerrado_em = now()
     where id = v_pedido_id;
  end if;

  return true;
end;
$$;

-- ---------------------------------------------------------------------
-- rpc_enviar_pedido: rascunho → solicitado
-- ---------------------------------------------------------------------
create or replace function public.rpc_enviar_pedido(p_pedido_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pedido public.pedidos;
begin
  perform interno.fn_usuario();

  select * into v_pedido from public.pedidos where id = p_pedido_id for update;
  if not found then
    raise exception 'Pedido não encontrado.';
  end if;

  perform interno.fn_exigir_responsavel(v_pedido.solicitante_id);

  if v_pedido.status <> 'rascunho' then
    raise exception 'O pedido % já foi enviado (status: %).', interno.fn_doc('PED', v_pedido.numero), v_pedido.status;
  end if;
  if not exists (select 1 from public.pedido_itens where pedido_id = p_pedido_id) then
    raise exception 'O pedido % não tem itens. Adicione ao menos um item antes de enviar.', interno.fn_doc('PED', v_pedido.numero);
  end if;

  update public.pedidos
     set status = 'solicitado', solicitado_em = now()
   where id = p_pedido_id;
end;
$$;

-- ---------------------------------------------------------------------
-- rpc_aprovar_pedido: grava aprovadas e motivos de corte; → aprovado
-- p_itens: [{material_id, qtd_aprovada, motivo_corte}] cobrindo todo o pedido
-- ---------------------------------------------------------------------
create or replace function public.rpc_aprovar_pedido(p_pedido_id uuid, p_itens jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usuario uuid;
  v_pedido  public.pedidos;
  v_item    record;
begin
  v_usuario := interno.fn_usuario();

  select * into v_pedido from public.pedidos where id = p_pedido_id for update;
  if not found then
    raise exception 'Pedido não encontrado.';
  end if;

  if v_pedido.externo then
    raise exception 'Pedido externo não passa por aprovação no sistema.';
  end if;

  perform interno.fn_exigir_responsavel(v_pedido.atendente_id);
  if v_pedido.status <> 'solicitado' then
    raise exception 'O pedido % não está aguardando aprovação (status: %).', interno.fn_doc('PED', v_pedido.numero), v_pedido.status;
  end if;

  perform interno.fn_checar_itens(p_itens);

  if exists (
    select 1 from jsonb_to_recordset(p_itens) as x (material_id uuid)
     where not exists (select 1 from public.pedido_itens pi
                        where pi.pedido_id = p_pedido_id and pi.material_id = x.material_id)
  ) then
    raise exception 'A aprovação tem item que não está no pedido %.', interno.fn_doc('PED', v_pedido.numero);
  end if;

  for v_item in
    select pi.id, pi.material_id, pi.qtd_solicitada, x.qtd_aprovada, x.motivo_corte
      from public.pedido_itens pi
      left join jsonb_to_recordset(p_itens) as x (material_id uuid, qtd_aprovada numeric, motivo_corte text)
        on x.material_id = pi.material_id
     where pi.pedido_id = p_pedido_id
     order by pi.material_id
  loop
    if v_item.qtd_aprovada is null then
      raise exception 'Informe a quantidade aprovada de %.', interno.fn_material_rotulo(v_item.material_id);
    end if;
    if v_item.qtd_aprovada < 0 then
      raise exception 'Quantidade aprovada negativa em %.', interno.fn_material_rotulo(v_item.material_id);
    end if;
    if v_item.qtd_aprovada < v_item.qtd_solicitada and interno.fn_texto(v_item.motivo_corte) is null then
      raise exception 'Informe o motivo do corte de %.', interno.fn_material_rotulo(v_item.material_id);
    end if;

    update public.pedido_itens
       set qtd_aprovada = v_item.qtd_aprovada,
           motivo_corte = case when v_item.qtd_aprovada < v_item.qtd_solicitada
                               then interno.fn_texto(v_item.motivo_corte) end
     where id = v_item.id;
  end loop;

  if not exists (select 1 from public.pedido_itens where pedido_id = p_pedido_id and qtd_aprovada > 0) then
    raise exception 'Todos os itens foram cortados. Cancele o pedido informando o motivo.';
  end if;

  update public.pedidos
     set status = 'aprovado', aprovado_por = v_usuario, aprovado_em = now()
   where id = p_pedido_id;
end;
$$;

-- ---------------------------------------------------------------------
-- rpc_cancelar_pedido: → cancelado, com motivo
-- Solicitante: rascunho, solicitado, aprovado · Atendente: solicitado, aprovado
-- ---------------------------------------------------------------------
create or replace function public.rpc_cancelar_pedido(p_pedido_id uuid, p_motivo text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usuario uuid;
  v_pedido  public.pedidos;
  v_pode    boolean;
begin
  v_usuario := interno.fn_usuario();

  select * into v_pedido from public.pedidos where id = p_pedido_id for update;
  if not found then
    raise exception 'Pedido não encontrado.';
  end if;

  v_pode := case v_pedido.status
    when 'rascunho'   then public.fn_eh_responsavel(v_pedido.solicitante_id)
    when 'solicitado' then public.fn_eh_responsavel(v_pedido.solicitante_id) or public.fn_eh_responsavel(v_pedido.atendente_id)
    when 'aprovado'   then public.fn_eh_responsavel(v_pedido.solicitante_id) or public.fn_eh_responsavel(v_pedido.atendente_id)
  end;

  if v_pode is null then
    raise exception 'O pedido % não pode mais ser cancelado (status: %).', interno.fn_doc('PED', v_pedido.numero), v_pedido.status;
  end if;
  if not v_pode then
    raise exception 'Você não pode cancelar o pedido %.', interno.fn_doc('PED', v_pedido.numero) using errcode = '42501';
  end if;
  if interno.fn_texto(p_motivo) is null then
    raise exception 'Informe o motivo do cancelamento.';
  end if;

  update public.pedidos
     set status = 'cancelado',
         cancelado_por = v_usuario,
         cancelado_em = now(),
         motivo_cancelamento = interno.fn_texto(p_motivo)
   where id = p_pedido_id;
end;
$$;

-- ---------------------------------------------------------------------
-- rpc_enviar_remessa_pedido: cria remessa e itens, lança envio_remessa
-- na origem, pedido → em_transito. Item fora da lista = não enviado.
-- p_itens: [{material_id, qtd_enviada}]
-- ---------------------------------------------------------------------
create or replace function public.rpc_enviar_remessa_pedido(
  p_pedido_id     uuid,
  p_itens         jsonb,
  p_data_envio    date default null,
  p_documento_ref text default null,
  p_observacao    text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usuario    uuid;
  v_pedido     public.pedidos;
  v_data       date := coalesce(p_data_envio, public.fn_hoje());
  v_remessa_id uuid;
  v_item       record;
begin
  v_usuario := interno.fn_usuario();

  select * into v_pedido from public.pedidos where id = p_pedido_id for update;
  if not found then
    raise exception 'Pedido não encontrado.';
  end if;

  if v_pedido.externo then
    raise exception 'Pedido externo é recebido pela entrada do almoxarifado externo, não enviado.';
  end if;

  perform interno.fn_exigir_responsavel(v_pedido.atendente_id);
  if v_pedido.status <> 'aprovado' then
    raise exception 'O pedido % não está aprovado (status: %).', interno.fn_doc('PED', v_pedido.numero), v_pedido.status;
  end if;

  perform interno.fn_checar_data(v_data, 'data de envio');
  perform interno.fn_checar_itens(p_itens);

  if exists (
    select 1 from jsonb_to_recordset(p_itens) as x (material_id uuid)
     where not exists (select 1 from public.pedido_itens pi
                        where pi.pedido_id = p_pedido_id and pi.material_id = x.material_id)
  ) then
    raise exception 'Só itens do pedido % podem ser enviados nesta remessa.', interno.fn_doc('PED', v_pedido.numero);
  end if;

  insert into public.remessas (tipo, origem_id, destino_id, pedido_id, documento_ref,
                               enviado_por, data_envio, observacao)
  values ('atendimento', v_pedido.atendente_id, v_pedido.solicitante_id, p_pedido_id,
          interno.fn_texto(p_documento_ref), v_usuario, v_data, interno.fn_texto(p_observacao))
  returning id into v_remessa_id;

  for v_item in
    select x.material_id, x.qtd_enviada, pi.qtd_aprovada
      from jsonb_to_recordset(p_itens) as x (material_id uuid, qtd_enviada numeric)
      join public.pedido_itens pi on pi.pedido_id = p_pedido_id and pi.material_id = x.material_id
     order by x.material_id
  loop
    if v_item.qtd_enviada is null or v_item.qtd_enviada < 0 then
      raise exception 'Informe a quantidade enviada de %.', interno.fn_material_rotulo(v_item.material_id);
    end if;
    if v_item.qtd_enviada > coalesce(v_item.qtd_aprovada, 0) then
      raise exception 'Quantidade enviada de % (%) maior que a aprovada (%).',
        interno.fn_material_rotulo(v_item.material_id), trim_scale(v_item.qtd_enviada), trim_scale(coalesce(v_item.qtd_aprovada, 0));
    end if;
    continue when v_item.qtd_enviada = 0;

    insert into public.remessa_itens (remessa_id, material_id, qtd_enviada)
    values (v_remessa_id, v_item.material_id, v_item.qtd_enviada);

    perform interno.fn_lancar(v_pedido.atendente_id, v_item.material_id, -v_item.qtd_enviada,
                              'envio_remessa', v_data, p_remessa_id => v_remessa_id);
  end loop;

  if not exists (select 1 from public.remessa_itens where remessa_id = v_remessa_id) then
    raise exception 'Nenhuma quantidade informada para envio. Informe o que foi separado ou cancele o pedido.';
  end if;

  update public.pedidos set status = 'em_transito' where id = p_pedido_id;

  return v_remessa_id;
end;
$$;

-- ---------------------------------------------------------------------
-- rpc_criar_remessa_avulsa: transferência (base → base do mesmo
-- supervisor) ou devolução (base → almox pai). Cria remessa e lança envio.
-- p_itens: [{material_id, qtd_enviada}]
-- ---------------------------------------------------------------------
create or replace function public.rpc_criar_remessa_avulsa(
  p_tipo          public.tipo_remessa,
  p_origem_id     uuid,
  p_destino_id    uuid,
  p_itens         jsonb,
  p_data_envio    date default null,
  p_documento_ref text default null,
  p_observacao    text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usuario    uuid;
  v_origem     public.almoxarifados;
  v_destino    public.almoxarifados;
  v_data       date := coalesce(p_data_envio, public.fn_hoje());
  v_remessa_id uuid;
  v_item       record;
begin
  v_usuario := interno.fn_usuario();

  if p_tipo is null or p_tipo not in ('transferencia', 'devolucao') then
    raise exception 'Remessa avulsa é transferência ou devolução.';
  end if;

  select * into v_origem from public.almoxarifados where id = p_origem_id;
  if not found then
    raise exception 'Almoxarifado de origem não encontrado.';
  end if;

  perform interno.fn_exigir_responsavel(p_origem_id);

  if v_origem.tipo <> 'base' then
    raise exception 'Transferência e devolução saem de uma base.';
  end if;

  if p_tipo = 'devolucao' then
    if p_destino_id is not null and p_destino_id <> v_origem.pai_id then
      raise exception 'A devolução de % vai sempre para %.', v_origem.nome, interno.fn_almox_nome(v_origem.pai_id);
    end if;
    select * into v_destino from public.almoxarifados where id = v_origem.pai_id;
  else
    select * into v_destino from public.almoxarifados where id = p_destino_id;
    if not found then
      raise exception 'Informe a base de destino.';
    end if;
    if v_destino.tipo <> 'base' or v_destino.id = v_origem.id then
      raise exception 'Transferência é entre duas bases diferentes.';
    end if;
    if not interno.fn_mesmo_supervisor(v_origem.id, v_destino.id) then
      raise exception '% e % têm supervisores diferentes. Devolva o material a %, que faz o reenvio.',
        v_origem.nome, v_destino.nome, interno.fn_almox_nome(v_origem.pai_id);
    end if;
  end if;

  if not v_destino.ativo then
    raise exception '% está inativo.', v_destino.nome;
  end if;

  perform interno.fn_checar_data(v_data, 'data de envio');
  perform interno.fn_checar_itens(p_itens);

  insert into public.remessas (tipo, origem_id, destino_id, documento_ref, enviado_por, data_envio, observacao)
  values (p_tipo, v_origem.id, v_destino.id, interno.fn_texto(p_documento_ref), v_usuario, v_data,
          interno.fn_texto(p_observacao))
  returning id into v_remessa_id;

  for v_item in
    select x.material_id, x.qtd_enviada
      from jsonb_to_recordset(p_itens) as x (material_id uuid, qtd_enviada numeric)
     order by x.material_id
  loop
    if v_item.qtd_enviada is null or v_item.qtd_enviada <= 0 then
      raise exception 'Informe uma quantidade maior que zero para %.', interno.fn_material_rotulo(v_item.material_id);
    end if;

    insert into public.remessa_itens (remessa_id, material_id, qtd_enviada)
    values (v_remessa_id, v_item.material_id, v_item.qtd_enviada);

    perform interno.fn_lancar(v_origem.id, v_item.material_id, -v_item.qtd_enviada,
                              'envio_remessa', v_data, p_remessa_id => v_remessa_id);
  end loop;

  return v_remessa_id;
end;
$$;

-- ---------------------------------------------------------------------
-- rpc_registrar_recebimento: contagem, data real, quem contou, foto;
-- lança recebimento_remessa; define status da remessa e do pedido.
-- Quem registrou o envio não registra o recebimento, exceto entre bases
-- (hoje o mesmo supervisor responde pelas duas pontas; o segundo lado é
-- quem contou + foto da guia assinada).
-- ---------------------------------------------------------------------
create or replace function public.rpc_registrar_recebimento(
  p_remessa_id         uuid,
  p_data_recebimento   date,
  p_conferido_por_nome text,
  p_foto_path          text,
  p_itens              jsonb
)
returns public.status_remessa
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usuario    uuid;
  v_remessa    public.remessas;
  v_entre_bases boolean;
  v_divergente boolean;
  v_status     public.status_remessa;
begin
  v_usuario := interno.fn_usuario();

  select * into v_remessa from public.remessas where id = p_remessa_id for update;
  if not found then
    raise exception 'Remessa não encontrada.';
  end if;

  perform interno.fn_exigir_responsavel(v_remessa.destino_id);

  if v_remessa.tipo = 'externa' then
    raise exception 'Remessa do almoxarifado externo já é registrada como recebida.';
  end if;
  if v_remessa.status <> 'em_transito' then
    raise exception 'A remessa % já teve o recebimento registrado.', interno.fn_doc('REM', v_remessa.numero);
  end if;

  select bool_and(tipo = 'base') into v_entre_bases
    from public.almoxarifados where id in (v_remessa.origem_id, v_remessa.destino_id);

  if v_remessa.enviado_por = v_usuario and not v_entre_bases then
    raise exception 'Quem registrou o envio da % não pode registrar o recebimento. O responsável de % deve lançar a conferência.',
      interno.fn_doc('REM', v_remessa.numero), interno.fn_almox_nome(v_remessa.destino_id)
      using errcode = '42501';
  end if;

  perform interno.fn_checar_data(p_data_recebimento, 'data de recebimento');
  if p_data_recebimento < v_remessa.data_envio then
    raise exception 'A data de recebimento (%) é anterior à data de envio (%).',
      to_char(p_data_recebimento, 'DD/MM/YYYY'), to_char(v_remessa.data_envio, 'DD/MM/YYYY');
  end if;
  if interno.fn_texto(p_conferido_por_nome) is null then
    raise exception 'Informe o nome de quem contou o material.';
  end if;
  perform interno.fn_checar_foto(p_remessa_id, p_foto_path);

  v_divergente := interno.fn_processar_recebimento(p_remessa_id, v_remessa.destino_id, p_itens, p_data_recebimento);
  v_status := case when v_divergente then 'com_divergencia' else 'encerrada' end;

  update public.remessas
     set status = v_status,
         data_recebimento = p_data_recebimento,
         conferido_por_nome = interno.fn_texto(p_conferido_por_nome),
         foto_path = p_foto_path,
         recebido_registrado_por = v_usuario,
         recebido_registrado_em = now(),
         encerrada_em = case when v_divergente then null else now() end
   where id = p_remessa_id;

  if v_remessa.pedido_id is not null then
    update public.pedidos
       set status = case when v_divergente then 'com_divergencia'::public.status_pedido else 'encerrado' end,
           encerrado_em = case when v_divergente then null else now() end
     where id = v_remessa.pedido_id;
  end if;

  return v_status;
end;
$$;

-- ---------------------------------------------------------------------
-- rpc_registrar_recebimento_externo: entrada do 3256 no almox regional,
-- com ou sem pedido (sem pedido = entrada avulsa). O id da remessa é
-- gerado pelo app, porque a foto sobe antes em {remessa_id}/{uuid}.jpg.
-- p_itens: [{material_id, qtd_enviada (documento SAP), qtd_recebida,
--            motivo_divergencia, observacao}]
-- ---------------------------------------------------------------------
create or replace function public.rpc_registrar_recebimento_externo(
  p_remessa_id         uuid,
  p_destino_id         uuid,
  p_documento_ref      text,
  p_data_recebimento   date,
  p_conferido_por_nome text,
  p_foto_path          text,
  p_itens              jsonb,
  p_pedido_id          uuid default null,
  p_data_envio         date default null,
  p_observacao         text default null
)
returns public.status_remessa
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usuario    uuid;
  v_destino    public.almoxarifados;
  v_pedido     public.pedidos;
  v_data_envio date := coalesce(p_data_envio, p_data_recebimento);
  v_divergente boolean;
  v_status     public.status_remessa;
begin
  v_usuario := interno.fn_usuario();

  if p_remessa_id is null then
    raise exception 'Informe o identificador da remessa gerado pelo app.';
  end if;
  if exists (select 1 from public.remessas where id = p_remessa_id) then
    raise exception 'Esta entrada já foi registrada.';
  end if;

  select * into v_destino from public.almoxarifados where id = p_destino_id;
  if not found then
    raise exception 'Almoxarifado de destino não encontrado.';
  end if;

  perform interno.fn_exigir_responsavel(p_destino_id);

  if v_destino.tipo <> 'regional' then
    raise exception 'Entrada do almoxarifado externo só no almoxarifado regional.';
  end if;

  if p_pedido_id is not null then
    select * into v_pedido from public.pedidos where id = p_pedido_id for update;
    if not found then
      raise exception 'Pedido não encontrado.';
    end if;
    if not v_pedido.externo or v_pedido.solicitante_id <> p_destino_id then
      raise exception 'O pedido % não é um pedido externo de %.', interno.fn_doc('PED', v_pedido.numero), v_destino.nome;
    end if;
    if v_pedido.status <> 'solicitado' then
      raise exception 'O pedido % não está aguardando entrega (status: %).', interno.fn_doc('PED', v_pedido.numero), v_pedido.status;
    end if;
  end if;

  if interno.fn_texto(p_documento_ref) is null then
    raise exception 'Informe o número do documento SAP.';
  end if;
  perform interno.fn_checar_data(p_data_recebimento, 'data de recebimento');
  perform interno.fn_checar_data(v_data_envio, 'data do documento');
  if v_data_envio > p_data_recebimento then
    raise exception 'A data do documento (%) é posterior à data de recebimento (%).',
      to_char(v_data_envio, 'DD/MM/YYYY'), to_char(p_data_recebimento, 'DD/MM/YYYY');
  end if;
  if interno.fn_texto(p_conferido_por_nome) is null then
    raise exception 'Informe o nome de quem contou o material.';
  end if;
  perform interno.fn_checar_foto(p_remessa_id, p_foto_path);
  perform interno.fn_checar_itens(p_itens);

  if exists (
    select 1 from jsonb_to_recordset(p_itens) as x (qtd_enviada numeric)
     where x.qtd_enviada is null or x.qtd_enviada < 0
  ) then
    raise exception 'Informe a quantidade do documento SAP em todos os itens (0 se não constar).';
  end if;

  insert into public.remessas (id, tipo, origem_id, destino_id, pedido_id, documento_ref,
                               enviado_por, data_envio, observacao)
  values (p_remessa_id, 'externa', v_destino.pai_id, p_destino_id, p_pedido_id,
          interno.fn_texto(p_documento_ref), v_usuario, v_data_envio, interno.fn_texto(p_observacao));

  insert into public.remessa_itens (remessa_id, material_id, qtd_enviada)
  select p_remessa_id, x.material_id, x.qtd_enviada
    from jsonb_to_recordset(p_itens) as x (material_id uuid, qtd_enviada numeric)
   where x.qtd_enviada > 0
   order by x.material_id;

  v_divergente := interno.fn_processar_recebimento(p_remessa_id, p_destino_id, p_itens, p_data_recebimento);
  v_status := case when v_divergente then 'com_divergencia' else 'encerrada' end;

  update public.remessas
     set status = v_status,
         data_recebimento = p_data_recebimento,
         conferido_por_nome = interno.fn_texto(p_conferido_por_nome),
         foto_path = p_foto_path,
         recebido_registrado_por = v_usuario,
         recebido_registrado_em = now(),
         encerrada_em = case when v_divergente then null else now() end
   where id = p_remessa_id;

  if p_pedido_id is not null then
    update public.pedidos
       set status = case when v_divergente then 'com_divergencia'::public.status_pedido else 'encerrado' end,
           encerrado_em = case when v_divergente then null else now() end
     where id = p_pedido_id;
  end if;

  return v_status;
end;
$$;

-- ---------------------------------------------------------------------
-- rpc_tratar_divergencia: registra o tratamento e seus efeitos; encerra
-- remessa e pedido quando tudo estiver resolvido.
--   Falta (enviado > recebido): reenvio · baixa_transito (origem)
--                               chegou_depois (destino)
--   Sobra (recebido > enviado): ajuste_origem (origem)
--   Remessa externa: externo · chegou_depois (destino)
-- ---------------------------------------------------------------------
create or replace function public.rpc_tratar_divergencia(
  p_remessa_item_id uuid,
  p_tipo            public.tipo_tratamento,
  p_quantidade      numeric,
  p_justificativa   text,
  p_data_ocorrencia date default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usuario       uuid;
  v_item          public.remessa_itens;
  v_remessa       public.remessas;
  v_diferenca     numeric;
  v_em_aberto     numeric;
  v_data          date := coalesce(p_data_ocorrencia, public.fn_hoje());
  v_nova_remessa  uuid;
  v_tratamento_id uuid;
begin
  v_usuario := interno.fn_usuario();

  select r.* into v_remessa
    from public.remessas r
    join public.remessa_itens ri on ri.remessa_id = r.id
   where ri.id = p_remessa_item_id
     for update of r;
  if not found then
    raise exception 'Item de remessa não encontrado.';
  end if;

  select * into v_item from public.remessa_itens where id = p_remessa_item_id;

  if v_remessa.status <> 'com_divergencia' then
    raise exception 'A remessa % não tem divergência em aberto.', interno.fn_doc('REM', v_remessa.numero);
  end if;

  v_diferenca := v_item.qtd_enviada - coalesce(v_item.qtd_recebida, v_item.qtd_enviada);
  if v_diferenca = 0 then
    raise exception 'Este item não tem divergência.';
  end if;

  v_em_aberto := abs(v_diferenca) - coalesce(
    (select sum(quantidade) from public.divergencia_tratamentos where remessa_item_id = p_remessa_item_id), 0);
  if v_em_aberto <= 0 then
    raise exception 'A divergência de % já foi tratada.', interno.fn_material_rotulo(v_item.material_id);
  end if;

  if p_tipo is null then
    raise exception 'Informe o tipo de tratamento.';
  end if;

  -- Tratamento compatível com a remessa e com o sentido da diferença,
  -- e quem pode registrá-lo.
  if v_remessa.tipo = 'externa' then
    if p_tipo not in ('externo', 'chegou_depois') then
      raise exception 'Divergência em remessa do almoxarifado externo: use "externo" ou "chegou depois".';
    end if;
    if p_tipo = 'chegou_depois' and v_diferenca < 0 then
      raise exception '"Chegou depois" só vale para falta.';
    end if;
    perform interno.fn_exigir_responsavel(v_remessa.destino_id);
  else
    if p_tipo = 'externo' then
      raise exception '"Externo" só vale para remessas do almoxarifado externo.';
    end if;
    if v_diferenca > 0 and p_tipo = 'ajuste_origem' then
      raise exception 'Ajuste na origem só vale para sobra (chegou mais do que o enviado).';
    end if;
    if v_diferenca < 0 and p_tipo <> 'ajuste_origem' then
      raise exception 'Para sobra, o tratamento é o ajuste na origem.';
    end if;
    if p_tipo = 'chegou_depois' then
      perform interno.fn_exigir_responsavel(v_remessa.destino_id);
    else
      perform interno.fn_exigir_responsavel(v_remessa.origem_id);
    end if;
  end if;

  if p_quantidade is null or p_quantidade <= 0 then
    raise exception 'Informe uma quantidade maior que zero.';
  end if;
  if p_quantidade > v_em_aberto then
    raise exception 'Quantidade maior que a divergência em aberto (%).', trim_scale(v_em_aberto);
  end if;
  perform interno.fn_checar_fracao(v_item.material_id, p_quantidade);

  if interno.fn_texto(p_justificativa) is null then
    raise exception 'Informe a justificativa do tratamento.';
  end if;

  perform interno.fn_checar_data(v_data, 'data do tratamento');
  if v_data < v_remessa.data_recebimento then
    raise exception 'A data do tratamento é anterior ao recebimento da remessa (%).',
      to_char(v_remessa.data_recebimento, 'DD/MM/YYYY');
  end if;

  if p_tipo = 'reenvio' then
    insert into public.remessas (tipo, origem_id, destino_id, remessa_ref_id, enviado_por, data_envio, observacao)
    values ('reenvio', v_remessa.origem_id, v_remessa.destino_id, v_remessa.id, v_usuario, v_data,
            'Reenvio da ' || interno.fn_doc('REM', v_remessa.numero) || ': ' || interno.fn_texto(p_justificativa))
    returning id into v_nova_remessa;

    insert into public.remessa_itens (remessa_id, material_id, qtd_enviada)
    values (v_nova_remessa, v_item.material_id, p_quantidade);

    perform interno.fn_lancar(v_remessa.origem_id, v_item.material_id, -p_quantidade,
                              'envio_remessa', v_data, p_remessa_id => v_nova_remessa);
  end if;

  insert into public.divergencia_tratamentos (remessa_item_id, tipo, quantidade, justificativa,
                                              data_ocorrencia, remessa_gerada_id, tratado_por)
  values (p_remessa_item_id, p_tipo, p_quantidade, interno.fn_texto(p_justificativa),
          v_data, v_nova_remessa, v_usuario)
  returning id into v_tratamento_id;

  if p_tipo = 'chegou_depois' then
    perform interno.fn_lancar(v_remessa.destino_id, v_item.material_id, p_quantidade,
                              'recebimento_remessa', v_data, p_tratamento_id => v_tratamento_id);
  elsif p_tipo = 'ajuste_origem' then
    perform interno.fn_lancar(v_remessa.origem_id, v_item.material_id, -p_quantidade,
                              'ajuste_divergencia', v_data, p_tratamento_id => v_tratamento_id);
  end if;

  perform interno.fn_encerrar_se_resolvida(v_remessa.id);

  return v_tratamento_id;
end;
$$;

-- ---------------------------------------------------------------------
-- rpc_registrar_saida: cria a saída e lança `saida`
-- p_itens: [{material_id, quantidade}]
-- ---------------------------------------------------------------------
create or replace function public.rpc_registrar_saida(
  p_almox_id        uuid,
  p_itens           jsonb,
  p_motivo          public.motivo_saida default 'aplicacao',
  p_data_ocorrencia date default null,
  p_justificativa   text default null,
  p_observacao      text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usuario  uuid;
  v_almox    public.almoxarifados;
  v_motivo   public.motivo_saida := coalesce(p_motivo, 'aplicacao');
  v_data     date := coalesce(p_data_ocorrencia, public.fn_hoje());
  v_saida_id uuid;
  v_item     record;
begin
  v_usuario := interno.fn_usuario();

  select * into v_almox from public.almoxarifados where id = p_almox_id;
  if not found then
    raise exception 'Almoxarifado não encontrado.';
  end if;

  perform interno.fn_exigir_responsavel(p_almox_id);

  if v_almox.tipo = 'externo' then
    raise exception 'O almoxarifado externo não registra saídas no sistema.';
  end if;
  if v_motivo <> 'aplicacao' and interno.fn_texto(p_justificativa) is null then
    raise exception 'Informe a justificativa da %.', v_motivo;
  end if;

  perform interno.fn_checar_data(v_data, 'data da saída');
  perform interno.fn_checar_itens(p_itens);

  insert into public.saidas (almox_id, motivo, data_ocorrencia, justificativa, observacao, registrado_por)
  values (p_almox_id, v_motivo, v_data, interno.fn_texto(p_justificativa), interno.fn_texto(p_observacao), v_usuario)
  returning id into v_saida_id;

  for v_item in
    select x.material_id, x.quantidade
      from jsonb_to_recordset(p_itens) as x (material_id uuid, quantidade numeric)
     order by x.material_id
  loop
    if v_item.quantidade is null or v_item.quantidade <= 0 then
      raise exception 'Informe uma quantidade maior que zero para %.', interno.fn_material_rotulo(v_item.material_id);
    end if;

    insert into public.saida_itens (saida_id, material_id, quantidade)
    values (v_saida_id, v_item.material_id, v_item.quantidade);

    perform interno.fn_lancar(p_almox_id, v_item.material_id, -v_item.quantidade,
                              'saida', v_data, p_saida_id => v_saida_id);
  end loop;

  return v_saida_id;
end;
$$;

-- ---------------------------------------------------------------------
-- rpc_registrar_ajuste: calcula a diferença contra o saldo e lança.
-- inventario: responsável do almox · implantacao (saldo inicial): admin
-- p_itens: [{material_id, qtd_contada}]
-- ---------------------------------------------------------------------
create or replace function public.rpc_registrar_ajuste(
  p_almox_id        uuid,
  p_tipo            public.tipo_ajuste,
  p_justificativa   text,
  p_itens           jsonb,
  p_data_ocorrencia date default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usuario   uuid;
  v_almox     public.almoxarifados;
  v_data      date := coalesce(p_data_ocorrencia, public.fn_hoje());
  v_ajuste_id uuid;
  v_item      record;
  v_saldo     numeric;
begin
  v_usuario := interno.fn_usuario();

  select * into v_almox from public.almoxarifados where id = p_almox_id;
  if not found then
    raise exception 'Almoxarifado não encontrado.';
  end if;

  if p_tipo is null then
    raise exception 'Informe o tipo de ajuste.';
  elsif p_tipo = 'implantacao' then
    if not public.fn_eh_admin() then
      raise exception 'Só o administrador carrega o saldo inicial.' using errcode = '42501';
    end if;
  else
    perform interno.fn_exigir_responsavel(p_almox_id);
  end if;

  if v_almox.tipo = 'externo' then
    raise exception 'O almoxarifado externo não tem saldo no sistema.';
  end if;
  if interno.fn_texto(p_justificativa) is null then
    raise exception 'Informe a justificativa do ajuste.';
  end if;

  perform interno.fn_checar_data(v_data, 'data da contagem');
  perform interno.fn_checar_itens(p_itens);

  insert into public.ajustes (almox_id, tipo, justificativa, data_ocorrencia, registrado_por)
  values (p_almox_id, p_tipo, interno.fn_texto(p_justificativa), v_data, v_usuario)
  returning id into v_ajuste_id;

  for v_item in
    select x.material_id, x.qtd_contada
      from jsonb_to_recordset(p_itens) as x (material_id uuid, qtd_contada numeric)
     order by x.material_id
  loop
    if v_item.qtd_contada is null or v_item.qtd_contada < 0 then
      raise exception 'Informe a quantidade contada de %.', interno.fn_material_rotulo(v_item.material_id);
    end if;

    perform interno.fn_travar_saldo(p_almox_id, v_item.material_id);
    v_saldo := interno.fn_saldo(p_almox_id, v_item.material_id);

    insert into public.ajuste_itens (ajuste_id, material_id, saldo_sistema, qtd_contada)
    values (v_ajuste_id, v_item.material_id, v_saldo, v_item.qtd_contada);

    perform interno.fn_lancar(
      p_almox_id, v_item.material_id, v_item.qtd_contada - v_saldo,
      case p_tipo when 'implantacao' then 'saldo_inicial'::public.tipo_movimentacao
                  else 'ajuste_inventario'::public.tipo_movimentacao end,
      v_data, p_ajuste_id => v_ajuste_id);
  end loop;

  return v_ajuste_id;
end;
$$;

-- ---------------------------------------------------------------------
-- fn_destinos_transferencia: bases ativas com o mesmo supervisor da origem
-- (para a tela de transferência, que não enxerga atribuições alheias)
-- ---------------------------------------------------------------------
create or replace function public.fn_destinos_transferencia(p_origem_id uuid)
returns setof public.almoxarifados
language sql
stable
security definer
set search_path = ''
as $$
  select a.*
    from public.almoxarifados a
   where public.fn_eh_responsavel(p_origem_id)
     and a.tipo = 'base'
     and a.ativo
     and a.id <> p_origem_id
     and interno.fn_mesmo_supervisor(p_origem_id, a.id)
   order by a.nome
$$;

-- ---------------------------------------------------------------------
-- Privilégios
-- ---------------------------------------------------------------------
revoke execute on all functions in schema public from public, anon;
grant execute on all functions in schema public to authenticated;
revoke execute on all functions in schema interno from public;
