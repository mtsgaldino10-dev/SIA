-- =====================================================================
-- SIA · Correções da revisão final
--   I1 idempotência: saída, remessa avulsa e ajuste aceitam p_id gerado
--      pelo app; repetir a mesma chamada devolve o mesmo registro
--   I2 erro_contagem: o destino corrige sobra que foi erro de digitação
--      (saída de ajuste no próprio destino)
--   I3 estorno_origem: a origem devolve ao próprio saldo a falta que
--      nunca saiu (separou menos do que registrou, ou mandou trocado)
--   I4 implantação só enquanto o almoxarifado não operou
-- =====================================================================

alter type public.tipo_tratamento add value if not exists 'erro_contagem';
alter type public.tipo_tratamento add value if not exists 'estorno_origem';

-- Mesmo id, mesmo autor e mesmo almoxarifado: é a mesma chamada repetida.
create or replace function interno.fn_id_repetido(p_existe boolean, p_mesmo_autor boolean)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
begin
  if not p_existe then
    return false;
  end if;
  if not p_mesmo_autor then
    raise exception 'Este identificador já foi usado em outro registro.';
  end if;
  return true;
end;
$$;

-- ---------------------------------------------------------------------
-- rpc_registrar_saida (+ p_id)
-- ---------------------------------------------------------------------
drop function public.rpc_registrar_saida(uuid, jsonb, public.motivo_saida, date, text, text);

create function public.rpc_registrar_saida(
  p_almox_id        uuid,
  p_itens           jsonb,
  p_motivo          public.motivo_saida default 'aplicacao',
  p_data_ocorrencia date default null,
  p_justificativa   text default null,
  p_observacao      text default null,
  p_id              uuid default null
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

  if p_id is not null and interno.fn_id_repetido(
       exists (select 1 from public.saidas where id = p_id),
       exists (select 1 from public.saidas where id = p_id and registrado_por = v_usuario and almox_id = p_almox_id)) then
    return p_id;
  end if;

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

  insert into public.saidas (id, almox_id, motivo, data_ocorrencia, justificativa, observacao, registrado_por)
  values (coalesce(p_id, gen_random_uuid()), p_almox_id, v_motivo, v_data, interno.fn_texto(p_justificativa),
          interno.fn_texto(p_observacao), v_usuario)
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
-- rpc_criar_remessa_avulsa (+ p_id)
-- ---------------------------------------------------------------------
drop function public.rpc_criar_remessa_avulsa(public.tipo_remessa, uuid, uuid, jsonb, date, text, text);

create function public.rpc_criar_remessa_avulsa(
  p_tipo          public.tipo_remessa,
  p_origem_id     uuid,
  p_destino_id    uuid,
  p_itens         jsonb,
  p_data_envio    date default null,
  p_documento_ref text default null,
  p_observacao    text default null,
  p_id            uuid default null
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

  if p_id is not null and interno.fn_id_repetido(
       exists (select 1 from public.remessas where id = p_id),
       exists (select 1 from public.remessas where id = p_id and enviado_por = v_usuario and origem_id = p_origem_id and tipo = p_tipo)) then
    return p_id;
  end if;

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

  insert into public.remessas (id, tipo, origem_id, destino_id, documento_ref, enviado_por, data_envio, observacao)
  values (coalesce(p_id, gen_random_uuid()), p_tipo, v_origem.id, v_destino.id, interno.fn_texto(p_documento_ref),
          v_usuario, v_data, interno.fn_texto(p_observacao))
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
-- rpc_registrar_ajuste (+ p_id; implantação só antes de operar)
-- ---------------------------------------------------------------------
drop function public.rpc_registrar_ajuste(uuid, public.tipo_ajuste, text, jsonb, date);

create function public.rpc_registrar_ajuste(
  p_almox_id        uuid,
  p_tipo            public.tipo_ajuste,
  p_justificativa   text,
  p_itens           jsonb,
  p_data_ocorrencia date default null,
  p_id              uuid default null
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

  if p_id is not null and interno.fn_id_repetido(
       exists (select 1 from public.ajustes where id = p_id),
       exists (select 1 from public.ajustes where id = p_id and registrado_por = v_usuario and almox_id = p_almox_id)) then
    return p_id;
  end if;

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
    if exists (select 1 from public.movimentacoes where almox_id = p_almox_id and tipo <> 'saldo_inicial') then
      raise exception 'O saldo inicial de % não pode mais ser carregado: o almoxarifado já está em operação. Use ajuste de inventário.',
        v_almox.nome;
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

  insert into public.ajustes (id, almox_id, tipo, justificativa, data_ocorrencia, registrado_por)
  values (coalesce(p_id, gen_random_uuid()), p_almox_id, p_tipo, interno.fn_texto(p_justificativa), v_data, v_usuario)
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
-- rpc_tratar_divergencia (+ erro_contagem e estorno_origem)
--   Falta (enviado > recebido): reenvio · baixa_transito · estorno_origem (origem)
--                               chegou_depois (destino)
--   Sobra (recebido > enviado): ajuste_origem (origem) · erro_contagem (destino)
--   Remessa externa: externo · chegou_depois (falta) · erro_contagem (sobra) — destino
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
  v_do_destino    boolean;
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

  -- Sentido da diferença
  if v_diferenca > 0 and p_tipo in ('ajuste_origem', 'erro_contagem') then
    raise exception '"%" só vale para sobra (chegou mais do que o enviado).',
      case p_tipo when 'ajuste_origem' then 'Ajuste na origem' else 'Erro de contagem' end;
  end if;
  if v_diferenca < 0 and p_tipo in ('reenvio', 'baixa_transito', 'chegou_depois', 'estorno_origem') then
    raise exception '"%" só vale para falta (chegou menos do que o enviado).',
      case p_tipo when 'reenvio' then 'Reenvio' when 'baixa_transito' then 'Baixa em trânsito'
                  when 'chegou_depois' then 'Chegou depois' else 'Não saiu da origem' end;
  end if;

  -- Tipo de remessa e quem registra
  if v_remessa.tipo = 'externa' then
    if p_tipo not in ('externo', 'chegou_depois', 'erro_contagem') then
      raise exception 'Divergência em remessa do almoxarifado externo: use "externo", "chegou depois" ou "erro de contagem".';
    end if;
    v_do_destino := true;
  else
    if p_tipo = 'externo' then
      raise exception '"Externo" só vale para remessas do almoxarifado externo.';
    end if;
    v_do_destino := p_tipo in ('chegou_depois', 'erro_contagem');
  end if;

  if v_do_destino then
    perform interno.fn_exigir_responsavel(v_remessa.destino_id);
  else
    perform interno.fn_exigir_responsavel(v_remessa.origem_id);
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
  elsif p_tipo = 'estorno_origem' then
    perform interno.fn_lancar(v_remessa.origem_id, v_item.material_id, p_quantidade,
                              'ajuste_divergencia', v_data, p_tratamento_id => v_tratamento_id);
  elsif p_tipo = 'erro_contagem' then
    perform interno.fn_lancar(v_remessa.destino_id, v_item.material_id, -p_quantidade,
                              'ajuste_divergencia', v_data, p_tratamento_id => v_tratamento_id);
  end if;

  perform interno.fn_encerrar_se_resolvida(v_remessa.id);

  return v_tratamento_id;
end;
$$;

-- ---------------------------------------------------------------------
-- Privilégios
-- ---------------------------------------------------------------------
revoke execute on all functions in schema public from public, anon;
grant execute on all functions in schema public to authenticated;
revoke execute on all functions in schema interno from public;
