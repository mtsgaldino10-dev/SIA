-- =====================================================================
-- SIA · Passo 1.1 — Enums, tabelas de cadastro e seed dos almoxarifados
-- =====================================================================

-- Funções internas (triggers e auxiliares das RPCs) ficam fora do schema
-- exposto pela API.
create schema if not exists interno;
revoke all on schema interno from public;

-- ---------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------
create type public.tipo_almox as enum ('externo', 'regional', 'base');
create type public.papel_usuario as enum ('admin', 'gestao', 'operador');
create type public.funcao_atribuicao as enum ('responsavel', 'supervisor');
create type public.status_pedido as enum (
  'rascunho', 'solicitado', 'aprovado', 'em_transito',
  'com_divergencia', 'encerrado', 'cancelado'
);
create type public.tipo_remessa as enum (
  'atendimento', 'externa', 'transferencia', 'devolucao', 'reenvio'
);
create type public.status_remessa as enum ('em_transito', 'com_divergencia', 'encerrada');
create type public.motivo_divergencia as enum ('falta', 'sobra', 'avaria', 'trocado');
create type public.tipo_tratamento as enum (
  'reenvio', 'chegou_depois', 'baixa_transito', 'ajuste_origem', 'externo'
);
create type public.motivo_saida as enum ('aplicacao', 'perda', 'avaria');
create type public.tipo_ajuste as enum ('implantacao', 'inventario');
create type public.tipo_movimentacao as enum (
  'saldo_inicial', 'envio_remessa', 'recebimento_remessa',
  'saida', 'ajuste_inventario', 'ajuste_divergencia'
);

-- ---------------------------------------------------------------------
-- Data de hoje no fuso de operação (America/Sao_Paulo)
-- ---------------------------------------------------------------------
create or replace function public.fn_hoje()
returns date
language sql
stable
set search_path = ''
as $$
  select (now() at time zone 'America/Sao_Paulo')::date
$$;

-- ---------------------------------------------------------------------
-- unidades
-- ---------------------------------------------------------------------
create table public.unidades (
  codigo        text primary key,
  descricao     text,
  aceita_fracao boolean not null default false,
  constraint unidades_codigo_ck check (codigo = btrim(codigo) and codigo <> '')
);

comment on table public.unidades is
  'Lista fechada de unidades. aceita_fracao = false exige quantidade inteira.';

-- ---------------------------------------------------------------------
-- almoxarifados
-- ---------------------------------------------------------------------
create table public.almoxarifados (
  id      uuid primary key default gen_random_uuid(),
  codigo  text not null unique,
  nome    text not null,
  tipo    public.tipo_almox not null,
  pai_id  uuid references public.almoxarifados (id),
  cidade  text,
  ativo   boolean not null default true,
  constraint almoxarifados_codigo_ck check (codigo = btrim(codigo) and codigo <> ''),
  constraint almoxarifados_pai_ck check ((tipo = 'externo') = (pai_id is null)),
  constraint almoxarifados_pai_proprio_ck check (pai_id <> id)
);

create index almoxarifados_pai_idx on public.almoxarifados (pai_id);

-- Hierarquia: base → regional → externo.
create or replace function interno.tg_almox_hierarquia()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tipo_pai public.tipo_almox;
begin
  if new.pai_id is null then
    return new;
  end if;

  select tipo into v_tipo_pai from public.almoxarifados where id = new.pai_id;

  if new.tipo = 'base' and v_tipo_pai is distinct from 'regional' then
    raise exception 'Uma base precisa estar ligada a um almoxarifado regional.';
  end if;
  if new.tipo = 'regional' and v_tipo_pai is distinct from 'externo' then
    raise exception 'Um almoxarifado regional precisa estar ligado a um almoxarifado externo.';
  end if;

  return new;
end;
$$;

create trigger almoxarifados_hierarquia
  before insert or update of tipo, pai_id on public.almoxarifados
  for each row execute function interno.tg_almox_hierarquia();

-- ---------------------------------------------------------------------
-- perfis
-- ---------------------------------------------------------------------
create table public.perfis (
  id         uuid primary key references auth.users (id) on delete cascade,
  nome       text not null,
  matricula  text unique,
  email      text,
  papel      public.papel_usuario not null default 'operador',
  ativo      boolean not null default true
);

-- Perfil criado automaticamente quando o admin cria o usuário no painel.
-- O nome vem de raw_user_meta_data.nome; na falta, da parte local do e-mail.
create or replace function interno.tg_novo_usuario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.perfis (id, nome, email)
  values (
    new.id,
    coalesce(nullif(btrim(new.raw_user_meta_data ->> 'nome'), ''), split_part(new.email, '@', 1), 'Sem nome'),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger auth_users_novo_perfil
  after insert on auth.users
  for each row execute function interno.tg_novo_usuario();

-- ---------------------------------------------------------------------
-- atribuicoes
-- ---------------------------------------------------------------------
create table public.atribuicoes (
  almox_id    uuid not null references public.almoxarifados (id),
  usuario_id  uuid not null references public.perfis (id) on delete cascade,
  funcao      public.funcao_atribuicao not null,
  desde       date not null default public.fn_hoje(),
  primary key (almox_id, usuario_id, funcao)
);

create index atribuicoes_usuario_idx on public.atribuicoes (usuario_id);

-- O almoxarifado externo (3256) não opera o sistema.
create or replace function interno.tg_atribuicao_almox()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (select 1 from public.almoxarifados where id = new.almox_id and tipo = 'externo') then
    raise exception 'O almoxarifado externo não opera o sistema e não recebe atribuições.';
  end if;
  return new;
end;
$$;

create trigger atribuicoes_almox
  before insert or update of almox_id on public.atribuicoes
  for each row execute function interno.tg_atribuicao_almox();

-- ---------------------------------------------------------------------
-- materiais
-- ---------------------------------------------------------------------
create table public.materiais (
  id          uuid primary key default gen_random_uuid(),
  codigo_sap  text not null unique,
  descricao   text not null,
  unidade     text not null references public.unidades (codigo) on update cascade,
  grupo       text,
  preco       numeric(14,2) check (preco >= 0),
  ativo       boolean not null default true,
  constraint materiais_codigo_sap_ck check (codigo_sap = btrim(codigo_sap) and codigo_sap <> '')
);

create index materiais_unidade_idx on public.materiais (unidade);

-- ---------------------------------------------------------------------
-- Validação de quantidade inteira para unidades sem fração
-- ---------------------------------------------------------------------
create or replace function interno.fn_checar_fracao(p_material_id uuid, p_qtd numeric)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_codigo  text;
  v_unidade text;
  v_fracao  boolean;
begin
  if p_qtd is null or p_qtd = trunc(p_qtd) then
    return;
  end if;

  select m.codigo_sap, m.unidade, u.aceita_fracao
    into v_codigo, v_unidade, v_fracao
    from public.materiais m
    join public.unidades u on u.codigo = m.unidade
   where m.id = p_material_id;

  if not coalesce(v_fracao, false) then
    raise exception 'Quantidade % não é inteira para o material % (unidade %). Informe um número inteiro.',
      trim_scale(p_qtd), v_codigo, v_unidade
      using errcode = '22023';
  end if;
end;
$$;

-- Trigger genérica: TG_ARGV lista as colunas de quantidade a validar.
create or replace function interno.tg_validar_fracao()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_linha  jsonb := to_jsonb(new);
  v_coluna text;
begin
  foreach v_coluna in array tg_argv loop
    perform interno.fn_checar_fracao((v_linha ->> 'material_id')::uuid, (v_linha ->> v_coluna)::numeric);
  end loop;
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- Seed: unidades presentes na planilha ALMOXARIF 211.xlsx (admin ajusta depois)
-- ---------------------------------------------------------------------
insert into public.unidades (codigo, descricao, aceita_fracao) values
  ('PC', 'Peça',               false),
  ('CJ', 'Conjunto',           false),
  ('PR', 'Par',                false),
  ('JG', 'Jogo',               false),
  ('RL', 'Rolo',               false),
  ('US', 'Unidade de serviço', false),
  ('CT', 'Cento',              false),
  ('M',  'Metro',              true),
  ('KG', 'Quilo',              true),
  ('M3', 'Metro cúbico',       true);

-- ---------------------------------------------------------------------
-- Seed: 13 almoxarifados
-- ---------------------------------------------------------------------
insert into public.almoxarifados (codigo, nome, tipo, pai_id, cidade)
values ('3256', 'Almoxarifado geral', 'externo', null, null);

insert into public.almoxarifados (codigo, nome, tipo, pai_id, cidade)
select '211', 'Almoxarifado regional', 'regional', id, null
  from public.almoxarifados where codigo = '3256';

insert into public.almoxarifados (codigo, nome, tipo, pai_id, cidade)
select b.codigo, b.nome, 'base', r.id, b.nome
  from public.almoxarifados r
 cross join (values
   ('RSP', 'Resplendor'),
   ('AIM', 'Aimorés'),
   ('CPN', 'Conselheiro Pena'),
   ('MNT', 'Mantena'),
   ('ITB', 'Itabirinha'),
   ('CRC', 'Coroaci'),
   ('SMS', 'Santa Maria do Suaçuí'),
   ('SJE', 'São João Evangelista'),
   ('SEF', 'Santa Efigênia'),
   ('ITN', 'Itanhomi'),
   ('TRM', 'Tarumirim')
 ) as b (codigo, nome)
 where r.codigo = '211';
