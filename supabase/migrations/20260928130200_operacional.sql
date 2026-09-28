-- =====================================================================
-- SIA · Passo 1.2 — Tabelas operacionais e numeração
-- Números exibidos: PED-000123, REM-000123, SAI-000123, AJU-000123.
-- =====================================================================

-- ---------------------------------------------------------------------
-- pedidos
-- ---------------------------------------------------------------------
create table public.pedidos (
  id                   uuid primary key default gen_random_uuid(),
  numero               bigint generated always as identity unique,
  solicitante_id       uuid not null references public.almoxarifados (id),
  atendente_id         uuid not null references public.almoxarifados (id),
  externo              boolean not null default false,
  status               public.status_pedido not null default 'rascunho',
  observacao           text,
  criado_por           uuid not null default auth.uid() references public.perfis (id),
  criado_em            timestamptz not null default now(),
  solicitado_em        timestamptz,
  aprovado_por         uuid references public.perfis (id),
  aprovado_em          timestamptz,
  encerrado_em         timestamptz,
  cancelado_por        uuid references public.perfis (id),
  cancelado_em         timestamptz,
  motivo_cancelamento  text,
  constraint pedidos_almox_ck check (solicitante_id <> atendente_id),
  constraint pedidos_cancelamento_ck check (
    (status = 'cancelado') = (cancelado_em is not null and nullif(btrim(motivo_cancelamento), '') is not null)
  )
);

create index pedidos_solicitante_idx on public.pedidos (solicitante_id);
create index pedidos_atendente_idx on public.pedidos (atendente_id);
create index pedidos_status_idx on public.pedidos (status);

-- O atendente é sempre o pai do solicitante; externo quando o pai é o 3256.
create or replace function interno.tg_pedido_atendente()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pai      uuid;
  v_tipo_pai public.tipo_almox;
begin
  select a.pai_id, p.tipo
    into v_pai, v_tipo_pai
    from public.almoxarifados a
    left join public.almoxarifados p on p.id = a.pai_id
   where a.id = new.solicitante_id;

  if v_pai is null then
    raise exception 'Este almoxarifado não faz pedidos no sistema.';
  end if;

  new.atendente_id := v_pai;
  new.externo := (v_tipo_pai = 'externo');
  return new;
end;
$$;

create trigger pedidos_atendente
  before insert or update of solicitante_id on public.pedidos
  for each row execute function interno.tg_pedido_atendente();

-- ---------------------------------------------------------------------
-- pedido_itens
-- ---------------------------------------------------------------------
create table public.pedido_itens (
  id              uuid primary key default gen_random_uuid(),
  pedido_id       uuid not null references public.pedidos (id) on delete cascade,
  material_id     uuid not null references public.materiais (id),
  qtd_solicitada  numeric(12,3) not null check (qtd_solicitada > 0),
  qtd_aprovada    numeric(12,3) check (qtd_aprovada >= 0),
  motivo_corte    text,
  unique (pedido_id, material_id),
  constraint pedido_itens_corte_ck check (
    qtd_aprovada is null
    or qtd_aprovada >= qtd_solicitada
    or nullif(btrim(motivo_corte), '') is not null
  )
);

create index pedido_itens_material_idx on public.pedido_itens (material_id);

create trigger pedido_itens_fracao
  before insert or update of material_id, qtd_solicitada, qtd_aprovada on public.pedido_itens
  for each row execute function interno.tg_validar_fracao('qtd_solicitada', 'qtd_aprovada');

-- ---------------------------------------------------------------------
-- remessas
-- ---------------------------------------------------------------------
create table public.remessas (
  id                       uuid primary key default gen_random_uuid(),
  numero                   bigint generated always as identity unique,
  tipo                     public.tipo_remessa not null,
  origem_id                uuid not null references public.almoxarifados (id),
  destino_id               uuid not null references public.almoxarifados (id),
  pedido_id                uuid unique references public.pedidos (id),
  remessa_ref_id           uuid references public.remessas (id),
  status                   public.status_remessa not null default 'em_transito',
  documento_ref            text,
  enviado_por              uuid not null references public.perfis (id),
  enviado_em               timestamptz not null default now(),
  data_envio               date not null,
  data_recebimento         date,
  conferido_por_nome       text,
  foto_path                text,
  recebido_registrado_por  uuid references public.perfis (id),
  recebido_registrado_em   timestamptz,
  encerrada_em             timestamptz,
  observacao               text,
  constraint remessas_almox_ck check (origem_id <> destino_id),
  constraint remessas_pedido_ck check (
    case tipo
      when 'atendimento' then pedido_id is not null
      when 'externa' then true
      else pedido_id is null
    end
  ),
  constraint remessas_ref_ck check ((tipo = 'reenvio') = (remessa_ref_id is not null)),
  constraint remessas_recebimento_ck check (
    status = 'em_transito'
    or (data_recebimento is not null
        and nullif(btrim(conferido_por_nome), '') is not null
        and nullif(btrim(foto_path), '') is not null
        and recebido_registrado_por is not null
        and recebido_registrado_em is not null)
  ),
  constraint remessas_encerrada_ck check ((status = 'encerrada') = (encerrada_em is not null)),
  constraint remessas_datas_ck check (data_recebimento is null or data_recebimento >= data_envio)
);

create index remessas_origem_idx on public.remessas (origem_id);
create index remessas_destino_idx on public.remessas (destino_id);
create index remessas_status_idx on public.remessas (status);
create index remessas_ref_idx on public.remessas (remessa_ref_id);

-- ---------------------------------------------------------------------
-- remessa_itens
-- ---------------------------------------------------------------------
create table public.remessa_itens (
  id                  uuid primary key default gen_random_uuid(),
  remessa_id          uuid not null references public.remessas (id) on delete cascade,
  material_id         uuid not null references public.materiais (id),
  qtd_enviada         numeric(12,3) not null check (qtd_enviada >= 0),
  qtd_recebida        numeric(12,3) check (qtd_recebida >= 0),
  motivo_divergencia  public.motivo_divergencia,
  observacao          text,
  unique (remessa_id, material_id),
  constraint remessa_itens_qtd_ck check (qtd_enviada > 0 or coalesce(qtd_recebida, 0) > 0),
  constraint remessa_itens_motivo_ck check (
    case
      when qtd_recebida is null or qtd_recebida = qtd_enviada then motivo_divergencia is null
      when qtd_recebida < qtd_enviada then motivo_divergencia in ('falta', 'avaria', 'trocado')
      else motivo_divergencia in ('sobra', 'trocado')
    end
  )
);

create index remessa_itens_material_idx on public.remessa_itens (material_id);

create trigger remessa_itens_fracao
  before insert or update of material_id, qtd_enviada, qtd_recebida on public.remessa_itens
  for each row execute function interno.tg_validar_fracao('qtd_enviada', 'qtd_recebida');

-- ---------------------------------------------------------------------
-- divergencia_tratamentos
-- ---------------------------------------------------------------------
create table public.divergencia_tratamentos (
  id                 uuid primary key default gen_random_uuid(),
  remessa_item_id    uuid not null references public.remessa_itens (id),
  tipo               public.tipo_tratamento not null,
  quantidade         numeric(12,3) not null check (quantidade > 0),
  justificativa      text not null check (btrim(justificativa) <> ''),
  data_ocorrencia    date not null,
  remessa_gerada_id  uuid references public.remessas (id),
  tratado_por        uuid not null references public.perfis (id),
  tratado_em         timestamptz not null default now(),
  constraint divergencia_tratamentos_reenvio_ck check ((tipo = 'reenvio') = (remessa_gerada_id is not null))
);

create index divergencia_tratamentos_item_idx on public.divergencia_tratamentos (remessa_item_id);
create index divergencia_tratamentos_gerada_idx on public.divergencia_tratamentos (remessa_gerada_id);

-- ---------------------------------------------------------------------
-- saidas / saida_itens
-- ---------------------------------------------------------------------
create table public.saidas (
  id               uuid primary key default gen_random_uuid(),
  numero           bigint generated always as identity unique,
  almox_id         uuid not null references public.almoxarifados (id),
  motivo           public.motivo_saida not null default 'aplicacao',
  data_ocorrencia  date not null,
  justificativa    text,
  observacao       text,
  registrado_por   uuid not null references public.perfis (id),
  registrado_em    timestamptz not null default now(),
  constraint saidas_justificativa_ck check (
    motivo = 'aplicacao' or nullif(btrim(justificativa), '') is not null
  )
);

create index saidas_almox_idx on public.saidas (almox_id);

create table public.saida_itens (
  id           uuid primary key default gen_random_uuid(),
  saida_id     uuid not null references public.saidas (id) on delete cascade,
  material_id  uuid not null references public.materiais (id),
  quantidade   numeric(12,3) not null check (quantidade > 0),
  unique (saida_id, material_id)
);

create index saida_itens_material_idx on public.saida_itens (material_id);

create trigger saida_itens_fracao
  before insert or update of material_id, quantidade on public.saida_itens
  for each row execute function interno.tg_validar_fracao('quantidade');

-- ---------------------------------------------------------------------
-- ajustes / ajuste_itens
-- ---------------------------------------------------------------------
create table public.ajustes (
  id               uuid primary key default gen_random_uuid(),
  numero           bigint generated always as identity unique,
  almox_id         uuid not null references public.almoxarifados (id),
  tipo             public.tipo_ajuste not null,
  justificativa    text not null check (btrim(justificativa) <> ''),
  data_ocorrencia  date not null,
  registrado_por   uuid not null references public.perfis (id),
  registrado_em    timestamptz not null default now()
);

create index ajustes_almox_idx on public.ajustes (almox_id);

create table public.ajuste_itens (
  id             uuid primary key default gen_random_uuid(),
  ajuste_id      uuid not null references public.ajustes (id) on delete cascade,
  material_id    uuid not null references public.materiais (id),
  saldo_sistema  numeric(12,3) not null,
  qtd_contada    numeric(12,3) not null check (qtd_contada >= 0),
  diferenca      numeric(12,3) generated always as (qtd_contada - saldo_sistema) stored,
  unique (ajuste_id, material_id)
);

create index ajuste_itens_material_idx on public.ajuste_itens (material_id);

create trigger ajuste_itens_fracao
  before insert or update of material_id, qtd_contada on public.ajuste_itens
  for each row execute function interno.tg_validar_fracao('qtd_contada');

-- ---------------------------------------------------------------------
-- movimentacoes (livro-razão, somente inserção)
-- ---------------------------------------------------------------------
create table public.movimentacoes (
  id               bigint generated always as identity primary key,
  almox_id         uuid not null references public.almoxarifados (id),
  material_id      uuid not null references public.materiais (id),
  quantidade       numeric(12,3) not null check (quantidade <> 0),
  tipo             public.tipo_movimentacao not null,
  data_ocorrencia  date not null,
  remessa_id       uuid references public.remessas (id),
  saida_id         uuid references public.saidas (id),
  ajuste_id        uuid references public.ajustes (id),
  tratamento_id    uuid references public.divergencia_tratamentos (id),
  criado_por       uuid not null references public.perfis (id),
  criado_em        timestamptz not null default now(),
  constraint movimentacoes_ref_ck check (num_nonnulls(remessa_id, saida_id, ajuste_id, tratamento_id) = 1),
  constraint movimentacoes_tipo_ref_ck check (
    case tipo
      when 'saldo_inicial'       then ajuste_id is not null
      when 'ajuste_inventario'   then ajuste_id is not null
      when 'envio_remessa'       then remessa_id is not null and quantidade < 0
      when 'recebimento_remessa' then (remessa_id is not null or tratamento_id is not null) and quantidade > 0
      when 'saida'               then saida_id is not null and quantidade < 0
      when 'ajuste_divergencia'  then tratamento_id is not null
    end
  )
);

create index movimentacoes_saldo_idx on public.movimentacoes (almox_id, material_id);
create index movimentacoes_material_idx on public.movimentacoes (material_id);
create index movimentacoes_remessa_idx on public.movimentacoes (remessa_id) where remessa_id is not null;
create index movimentacoes_saida_idx on public.movimentacoes (saida_id) where saida_id is not null;
create index movimentacoes_ajuste_idx on public.movimentacoes (ajuste_id) where ajuste_id is not null;
create index movimentacoes_tratamento_idx on public.movimentacoes (tratamento_id) where tratamento_id is not null;
create index movimentacoes_data_idx on public.movimentacoes (data_ocorrencia);

-- Nenhuma linha do livro-razão é alterada ou apagada, por ninguém.
create or replace function interno.tg_movimentacoes_imutavel()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'Movimentações não podem ser alteradas nem apagadas. Corrija com um ajuste de inventário.'
    using errcode = '42501';
end;
$$;

create trigger movimentacoes_imutavel
  before update or delete on public.movimentacoes
  for each row execute function interno.tg_movimentacoes_imutavel();

create trigger movimentacoes_imutavel_truncate
  before truncate on public.movimentacoes
  for each statement execute function interno.tg_movimentacoes_imutavel();
