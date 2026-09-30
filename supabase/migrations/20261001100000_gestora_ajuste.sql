-- =====================================================================
-- Warefly · Fundação 1 — Gestora do almoxarifado, ajuste só pela gestão,
-- sigla SAP das unidades e cadastros sem exclusão
-- =====================================================================

-- ---------------------------------------------------------------------
-- Gestora do almoxarifado = responsável de um almoxarifado regional
-- ---------------------------------------------------------------------
create or replace function public.fn_eh_gestora()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.atribuicoes a
      join public.perfis p on p.id = a.usuario_id
      join public.almoxarifados g on g.id = a.almox_id
     where a.usuario_id = (select auth.uid())
       and a.funcao = 'responsavel'
       and g.tipo = 'regional'
       and p.ativo
  )
$$;

-- O local é um regional de que o usuário é responsável, ou uma base dele.
create or replace function public.fn_gere_local(p_almox_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.almoxarifados l
      join public.atribuicoes a on a.almox_id in (l.id, l.pai_id)
      join public.perfis p on p.id = a.usuario_id
      join public.almoxarifados g on g.id = a.almox_id
     where l.id = p_almox_id
       and a.usuario_id = (select auth.uid())
       and a.funcao = 'responsavel'
       and g.tipo = 'regional'
       and p.ativo
  )
$$;

-- ---------------------------------------------------------------------
-- rpc_registrar_ajuste: só a gestão do almoxarifado e o admin ajustam
-- (mesma assinatura; muda só a permissão)
-- ---------------------------------------------------------------------
create or replace function public.rpc_registrar_ajuste(
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
  end if;
  if not (public.fn_eh_admin() or public.fn_gere_local(p_almox_id)) then
    raise exception 'O estoque de % é ajustado pela gestão do almoxarifado ou pelo administrador.', v_almox.nome
      using errcode = '42501';
  end if;
  if p_tipo = 'implantacao'
     and exists (select 1 from public.movimentacoes where almox_id = p_almox_id and tipo <> 'saldo_inicial') then
    raise exception 'O saldo inicial de % não pode mais ser carregado: o almoxarifado já está em operação. Use ajuste de inventário.',
      v_almox.nome;
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
-- Sigla SAP: como a unidade aparece na coluna UMB das planilhas do SAP
-- ---------------------------------------------------------------------
alter table public.unidades
  add column sigla_sap text unique,
  add constraint unidades_sigla_sap_ck check (sigla_sap is null or (sigla_sap = btrim(sigla_sap) and sigla_sap <> ''));

comment on column public.unidades.sigla_sap is
  'Como a unidade aparece na coluna UMB das planilhas do SAP (ex.: PEÇ para PC).';

update public.unidades u
   set sigla_sap = v.sigla
  from (values ('PC', 'PEÇ'), ('CJ', 'CJ'), ('M', 'M'), ('KG', 'KG')) as v (codigo, sigla)
 where u.codigo = v.codigo;

-- ---------------------------------------------------------------------
-- Material e local não são apagados: são inativados
-- ---------------------------------------------------------------------
revoke delete on public.materiais, public.almoxarifados from authenticated;

-- ---------------------------------------------------------------------
-- Privilégios
-- ---------------------------------------------------------------------
revoke execute on all functions in schema public from public, anon;
grant execute on all functions in schema public to authenticated;
revoke execute on all functions in schema interno from public;
