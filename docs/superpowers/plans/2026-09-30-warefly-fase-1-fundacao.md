# Warefly fase 1 (Fundação) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar a base que as fases seguintes usam: perfil da gestora, ajuste de estoque só pela gestão e pelo admin, motivos de redução, equipes por base com a saída registrando equipe e quem retirou, sigla SAP nas unidades e cadastros sem exclusão.

**Architecture:** Três migrations novas no Supabase (funções de perfil + ajuste + sigla; motivos; equipes + saída), cobertas por um arquivo pgTAP novo (`04_fundacao.test.sql`) e pelos ajustes nos testes existentes que dependiam do supervisor ajustando ou da saída sem equipe. No app, uma lib pura de perfis (testada no Vitest) alimenta o `SessaoContext`; telas novas de Motivos e Equipes; telas de Ajuste, Unidades, Saída e Histórico adaptadas; E2E cobrindo os fluxos.

**Tech Stack:** Supabase (Postgres 15+, RLS, plpgsql, pgTAP), React 19 + Vite + TypeScript, supabase-js, Vitest, Playwright.

**Spec:** [docs/superpowers/specs/2026-09-30-warefly-reservas-solicitacoes-inventario-design.md](../specs/2026-09-30-warefly-reservas-solicitacoes-inventario-design.md) (seções 3, 4, 10, 11.3, 13 e 17.1)

## Global Constraints

- Interface 100% em português; mensagens dizem o que aconteceu e o que fazer, sem "por favor" e sem exclamação.
- Cores e medidas só por tokens do design system (`var(--…)`); `npm run lint` não pode ganhar aviso novo de aderência.
- Mudança de estado com regra de negócio passa por RPC `security definer` com `set search_path = ''`, checagem explícita de permissão e erro de permissão com `errcode = '42501'`. Cadastros simples (motivos, equipes, unidades) usam RLS.
- Tabela nova: `enable row level security`, depois `revoke all on <tabela> from anon, authenticated` e só os grants mínimos. Nenhuma tabela nova tem `delete` para o cliente.
- Toda migration termina com o bloco de privilégios de funções:
  ```sql
  revoke execute on all functions in schema public from public, anon;
  grant execute on all functions in schema public to authenticated;
  revoke execute on all functions in schema interno from public;
  ```
- Migrations: só arquivos novos em `supabase/migrations`. Nunca editar as 8 já aplicadas no remoto.
- Nenhum nome de pessoa no código. "Gestora" = responsável de um almoxarifado regional.
- Commits em português, no branch `warefly`, terminando com a linha `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Comandos em Git Bash, a partir de `C:\APPWEB\SIA` (a raiz do repositório), com o Supabase local rodando (`supabase status` mostra os serviços).

### Comandos de referência

| Para | Comando (Git Bash, na raiz) |
|---|---|
| Aplicar as migrations no banco local (zera os dados locais; é o esperado) | `supabase db reset --local` |
| Rodar o pgTAP | `supabase test db` |
| Regenerar os tipos do banco | ver abaixo |
| Testes unitários | `cd app && npx vitest run` |
| Tipos do app | `cd app && npx tsc -b` |
| Lint | `cd app && npm run lint` |
| E2E (sempre a suíte inteira: cada arquivo usa o estado do anterior e o setup zera o banco) | `cd app && npx playwright test` |

Regenerar os tipos (o `--local` do CLI falha nesta máquina com "password authentication failed"; use a URL explícita e só troque o arquivo se a geração deu certo):

```bash
supabase gen types typescript --db-url "postgresql://postgres:postgres@127.0.0.1:54322/postgres" --schema public 2>/dev/null > "$TEMP/tipos.ts" \
  && head -1 "$TEMP/tipos.ts" | grep -q '^export type Json' \
  && mv "$TEMP/tipos.ts" app/src/lib/database.types.ts \
  && echo "tipos atualizados"
```

## Review Focus

- **Base de outro regional**: a gestora do 211 tentando ajustar estoque ou cadastrar equipe numa base que pertence a outro almoxarifado regional deve ser recusada (42501). Testes: Task 1 (ajuste em `B2`) e Task 7 (equipe em `B2`).
- **Nome de equipe quase igual**: "equipe 12" ou "Equipe 12 " numa base que já tem "Equipe 12" deve ser recusado, com mensagem que diz qual base. Testes: Task 7 (pgTAP 23505/23514) e Task 8 (E2E com a mensagem).
- **Gestora com perfil inativado**: quem é responsável do 211 mas teve o perfil desativado perde a gestão na hora (nem gere local, nem ajusta). Teste: Task 1 (usuária `INATIVA`).
- **Acesso pela URL**: supervisor que abre `/movimentar/ajuste` ou `/cadastros/motivos` direto pelo endereço vê a mensagem de acesso, não o formulário. Testes: Task 4 e Task 6 (E2E).
- **Troca de almoxarifado na saída**: escolher uma equipe e depois trocar de base limpa a equipe, para nunca mandar equipe de outra base. Testes: Task 9 (E2E) e, no banco, Task 7 ("equipe de outra base é recusada").

---

## Estrutura de arquivos

| Arquivo | Responsabilidade |
|---|---|
| `supabase/migrations/20261001100000_gestora_ajuste.sql` (novo) | `fn_eh_gestora`, `fn_gere_local`, permissão do `rpc_registrar_ajuste`, `sigla_sap` em unidades, `delete` revogado em materiais e almoxarifados |
| `supabase/migrations/20261001100100_motivos_reducao.sql` (novo) | Tabela `motivos_reducao`, seed, RLS |
| `supabase/migrations/20261001100200_equipes_saida.sql` (novo) | Tabela `equipes`, regras, RLS; `saidas.equipe_id` e `saidas.retirado_por_nome`; nova `rpc_registrar_saida` |
| `supabase/tests/database/04_fundacao.test.sql` (novo) | pgTAP da fase 1 |
| `supabase/tests/database/01_warefly.test.sql`, `02_painel.test.sql`, `03_correcoes.test.sql` | Ajustes: quem ajusta passa a ser a gestão; saída em base passa equipe e quem retirou |
| `app/src/lib/database.types.ts` | Regenerado |
| `app/src/lib/perfis.ts` + `perfis.test.ts` (novos) | Regras puras de perfil: regionais geridos, locais geridos, bases com equipes, rótulo do perfil |
| `app/src/lib/saida.ts` + `saida.test.ts` (novos) | Validação de equipe e quem retirou na saída |
| `app/src/auth/SessaoContext.tsx` | Expõe `ehGestora`, `almoxGeridos`, `basesEquipes`, `rotuloPerfil` |
| `app/src/components/Layout.tsx` | Menu (Movimentar, Motivos de redução, Equipes) e rótulo do perfil no rodapé |
| `app/src/lib/formato.ts` | Rótulo do papel `gestao` passa a "Gerência" |
| `app/src/pages/admin/Usuarios.tsx` | Textos dos papéis e da atribuição no 211 |
| `app/src/pages/movimentar/Movimentar.tsx` | Menu Movimentar e Ajuste pela gestão; Saída com equipe e quem retirou |
| `app/src/pages/admin/Materiais.tsx` (`AdminUnidades`) | Sigla no SAP |
| `app/src/pages/cadastros/MotivosReducao.tsx` (novo) | Cadastro de motivos de redução |
| `app/src/pages/cadastros/Equipes.tsx` (novo) | Cadastro de equipes por base |
| `app/src/pages/Historico.tsx` | Mostra equipe e quem retirou nas saídas |
| `app/src/App.tsx` | Rotas `/cadastros/motivos` e `/cadastros/equipes` |
| `app/e2e/01-cadastros.spec.ts`, `app/e2e/03-movimentar.spec.ts` | E2E da fase |
| `README.md`, `WAREFLY_PLANO_IMPLEMENTAÇÃO.MD` | Documentação |

---

### Task 1: Gestora do almoxarifado, ajuste só pela gestão, sigla SAP e cadastros sem exclusão (banco)

**Files:**
- Create: `supabase/migrations/20261001100000_gestora_ajuste.sql`
- Create: `supabase/tests/database/04_fundacao.test.sql`
- Modify: `supabase/tests/database/01_warefly.test.sql` (seções F e G)
- Modify: `supabase/tests/database/02_painel.test.sql` (bloco de saídas e ajuste)
- Modify: `supabase/tests/database/03_correcoes.test.sql` (bloco I1)
- Modify: `app/src/lib/database.types.ts` (regenerado)

**Interfaces:**
- Consumes: `public.fn_eh_admin()`, `interno.fn_usuario()`, `interno.fn_id_repetido()`, `interno.fn_texto()`, `interno.fn_checar_data()`, `interno.fn_checar_itens()`, `interno.fn_travar_saldo()`, `interno.fn_saldo()`, `interno.fn_lancar()` (migrations existentes).
- Produces:
  - `public.fn_eh_gestora() returns boolean`: o usuário ativo é responsável de algum almoxarifado `regional`.
  - `public.fn_gere_local(p_almox_id uuid) returns boolean`: o local é um regional de que o usuário ativo é responsável, ou uma base desse regional.
  - `public.rpc_registrar_ajuste(...)`: mesma assinatura; permissão = `fn_eh_admin() or fn_gere_local(p_almox_id)` para `implantacao` e `inventario`.
  - `public.unidades.sigla_sap text unique` (seed: PC→PEÇ, CJ→CJ, M→M, KG→KG).
  - Sem privilégio de `delete` em `public.materiais` e `public.almoxarifados`.
  - Arquivo `04_fundacao.test.sql` com os helpers `tests.u(nome)`, `tests.a(codigo)`, `tests.como(nome)`, `tests.saldo(codigo)`, e as seções A a D; termina em `select * from finish(); rollback;`. As Tasks 2 e 7 inserem seções **antes** de `select * from finish();`.

- [ ] **Step 1: Escrever o pgTAP da fase (seções A a D)**

Criar `supabase/tests/database/04_fundacao.test.sql`:

```sql
-- =====================================================================
-- Warefly · Fundação — gestora, ajuste, unidades, motivos, equipes
-- Roda com: supabase test db   (tudo em transação, desfeito no fim)
-- =====================================================================
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select * from no_plan();

create schema tests;
grant usage on schema tests to authenticated;

create function tests.u(p text) returns uuid language sql immutable as $$
  select case p
    when 'ADMIN'   then '00000000-0000-4000-a000-0000000000f1'
    when 'GESTORA' then '00000000-0000-4000-a000-0000000000f2'
    when 'VICTOR'  then '00000000-0000-4000-a000-0000000000f3'
    when 'INATIVA' then '00000000-0000-4000-a000-0000000000f4'
  end::uuid
$$;
create function tests.a(c text) returns uuid language sql stable security definer as $$
  select id from public.almoxarifados where codigo = c
$$;
create function tests.como(p text) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', tests.u(p), 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
end $$;
-- Saldo do parafuso (material e1) num local
create function tests.saldo(c text) returns numeric language sql stable security definer as $$
  select coalesce(sum(quantidade), 0) from public.movimentacoes
   where almox_id = tests.a(c) and material_id = '10000000-0000-4000-a000-0000000000e1'
$$;
grant execute on all functions in schema tests to authenticated;

-- Usuários: admin, gestora (responsável do 211), Victor (MNT e ITB) e uma
-- responsável do 211 com o perfil inativado
insert into auth.users (id, email, raw_user_meta_data, aud, role)
select tests.u(n), lower(n) || '@warefly.test', json_build_object('nome', n)::jsonb, 'authenticated', 'authenticated'
  from unnest(array['ADMIN', 'GESTORA', 'VICTOR', 'INATIVA']) as n;
update perfis set papel = 'admin' where id = tests.u('ADMIN');
update perfis set ativo = false where id = tests.u('INATIVA');

-- Um segundo regional, com uma base, fora da gestão do 211
insert into almoxarifados (codigo, nome, tipo, pai_id) values ('R2', 'Regional dois', 'regional', tests.a('3256'));
insert into almoxarifados (codigo, nome, tipo, pai_id) values ('B2', 'Base dois', 'base', tests.a('R2'));

insert into atribuicoes (almox_id, usuario_id, funcao) values
  (tests.a('211'), tests.u('GESTORA'), 'responsavel'),
  (tests.a('211'), tests.u('INATIVA'), 'responsavel'),
  (tests.a('MNT'), tests.u('VICTOR'), 'responsavel'), (tests.a('MNT'), tests.u('VICTOR'), 'supervisor'),
  (tests.a('ITB'), tests.u('VICTOR'), 'responsavel'), (tests.a('ITB'), tests.u('VICTOR'), 'supervisor');

insert into materiais (id, codigo_sap, descricao, unidade) values
  ('10000000-0000-4000-a000-0000000000e1', '6001', 'PARAFUSO', 'PC'),
  ('10000000-0000-4000-a000-0000000000e2', '6002', 'CONECTOR', 'PC');

-- ---------------------------------------------------------------------
-- A. Gestora do almoxarifado = responsável de um regional
-- ---------------------------------------------------------------------
select tests.como('GESTORA');
select ok(fn_eh_gestora(), 'responsável do 211 é gestora');
select ok(fn_gere_local(tests.a('211')), 'gestora gere o 211');
select ok(fn_gere_local(tests.a('MNT')), 'gestora gere as bases do 211');
select ok(not fn_gere_local(tests.a('3256')), 'gestora não gere o 3256');
select ok(not fn_gere_local(tests.a('R2')), 'nem outro regional');
select ok(not fn_gere_local(tests.a('B2')), 'nem as bases de outro regional');
reset role;

select tests.como('VICTOR');
select ok(not fn_eh_gestora(), 'supervisor não é gestora');
select ok(not fn_gere_local(tests.a('MNT')), 'supervisor não gere a própria base');
reset role;

select tests.como('INATIVA');
select ok(not fn_eh_gestora(), 'perfil inativo perde a gestão');
select ok(not fn_gere_local(tests.a('211')), 'e deixa de gerir o 211');
reset role;

-- ---------------------------------------------------------------------
-- B. Ajuste de estoque: só a gestão do almoxarifado e o admin
-- ---------------------------------------------------------------------
select tests.como('VICTOR');
select throws_ok(
  $$ select rpc_registrar_ajuste(tests.a('MNT'), 'inventario', 'Contagem',
       '[{"material_id":"10000000-0000-4000-a000-0000000000e1","qtd_contada":5}]') $$,
  '42501', null, 'supervisor não ajusta a própria base');
reset role;

select tests.como('GESTORA');
select lives_ok(
  $$ select rpc_registrar_ajuste(tests.a('MNT'), 'inventario', 'Contagem',
       '[{"material_id":"10000000-0000-4000-a000-0000000000e1","qtd_contada":20}]') $$,
  'gestora ajusta uma base do 211');
select lives_ok(
  $$ select rpc_registrar_ajuste(tests.a('211'), 'inventario', 'Contagem',
       '[{"material_id":"10000000-0000-4000-a000-0000000000e1","qtd_contada":10}]') $$,
  'gestora ajusta o 211');
select lives_ok(
  $$ select rpc_registrar_ajuste(tests.a('ITB'), 'implantacao', 'Contagem inicial',
       '[{"material_id":"10000000-0000-4000-a000-0000000000e1","qtd_contada":5}]') $$,
  'gestora carrega o saldo inicial de uma base');
select throws_ok(
  $$ select rpc_registrar_ajuste(tests.a('B2'), 'inventario', 'Contagem',
       '[{"material_id":"10000000-0000-4000-a000-0000000000e1","qtd_contada":1}]') $$,
  '42501', null, 'gestora não ajusta base de outro regional');
reset role;

select tests.como('INATIVA');
select throws_ok(
  $$ select rpc_registrar_ajuste(tests.a('MNT'), 'inventario', 'Contagem',
       '[{"material_id":"10000000-0000-4000-a000-0000000000e1","qtd_contada":1}]') $$,
  '42501', null, 'perfil inativo não ajusta');
reset role;

select tests.como('ADMIN');
select lives_ok(
  $$ select rpc_registrar_ajuste(tests.a('B2'), 'implantacao', 'Contagem inicial',
       '[{"material_id":"10000000-0000-4000-a000-0000000000e1","qtd_contada":3}]') $$,
  'admin ajusta qualquer local');
reset role;

select is(tests.saldo('MNT'), 20.000, 'Mantena com 20 após o ajuste da gestora');
select is(tests.saldo('211'), 10.000, '211 com 10');
select is(tests.saldo('ITB'), 5.000, 'Itabirinha com 5');
select is(tests.saldo('B2'), 3.000, 'Base dois com 3');

-- ---------------------------------------------------------------------
-- C. Cadastros não são apagados: material e local só são inativados
-- ---------------------------------------------------------------------
select tests.como('ADMIN');
select throws_ok($$ delete from materiais where codigo_sap = '6002' $$, '42501', null, 'admin não apaga material');
select throws_ok($$ delete from almoxarifados where codigo = 'B2' $$, '42501', null, 'admin não apaga almoxarifado');
select lives_ok($$ update materiais set ativo = false where codigo_sap = '6002' $$, 'admin inativa material');
reset role;
select ok(not (select ativo from materiais where codigo_sap = '6002'), 'material inativado');

-- ---------------------------------------------------------------------
-- D. Sigla SAP das unidades (coluna UMB da planilha de reservas)
-- ---------------------------------------------------------------------
select is((select sigla_sap from unidades where codigo = 'PC'), 'PEÇ', 'PC aparece como PEÇ no SAP');
select is((select count(*) from unidades where sigla_sap is not null)::int, 4, 'PC, CJ, M e KG com sigla SAP');
select tests.como('ADMIN');
select throws_ok($$ update unidades set sigla_sap = 'PEÇ' where codigo = 'JG' $$, '23505', null, 'sigla SAP não se repete');
select throws_ok($$ update unidades set sigla_sap = ' ' where codigo = 'JG' $$, '23514', null, 'sigla SAP não fica em branco');
select lives_ok($$ update unidades set sigla_sap = 'JOGO' where codigo = 'JG' $$, 'admin define a sigla de JG');
reset role;
select tests.como('VICTOR');
select lives_ok($$ update unidades set sigla_sap = 'X' where codigo = 'PR' $$, 'supervisor tenta mudar a sigla...');
reset role;
select is((select sigla_sap from unidades where codigo = 'PR'), null, '...e nada muda');

select * from finish();
rollback;
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `supabase db reset --local && supabase test db`
Expected: `04_fundacao.test.sql` falha (FAIL), com erro de função inexistente `fn_eh_gestora` na seção A.

- [ ] **Step 3: Escrever a migration**

Criar `supabase/migrations/20261001100000_gestora_ajuste.sql`:

```sql
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
```

- [ ] **Step 4: Rodar o pgTAP**

Run: `supabase db reset --local && supabase test db`
Expected: `04_fundacao.test.sql .. ok`. Os arquivos 01, 02 e 03 **falham** nos pontos em que o supervisor ajusta (esperado; o Step 5 corrige).

- [ ] **Step 5: Ajustar os testes existentes (quem ajusta passa a ser a gestão)**

Em `supabase/tests/database/01_warefly.test.sql`, seção F, trocar este bloco:

```sql
select tests.como('VICTOR');
select throws_like(
  $$ select rpc_tratar_divergencia(tests.item('rem4', 'CONEC'), 'ajuste_origem', 1, 'Mandei a mais') $$,
  'Saldo insuficiente em Itabirinha%', 'ajuste na origem respeita o saldo');
select throws_like(
  $$ select rpc_registrar_ajuste(tests.a('ITB'), 'inventario', ' ', tests.j('[{"material_id":"CONEC","qtd_contada":1}]')) $$,
  'Informe a justificativa%', 'ajuste de inventário exige justificativa');
select lives_ok(
  $$ select rpc_registrar_ajuste(tests.a('ITB'), 'inventario', 'Conector sem registro no sistema', tests.j('[{"material_id":"CONEC","qtd_contada":1}]')) $$,
  'responsável ajusta o inventário da base');
select lives_ok(
  $$ select rpc_tratar_divergencia(tests.item('rem4', 'CONEC'), 'ajuste_origem', 1, 'Mandei a mais sem registrar') $$,
  'ajuste na origem fecha a sobra');
reset role;
```

por:

```sql
select tests.como('VICTOR');
select throws_like(
  $$ select rpc_tratar_divergencia(tests.item('rem4', 'CONEC'), 'ajuste_origem', 1, 'Mandei a mais') $$,
  'Saldo insuficiente em Itabirinha%', 'ajuste na origem respeita o saldo');
select throws_ok(
  $$ select rpc_registrar_ajuste(tests.a('ITB'), 'inventario', 'Conector sem registro no sistema', tests.j('[{"material_id":"CONEC","qtd_contada":1}]')) $$,
  '42501', null, 'supervisor não ajusta o estoque da própria base');
reset role;
select tests.como('C211');
select throws_like(
  $$ select rpc_registrar_ajuste(tests.a('ITB'), 'inventario', ' ', tests.j('[{"material_id":"CONEC","qtd_contada":1}]')) $$,
  'Informe a justificativa%', 'ajuste de inventário exige justificativa');
select lives_ok(
  $$ select rpc_registrar_ajuste(tests.a('ITB'), 'inventario', 'Conector sem registro no sistema', tests.j('[{"material_id":"CONEC","qtd_contada":1}]')) $$,
  'gestão do 211 ajusta o estoque da base');
reset role;
select tests.como('VICTOR');
select lives_ok(
  $$ select rpc_tratar_divergencia(tests.item('rem4', 'CONEC'), 'ajuste_origem', 1, 'Mandei a mais sem registrar') $$,
  'ajuste na origem fecha a sobra');
reset role;
```

Na seção G do mesmo arquivo, trocar:

```sql
select tests.como('VICTOR');
select lives_ok(
  $$ with a as (select rpc_registrar_ajuste(tests.a('MNT'), 'inventario', 'Contagem mensal', tests.j('[{"material_id":"PARAF","qtd_contada":12}]')) as id)
     insert into tests.ctx select 'aju1', id from a $$,
  'ajuste de inventário em Mantena');
```

por:

```sql
select tests.como('C211');
select lives_ok(
  $$ with a as (select rpc_registrar_ajuste(tests.a('MNT'), 'inventario', 'Contagem mensal', tests.j('[{"material_id":"PARAF","qtd_contada":12}]')) as id)
     insert into tests.ctx select 'aju1', id from a $$,
  'gestão do 211 ajusta o inventário de Mantena');
```

Em `supabase/tests/database/02_painel.test.sql`, trocar:

```sql
select rpc_registrar_saida(tests.a('MNT'),
  '[{"material_id":"10000000-0000-4000-a000-0000000000b1","quantidade":4},{"material_id":"10000000-0000-4000-a000-0000000000b2","quantidade":1}]');
select rpc_registrar_ajuste(tests.a('MNT'), 'inventario', 'Contagem',
  '[{"material_id":"10000000-0000-4000-a000-0000000000b1","qtd_contada":15}]');
reset role;
```

por:

```sql
select rpc_registrar_saida(tests.a('MNT'),
  '[{"material_id":"10000000-0000-4000-a000-0000000000b1","quantidade":4},{"material_id":"10000000-0000-4000-a000-0000000000b2","quantidade":1}]');
reset role;
select tests.como('00000000-0000-4000-a000-0000000000a3');
select rpc_registrar_ajuste(tests.a('MNT'), 'inventario', 'Contagem',
  '[{"material_id":"10000000-0000-4000-a000-0000000000b1","qtd_contada":15}]');
reset role;
```

Em `supabase/tests/database/03_correcoes.test.sql`, trocar:

```sql
select is(tests.saldo('MNT', '10000000-0000-4000-a000-0000000000d1'), 22.000, 'envio baixou uma vez só');

select is(rpc_registrar_ajuste(tests.a('MNT'), 'inventario', 'Contagem',
```

por:

```sql
select is(tests.saldo('MNT', '10000000-0000-4000-a000-0000000000d1'), 22.000, 'envio baixou uma vez só');
reset role;

-- O ajuste é da gestão do 211
select tests.como('00000000-0000-4000-a000-0000000000c3');
select is(rpc_registrar_ajuste(tests.a('MNT'), 'inventario', 'Contagem',
```

(O restante do bloco, as duas chamadas de ajuste, a checagem de saldo 20 e o `reset role;`, continua igual.)

- [ ] **Step 6: Rodar o pgTAP inteiro**

Run: `supabase test db`
Expected: `All tests successful.` nos 4 arquivos.

- [ ] **Step 7: Regenerar os tipos e checar o app**

Run: o comando de tipos da seção "Comandos de referência", depois `cd app && npx tsc -b`
Expected: `tipos atualizados`; `tsc` sem erro. `git diff --stat app/src/lib/database.types.ts` mostra `sigla_sap`, `fn_eh_gestora` e `fn_gere_local`.

- [ ] **Step 8: Commit**

```bash
git add supabase/migrations/20261001100000_gestora_ajuste.sql supabase/tests/database app/src/lib/database.types.ts
git commit -m "feat(banco): gestora do almoxarifado, ajuste só pela gestão e sigla SAP" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Motivos de redução (banco)

**Files:**
- Create: `supabase/migrations/20261001100100_motivos_reducao.sql`
- Modify: `supabase/tests/database/04_fundacao.test.sql` (seção E, antes de `select * from finish();`)
- Modify: `app/src/lib/database.types.ts` (regenerado)

**Interfaces:**
- Consumes: `public.fn_eh_gestora()` (Task 1), `public.fn_eh_admin()`.
- Produces: tabela `public.motivos_reducao (id smallint identity, descricao text, exige_texto boolean, ativo boolean, ordem smallint)`; nome único sem diferenciar maiúscula; leitura para todo autenticado; `insert (descricao, exige_texto, ativo, ordem)` e `update` dessas colunas para gestora e admin; sem `delete`. Seed com "Sem saldo no 211" (10), "Excede consumo histórico" (20), "Material de obras" (30), "Outro" (90, exige texto). A Task 6 usa `ordem = 50` para motivos novos.

A trava "motivo usado não muda de nome" depende de `pedido_itens.motivo_reducao_id`, que só existe na fase 2; ela entra lá.

- [ ] **Step 1: Escrever a seção E do pgTAP**

Em `supabase/tests/database/04_fundacao.test.sql`, inserir antes de `select * from finish();`:

```sql
-- ---------------------------------------------------------------------
-- E. Motivos de redução: todos leem; gestora e admin mantêm
-- ---------------------------------------------------------------------
select tests.como('VICTOR');
select is((select array_agg(descricao order by ordem) from motivos_reducao),
  array['Sem saldo no 211', 'Excede consumo histórico', 'Material de obras', 'Outro'],
  'todos leem os motivos, na ordem');
select throws_ok($$ insert into motivos_reducao (descricao) values ('Supervisor inventou') $$,
  '42501', null, 'supervisor não cadastra motivo');
select lives_ok($$ update motivos_reducao set ativo = false where descricao = 'Outro' $$, 'supervisor tenta inativar...');
reset role;
select ok((select ativo from motivos_reducao where descricao = 'Outro'), '...e nada muda');
select ok((select exige_texto from motivos_reducao where descricao = 'Outro'), '"Outro" exige texto');

select tests.como('GESTORA');
select lives_ok($$ insert into motivos_reducao (descricao, ordem) values ('Pedido em duplicidade', 50) $$, 'gestora cadastra motivo');
select lives_ok($$ update motivos_reducao set ativo = false where descricao = 'Pedido em duplicidade' $$, 'gestora inativa motivo');
select throws_ok($$ insert into motivos_reducao (descricao) values ('outro') $$, '23505', null, 'nome repetido, mesmo com outra caixa');
select throws_ok($$ insert into motivos_reducao (descricao) values (' Outro motivo') $$, '23514', null, 'nome com espaço sobrando é recusado');
select throws_ok($$ delete from motivos_reducao where descricao = 'Pedido em duplicidade' $$, '42501', null, 'motivo não é apagado');
reset role;
select ok(not (select ativo from motivos_reducao where descricao = 'Pedido em duplicidade'), 'motivo inativado');

select tests.como('ADMIN');
select lives_ok($$ insert into motivos_reducao (descricao, ordem) values ('Material descontinuado', 50) $$, 'admin cadastra motivo');
reset role;
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `supabase test db`
Expected: FAIL em `04_fundacao.test.sql` com `relation "motivos_reducao" does not exist`.

- [ ] **Step 3: Escrever a migration**

Criar `supabase/migrations/20261001100100_motivos_reducao.sql`:

```sql
-- =====================================================================
-- Warefly · Fundação 2 — Motivos de redução
-- Lista padronizada usada quando o 211 aprova abaixo do solicitado.
-- Mantida pela gestora e pelo admin. Não é apagada: é inativada.
-- =====================================================================

create table public.motivos_reducao (
  id          smallint generated always as identity primary key,
  descricao   text not null,
  exige_texto boolean not null default false,
  ativo       boolean not null default true,
  ordem       smallint not null default 0,
  constraint motivos_reducao_descricao_ck check (descricao = btrim(descricao) and descricao <> '')
);

create unique index motivos_reducao_descricao_uk on public.motivos_reducao (lower(descricao));

comment on table public.motivos_reducao is
  'Motivos padronizados de redução na aprovação. exige_texto obriga o campo livre (ex.: Outro).';

insert into public.motivos_reducao (descricao, exige_texto, ordem) values
  ('Sem saldo no 211',         false, 10),
  ('Excede consumo histórico', false, 20),
  ('Material de obras',        false, 30),
  ('Outro',                    true,  90);

alter table public.motivos_reducao enable row level security;

create policy motivos_reducao_select on public.motivos_reducao
  for select to authenticated using (true);
create policy motivos_reducao_insert on public.motivos_reducao
  for insert to authenticated
  with check (public.fn_eh_gestora() or public.fn_eh_admin());
create policy motivos_reducao_update on public.motivos_reducao
  for update to authenticated
  using (public.fn_eh_gestora() or public.fn_eh_admin())
  with check (public.fn_eh_gestora() or public.fn_eh_admin());

revoke all on public.motivos_reducao from anon, authenticated;
grant select on public.motivos_reducao to authenticated;
grant insert (descricao, exige_texto, ativo, ordem), update (descricao, exige_texto, ativo, ordem)
  on public.motivos_reducao to authenticated;

-- ---------------------------------------------------------------------
-- Privilégios
-- ---------------------------------------------------------------------
revoke execute on all functions in schema public from public, anon;
grant execute on all functions in schema public to authenticated;
revoke execute on all functions in schema interno from public;
```

- [ ] **Step 4: Rodar o pgTAP**

Run: `supabase db reset --local && supabase test db`
Expected: `All tests successful.`

- [ ] **Step 5: Regenerar os tipos e checar o app**

Run: o comando de tipos, depois `cd app && npx tsc -b`
Expected: `tipos atualizados`; `tsc` sem erro; `motivos_reducao` aparece em `database.types.ts`.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/20261001100100_motivos_reducao.sql supabase/tests/database/04_fundacao.test.sql app/src/lib/database.types.ts
git commit -m "feat(banco): motivos de redução mantidos pela gestão" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Perfis no app (sessão, menu e rótulos)

**Files:**
- Create: `app/src/lib/perfis.ts`
- Create: `app/src/lib/perfis.test.ts`
- Modify: `app/src/auth/SessaoContext.tsx`
- Modify: `app/src/components/Layout.tsx` (rodapé do menu)
- Modify: `app/src/lib/formato.ts` (rótulo `gestao`)
- Modify: `app/src/pages/admin/Usuarios.tsx` (textos)

**Interfaces:**
- Consumes: tipos `Almox`, `Atribuicao`, `Enum` de `app/src/lib/supabase.ts`.
- Produces:
  - `regionaisGeridos(almoxarifados: Almox[], atribuicoes: Atribuicao[]): Set<string>`
  - `locaisGeridos(almoxarifados: Almox[], atribuicoes: Atribuicao[], ehAdmin: boolean): Almox[]`: admin, todos os locais ativos não externos; gestora, o regional dela e as bases ativas dele; os demais, nenhum.
  - `basesComEquipes(almoxarifados: Almox[], atribuicoes: Atribuicao[], ehAdmin: boolean): Almox[]`: bases ativas em que o usuário é responsável ou que ele gere.
  - `rotuloDoPerfil(p: { papel: Enum<'papel_usuario'> | null | undefined; ehGestora: boolean; ehSupervisor: boolean }): string`
  - No `useSessao()`: `ehGestora: boolean`, `almoxGeridos: Almox[]`, `basesEquipes: Almox[]`, `rotuloPerfil: string`.

- [ ] **Step 1: Escrever os testes da lib**

Criar `app/src/lib/perfis.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { basesComEquipes, locaisGeridos, regionaisGeridos, rotuloDoPerfil } from './perfis'
import type { Almox, Atribuicao } from './supabase'

const local = (id: string, tipo: Almox['tipo'], pai_id: string | null, ativo = true): Almox => ({
  id,
  codigo: id,
  nome: id,
  tipo,
  pai_id,
  cidade: null,
  ativo,
})
const ALMOX = [
  local('3256', 'externo', null),
  local('211', 'regional', '3256'),
  local('MNT', 'base', '211'),
  local('RSP', 'base', '211'),
  local('OLD', 'base', '211', false),
  local('R2', 'regional', '3256'),
  local('B2', 'base', 'R2'),
]
const atrib = (almox_id: string, funcao: Atribuicao['funcao']): Atribuicao => ({
  almox_id,
  usuario_id: 'u1',
  funcao,
  desde: '2026-10-01',
})
const ids = (lista: Almox[]) => lista.map((a) => a.id)

const GESTORA = [atrib('211', 'responsavel')]
const SUPERVISOR = [atrib('MNT', 'responsavel'), atrib('MNT', 'supervisor')]

describe('regionaisGeridos', () => {
  it('responsável de um regional gere esse regional', () => {
    expect([...regionaisGeridos(ALMOX, GESTORA)]).toEqual(['211'])
  })
  it('responsável de base não gere regional nenhum', () => {
    expect(regionaisGeridos(ALMOX, SUPERVISOR).size).toBe(0)
  })
})

describe('locaisGeridos', () => {
  it('gestora: o regional e as bases ativas dele, nunca as de outro regional', () => {
    expect(ids(locaisGeridos(ALMOX, GESTORA, false))).toEqual(['211', 'MNT', 'RSP'])
  })
  it('supervisor não gere local nenhum', () => {
    expect(locaisGeridos(ALMOX, SUPERVISOR, false)).toEqual([])
  })
  it('admin gere todos os locais ativos, menos o externo', () => {
    expect(ids(locaisGeridos(ALMOX, [], true))).toEqual(['211', 'MNT', 'RSP', 'R2', 'B2'])
  })
})

describe('basesComEquipes', () => {
  it('supervisor mantém as equipes das próprias bases', () => {
    expect(ids(basesComEquipes(ALMOX, SUPERVISOR, false))).toEqual(['MNT'])
  })
  it('gestora mantém as das bases do regional dela', () => {
    expect(ids(basesComEquipes(ALMOX, GESTORA, false))).toEqual(['MNT', 'RSP'])
  })
  it('admin mantém as de todas as bases ativas', () => {
    expect(ids(basesComEquipes(ALMOX, [], true))).toEqual(['MNT', 'RSP', 'B2'])
  })
})

describe('rotuloDoPerfil', () => {
  it('papel global vem primeiro', () => {
    expect(rotuloDoPerfil({ papel: 'admin', ehGestora: true, ehSupervisor: false })).toBe('Administrador')
    expect(rotuloDoPerfil({ papel: 'gestao', ehGestora: false, ehSupervisor: false })).toBe('Gerência')
  })
  it('operador: gestora, supervisor ou operador', () => {
    expect(rotuloDoPerfil({ papel: 'operador', ehGestora: true, ehSupervisor: false })).toBe('Gestor(a) do almoxarifado')
    expect(rotuloDoPerfil({ papel: 'operador', ehGestora: false, ehSupervisor: true })).toBe('Supervisor')
    expect(rotuloDoPerfil({ papel: 'operador', ehGestora: false, ehSupervisor: false })).toBe('Operador')
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd app && npx vitest run src/lib/perfis.test.ts`
Expected: FAIL com `Failed to resolve import "./perfis"`.

- [ ] **Step 3: Escrever a lib**

Criar `app/src/lib/perfis.ts`:

```ts
import type { Almox, Atribuicao, Enum } from './supabase'

/** Regionais em que o usuário é responsável: é isso que faz dele gestor(a) do almoxarifado. */
export function regionaisGeridos(almoxarifados: Almox[], atribuicoes: Atribuicao[]): Set<string> {
  const regionais = new Set(almoxarifados.filter((a) => a.tipo === 'regional').map((a) => a.id))
  return new Set(atribuicoes.filter((a) => a.funcao === 'responsavel' && regionais.has(a.almox_id)).map((a) => a.almox_id))
}

/** Locais cujo estoque o usuário ajusta: o admin, todos; a gestora, o regional dela e as bases dele. */
export function locaisGeridos(almoxarifados: Almox[], atribuicoes: Atribuicao[], ehAdmin: boolean): Almox[] {
  const ativos = almoxarifados.filter((a) => a.tipo !== 'externo' && a.ativo)
  if (ehAdmin) return ativos
  const regionais = regionaisGeridos(almoxarifados, atribuicoes)
  return ativos.filter((a) => regionais.has(a.id) || (a.pai_id !== null && regionais.has(a.pai_id)))
}

/** Bases cujas equipes o usuário mantém: as que ele opera e as que gere. */
export function basesComEquipes(almoxarifados: Almox[], atribuicoes: Atribuicao[], ehAdmin: boolean): Almox[] {
  const opera = new Set(atribuicoes.filter((a) => a.funcao === 'responsavel').map((a) => a.almox_id))
  const gere = new Set(locaisGeridos(almoxarifados, atribuicoes, ehAdmin).map((a) => a.id))
  return almoxarifados.filter((a) => a.tipo === 'base' && a.ativo && (opera.has(a.id) || gere.has(a.id)))
}

/** Rótulo do perfil no rodapé do menu. */
export function rotuloDoPerfil(p: {
  papel: Enum<'papel_usuario'> | null | undefined
  ehGestora: boolean
  ehSupervisor: boolean
}): string {
  if (p.papel === 'admin') return 'Administrador'
  if (p.papel === 'gestao') return 'Gerência'
  if (p.ehGestora) return 'Gestor(a) do almoxarifado'
  if (p.ehSupervisor) return 'Supervisor'
  return 'Operador'
}
```

- [ ] **Step 4: Rodar os testes da lib**

Run: `cd app && npx vitest run src/lib/perfis.test.ts`
Expected: PASS (10 testes).

- [ ] **Step 5: Expor na sessão**

Em `app/src/auth/SessaoContext.tsx`:

Acrescentar o import:

```ts
import { basesComEquipes, locaisGeridos, regionaisGeridos, rotuloDoPerfil } from '../lib/perfis'
```

No tipo `Sessao`, depois de `almoxVisiveis: Almox[]`, acrescentar:

```ts
  /** responsável de um almoxarifado regional: aprova, entrega, ajusta e inventaria */
  ehGestora: boolean
  /** locais cujo estoque o usuário ajusta: admin, todos; gestora, o regional e as bases dele */
  almoxGeridos: Almox[]
  /** bases cujas equipes o usuário mantém */
  basesEquipes: Almox[]
  /** rótulo do perfil no rodapé do menu */
  rotuloPerfil: string
```

No `useMemo`, trocar:

```ts
    const ativo = !!perfil?.ativo
    const idsResp = new Set(ativo ? atribuicoes.filter((a) => a.funcao === 'responsavel').map((a) => a.almox_id) : [])
    const idsAtrib = new Set(ativo ? atribuicoes.map((a) => a.almox_id) : [])
```

por:

```ts
    const ativo = !!perfil?.ativo
    const minhas = ativo ? atribuicoes : []
    const idsResp = new Set(minhas.filter((a) => a.funcao === 'responsavel').map((a) => a.almox_id))
    const idsAtrib = new Set(minhas.map((a) => a.almox_id))
    const ehGestora = regionaisGeridos(almoxarifados, minhas).size > 0
```

e, no objeto retornado, depois da propriedade `almoxVisiveis: …`, acrescentar:

```ts
      ehGestora,
      almoxGeridos: locaisGeridos(almoxarifados, minhas, ehAdmin),
      basesEquipes: basesComEquipes(almoxarifados, minhas, ehAdmin),
      rotuloPerfil: rotuloDoPerfil({ papel: perfil?.papel, ehGestora, ehSupervisor: minhas.some((a) => a.funcao === 'supervisor') }),
```

- [ ] **Step 6: Rótulos na interface**

Em `app/src/components/Layout.tsx`:
- trocar `const { perfil, sair, almoxResponsavel } = useSessao()` por `const { perfil, sair, almoxResponsavel, rotuloPerfil } = useSessao()`;
- no rodapé, trocar `<div>{rotuloStatus(perfil?.papel)}</div>` por `<div>{rotuloPerfil}</div>`;
- remover a linha `import { rotuloStatus } from '../lib/formato'` (não é mais usada no arquivo).

Em `app/src/lib/formato.ts`, trocar `  gestao: 'Gestão',` por `  gestao: 'Gerência',`.

Em `app/src/pages/admin/Usuarios.tsx`:
- trocar `<option value="gestao">Gestão</option>` por `<option value="gestao">Gerência (só consulta)</option>`;
- trocar o texto `Responsável opera o almoxarifado. Supervisor acompanha. Hoje cada supervisor recebe as duas funções nas suas bases.` por `Responsável opera o almoxarifado. Supervisor acompanha. Nas bases, cada supervisor recebe as duas funções. Responsável no 211 é a gestão do almoxarifado: aprova, entrega, ajusta o estoque e inventaria.`

- [ ] **Step 7: Checar tudo**

Run: `cd app && npx vitest run && npx tsc -b && npm run lint`
Expected: todos os testes passam (75 anteriores + 10 novos); `tsc` sem erro; lint sem erro e sem aviso novo.

- [ ] **Step 8: Commit**

```bash
git add app/src/lib/perfis.ts app/src/lib/perfis.test.ts app/src/auth/SessaoContext.tsx app/src/components/Layout.tsx app/src/lib/formato.ts app/src/pages/admin/Usuarios.tsx
git commit -m "feat(app): perfil da gestora, locais geridos e rótulos de perfil" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Ajuste de estoque só pela gestão e pelo admin (app)

**Files:**
- Modify: `app/src/pages/movimentar/Movimentar.tsx` (`Movimentar` e `Ajuste`)
- Modify: `app/src/components/Layout.tsx` (`useMenu`)
- Modify: `app/e2e/03-movimentar.spec.ts` (teste de ajuste)

**Interfaces:**
- Consumes: `useSessao().almoxGeridos` (Task 3); `rpc_registrar_ajuste` com a permissão nova (Task 1).
- Produces: `/movimentar/ajuste` só com formulário para quem tem `almoxGeridos`; para os demais, a mensagem `Ajuste de estoque é feito pela gestão do almoxarifado ou pelo administrador.`

- [ ] **Step 1: Reescrever o teste E2E de ajuste**

Em `app/e2e/03-movimentar.spec.ts`, trocar o início do teste `'ajuste de inventário mostra a diferença e exige justificativa'`:

```ts
test('ajuste de inventário mostra a diferença e exige justificativa', async ({ page }) => {
  await entrar(page, 'victor')
  await page.goto('/movimentar/ajuste')
```

por:

```ts
test('ajuste de inventário: só a gestão ajusta, mostra a diferença e exige justificativa', async ({ page }) => {
  await entrar(page, 'victor')
  await page.getByRole('link', { name: 'Movimentar', exact: true }).click()
  await expect(page.getByRole('link', { name: /Ajuste de inventário/ })).toHaveCount(0)
  await page.goto('/movimentar/ajuste')
  await expect(page.getByText('Ajuste de estoque é feito pela gestão do almoxarifado ou pelo administrador.')).toBeVisible()
  await sair(page)

  await entrar(page, 'carlos')
  await page.goto('/movimentar/ajuste')
```

(O restante do teste continua igual: carlos escolhe Mantena, conta 14, vê a diferença, registra, confere saldo e histórico.)

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd app && npx playwright test`
Expected: o teste de ajuste falha: victor ainda vê o link "Ajuste de inventário" em Movimentar. Os demais passam.

- [ ] **Step 3: Tela Movimentar e Ajuste pela gestão**

Em `app/src/pages/movimentar/Movimentar.tsx`, trocar a função `Movimentar` inteira por:

```tsx
export function Movimentar() {
  const { almoxResponsavel, almoxGeridos } = useSessao()
  const operaBase = almoxResponsavel.some((a) => a.tipo === 'base')
  if (!almoxResponsavel.length && !almoxGeridos.length) return <Vazio>Você não é responsável por nenhum almoxarifado.</Vazio>
  const opcoes = [
    { para: '/movimentar/saida', titulo: 'Registrar saída', texto: 'Aplicação em serviço, perda ou avaria.', mostrar: almoxResponsavel.length > 0 },
    { para: '/movimentar/transferencia', titulo: 'Transferir entre bases', texto: 'Só entre bases do mesmo supervisor.', mostrar: operaBase },
    { para: '/movimentar/devolucao', titulo: 'Devolver ao 211', texto: 'Material que volta ao almoxarifado regional.', mostrar: operaBase },
    {
      para: '/movimentar/ajuste',
      titulo: 'Ajuste de inventário',
      texto: 'Contagem física contra o saldo, com justificativa. Só a gestão do almoxarifado e o administrador.',
      mostrar: almoxGeridos.length > 0,
    },
  ]
  return (
    <div className="pilha">
      <PaginaTopo titulo="Movimentar" trilha={['Operação', 'Movimentar']} />
      <div className="grade-cartoes">
        {opcoes
          .filter((o) => o.mostrar)
          .map((o) => (
            <Link key={o.para} to={o.para} className="etiqueta">
              <div style={{ fontWeight: 600, fontSize: '1.05rem' }}>{o.titulo}</div>
              <div className="legenda">{o.texto}</div>
            </Link>
          ))}
      </div>
    </div>
  )
}
```

Na função `Ajuste`, trocar:

```tsx
  const { almoxResponsavel } = useSessao()
  const { material, aceitaFracao } = useCatalogo()
  const [almoxId, setAlmoxId] = useState(almoxResponsavel.find((a) => a.tipo === 'base')?.id ?? almoxResponsavel[0]?.id ?? '')
```

por:

```tsx
  const { almoxGeridos } = useSessao()
  const { material, aceitaFracao } = useCatalogo()
  const [almoxId, setAlmoxId] = useState(almoxGeridos.find((a) => a.tipo === 'base')?.id ?? almoxGeridos[0]?.id ?? '')
```

trocar:

```tsx
  if (!almoxResponsavel.length) return <Vazio>Você não é responsável por nenhum almoxarifado.</Vazio>
```

(a ocorrência dentro de `Ajuste`) por:

```tsx
  if (!almoxGeridos.length) return <Vazio>Ajuste de estoque é feito pela gestão do almoxarifado ou pelo administrador.</Vazio>
```

e trocar `<SeletorAlmox valor={almoxId} onChange={setAlmoxId} opcoes={almoxResponsavel} />` (a de `Ajuste`) por `<SeletorAlmox valor={almoxId} onChange={setAlmoxId} opcoes={almoxGeridos} />`.

- [ ] **Step 4: Menu Movimentar para quem gere**

Em `app/src/components/Layout.tsx`, em `useMenu`:
- trocar `const { ehAdmin, veTudo, almoxResponsavel, almoxVisiveis } = useSessao()` por `const { ehAdmin, veTudo, almoxResponsavel, almoxVisiveis, almoxGeridos } = useSessao()`;
- trocar `if (opera) itens.push({ para: '/movimentar', rotulo: 'Movimentar', grupo: 'Operação' })` por `if (opera || almoxGeridos.length > 0) itens.push({ para: '/movimentar', rotulo: 'Movimentar', grupo: 'Operação' })`.

- [ ] **Step 5: Rodar tudo**

Run: `cd app && npx tsc -b && npm run lint && npx playwright test`
Expected: `tsc` e lint sem erro; `26 passed`.

- [ ] **Step 6: Commit**

```bash
git add app/src/pages/movimentar/Movimentar.tsx app/src/components/Layout.tsx app/e2e/03-movimentar.spec.ts
git commit -m "feat(app): ajuste de estoque só pela gestão e pelo admin" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Sigla no SAP em Unidades (app)

**Files:**
- Modify: `app/src/pages/admin/Materiais.tsx` (`AdminUnidades`)
- Modify: `app/e2e/01-cadastros.spec.ts` (primeiro teste)

**Interfaces:**
- Consumes: `unidades.sigla_sap` (Task 1); `useCatalogo()` (`unidades`, `materiais`, `recarregar`); tipo `Unidade`.
- Produces: campo "Sigla no SAP" por unidade (`aria-label` `Sigla no SAP de <código>`), salvo ao sair do campo; sigla repetida recusada antes de gravar com `A sigla <SIGLA> já é da unidade <CÓDIGO>.`

- [ ] **Step 1: Escrever o teste E2E**

Em `app/e2e/01-cadastros.spec.ts`, no teste `'admin vê os 13 almoxarifados e as unidades da planilha'`, depois da linha `await expect(page.getByRole('row', { name: /^PC/ })).toContainText('Não')`, acrescentar:

```ts
  await expect(page.getByLabel('Sigla no SAP de PC', { exact: true })).toHaveValue('PEÇ')
  await page.getByLabel('Sigla no SAP de PR', { exact: true }).fill('PAR')
  await page.getByLabel('Sigla no SAP de PR', { exact: true }).press('Tab')
  await expect(page.getByText('Unidade PR atualizada.')).toBeVisible()
  await page.getByLabel('Sigla no SAP de JG', { exact: true }).fill('PEÇ')
  await page.getByLabel('Sigla no SAP de JG', { exact: true }).press('Tab')
  await expect(page.getByText('A sigla PEÇ já é da unidade PC.')).toBeVisible()
  await expect(page.getByLabel('Sigla no SAP de JG', { exact: true })).toHaveValue('')
  await page.reload()
  await expect(page.getByLabel('Sigla no SAP de PR', { exact: true })).toHaveValue('PAR')
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd app && npx playwright test`
Expected: FAIL no primeiro teste: não existe campo `Sigla no SAP de PC`.

- [ ] **Step 3: Implementar**

Em `app/src/pages/admin/Materiais.tsx`:
- trocar `import { supabase, type Material } from '../../lib/supabase'` por `import { supabase, type Material, type Unidade } from '../../lib/supabase'`;
- trocar a função `AdminUnidades` inteira por:

```tsx
/** Tira uma chave do registro sem mexer no resto. */
function sem(registro: Record<string, string>, chave: string): Record<string, string> {
  const copia = { ...registro }
  delete copia[chave]
  return copia
}

export function AdminUnidades() {
  const { unidades, materiais, recarregar } = useCatalogo()
  const [codigo, setCodigo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [fracao, setFracao] = useState(false)
  const [sigla, setSigla] = useState('')
  // Siglas em edição, por código da unidade (vazio = mostra a do banco)
  const [siglas, setSiglas] = useState<Record<string, string>>({})
  const [erro, setErro] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)

  async function executar(fn: () => Promise<unknown>, msg: string) {
    setErro(null)
    setOk(null)
    try {
      await fn()
      setOk(msg)
      await recarregar()
    } catch (e) {
      setErro(mensagemErro(e))
    }
  }

  /** A sigla SAP não se repete entre unidades. Devolve o erro ou null. */
  function siglaRepetida(nova: string, codigoAtual: string): string | null {
    const dona = unidades.find((u) => u.codigo !== codigoAtual && u.sigla_sap === nova)
    return nova && dona ? `A sigla ${nova} já é da unidade ${dona.codigo}.` : null
  }

  async function salvarSigla(u: Unidade) {
    const nova = (siglas[u.codigo] ?? u.sigla_sap ?? '').trim()
    if (nova === (u.sigla_sap ?? '')) {
      setSiglas((s) => sem(s, u.codigo))
      return
    }
    const repetida = siglaRepetida(nova, u.codigo)
    if (repetida) {
      setOk(null)
      setErro(repetida)
      setSiglas((s) => sem(s, u.codigo))
      return
    }
    await executar(
      () => dadosOuErro(supabase.from('unidades').update({ sigla_sap: nova || null }).eq('codigo', u.codigo)),
      `Unidade ${u.codigo} atualizada.`,
    )
    setSiglas((s) => sem(s, u.codigo))
  }

  return (
    <div className="pilha">
      <PaginaTopo
        titulo="Unidades"
        trilha={['Cadastros', 'Unidades']}
        sub="Lista fechada. Unidade sem fração exige quantidade inteira. A importação não cria unidade: cadastre aqui antes. A sigla no SAP é como a unidade aparece na coluna UMB da planilha de reservas (ex.: PEÇ para PC)."
      />
      <Aviso tipo="erro">{erro}</Aviso>
      <Aviso tipo="sucesso">{ok}</Aviso>
      <div className="tabela-envoltorio">
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Descrição</th>
              <th>Aceita fração</th>
              <th>Sigla no SAP</th>
              <th className="num">Materiais</th>
            </tr>
          </thead>
          <tbody>
            {unidades.map((u) => (
              <tr key={u.codigo}>
                <td className="mono">{u.codigo}</td>
                <td>{u.descricao}</td>
                <td>
                  <label className="linha">
                    <input
                      type="checkbox"
                      style={{ width: 'auto', minHeight: 0 }}
                      checked={u.aceita_fracao}
                      onChange={(e) =>
                        executar(
                          () => dadosOuErro(supabase.from('unidades').update({ aceita_fracao: e.target.checked }).eq('codigo', u.codigo)),
                          `Unidade ${u.codigo} atualizada.`,
                        )
                      }
                    />
                    {u.aceita_fracao ? 'Sim' : 'Não'}
                  </label>
                </td>
                <td style={{ width: 130 }}>
                  <input
                    aria-label={`Sigla no SAP de ${u.codigo}`}
                    value={siglas[u.codigo] ?? u.sigla_sap ?? ''}
                    onChange={(e) => setSiglas({ ...siglas, [u.codigo]: e.target.value })}
                    onBlur={() => void salvarSigla(u)}
                  />
                </td>
                <td className="num">{materiais.filter((m) => m.unidade === u.codigo).length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <form
        className="cartao linha-fim"
        onSubmit={(e) => {
          e.preventDefault()
          const novaSigla = sigla.trim()
          const repetida = siglaRepetida(novaSigla, '')
          if (repetida) {
            setOk(null)
            setErro(repetida)
            return
          }
          void executar(
            () =>
              dadosOuErro(
                supabase.from('unidades').insert({
                  codigo: codigo.trim().toUpperCase(),
                  descricao: descricao.trim() || null,
                  aceita_fracao: fracao,
                  sigla_sap: novaSigla || null,
                }),
              ),
            `Unidade ${codigo.trim().toUpperCase()} cadastrada.`,
          ).then(() => {
            setCodigo('')
            setDescricao('')
            setFracao(false)
            setSigla('')
          })
        }}
      >
        <Campo rotulo="Código" style={{ maxWidth: 120 }}>
          <input required value={codigo} onChange={(e) => setCodigo(e.target.value)} />
        </Campo>
        <Campo rotulo="Descrição" style={{ flex: 1, minWidth: 180 }}>
          <input value={descricao} onChange={(e) => setDescricao(e.target.value)} />
        </Campo>
        <Campo rotulo="Sigla no SAP" style={{ maxWidth: 130 }}>
          <input value={sigla} onChange={(e) => setSigla(e.target.value)} />
        </Campo>
        <label className="linha" style={{ minHeight: 42 }}>
          <input type="checkbox" style={{ width: 'auto', minHeight: 0 }} checked={fracao} onChange={(e) => setFracao(e.target.checked)} />
          Aceita fração
        </label>
        <button className="botao primario" type="submit">
          Cadastrar unidade
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 4: Rodar tudo**

Run: `cd app && npx tsc -b && npm run lint && npx playwright test`
Expected: `tsc` e lint sem erro; `26 passed`.

- [ ] **Step 5: Commit**

```bash
git add app/src/pages/admin/Materiais.tsx app/e2e/01-cadastros.spec.ts
git commit -m "feat(app): sigla no SAP no cadastro de unidades" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Cadastro de motivos de redução (app)

**Files:**
- Create: `app/src/pages/cadastros/MotivosReducao.tsx`
- Modify: `app/src/App.tsx` (rota)
- Modify: `app/src/components/Layout.tsx` (`useMenu`)
- Modify: `app/e2e/01-cadastros.spec.ts` (teste novo no fim do arquivo)

**Interfaces:**
- Consumes: tabela `motivos_reducao` (Task 2); `useSessao().ehGestora`, `ehAdmin` (Task 3).
- Produces: rota `/cadastros/motivos`; item de menu "Motivos de redução" (grupo Cadastros) para gestora e admin; campos com `aria-label` `Nome do motivo <descrição>`, `<descrição> exige texto`, `<descrição> ativo`; formulário com "Novo motivo" e botão "Cadastrar motivo". Motivo novo entra com `ordem = 50`.

- [ ] **Step 1: Escrever o teste E2E**

No fim de `app/e2e/01-cadastros.spec.ts`, acrescentar:

```ts
test('gestora mantém os motivos de redução; supervisor não acessa', async ({ page }) => {
  await entrar(page, 'carlos')
  await page.getByRole('link', { name: 'Motivos de redução' }).click()
  await expect(page.getByRole('heading', { name: 'Motivos de redução', level: 1 })).toBeVisible()
  await expect(page.getByLabel(/^Nome do motivo/)).toHaveCount(4)
  await page.getByLabel('Novo motivo').fill('Pedido em duplicidade')
  await page.getByRole('button', { name: 'Cadastrar motivo' }).click()
  await expect(page.getByText('Motivo "Pedido em duplicidade" cadastrado.')).toBeVisible()
  await page.getByLabel('Pedido em duplicidade ativo').uncheck()
  await expect(page.getByText('Motivo "Pedido em duplicidade" inativado.')).toBeVisible()
  await page.getByLabel('Novo motivo').fill('outro')
  await page.getByRole('button', { name: 'Cadastrar motivo' }).click()
  await expect(page.getByText('Já existe um motivo com esse nome.')).toBeVisible()
  await sair(page)

  await entrar(page, 'victor')
  await expect(page.getByRole('link', { name: 'Motivos de redução' })).toHaveCount(0)
  await page.goto('/cadastros/motivos')
  await expect(page.getByText('Acesso restrito à gestão do almoxarifado e ao administrador.')).toBeVisible()
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd app && npx playwright test`
Expected: FAIL no teste novo: não existe o link "Motivos de redução".

- [ ] **Step 3: Criar a tela**

Criar `app/src/pages/cadastros/MotivosReducao.tsx`:

```tsx
import { useState, type FormEvent } from 'react'
import { useSessao } from '../../auth/SessaoContext'
import { Aviso, Campo, Carregando, PaginaTopo } from '../../components/ui'
import { mensagemErro } from '../../lib/erros'
import { supabase } from '../../lib/supabase'
import { dadosOuErro, listaOuErro, useConsulta } from '../../lib/useConsulta'

/** Motivos novos entram depois dos padrões e antes de "Outro" (90). */
const ORDEM_NOVO = 50

export function MotivosReducao() {
  const { ehGestora, ehAdmin } = useSessao()
  const consulta = useConsulta(
    () => listaOuErro(supabase.from('motivos_reducao').select('*').order('ordem').order('descricao')),
    [],
  )
  const [nomes, setNomes] = useState<Record<number, string>>({})
  const [novo, setNovo] = useState('')
  const [exigeTexto, setExigeTexto] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)

  if (!ehGestora && !ehAdmin) return <Aviso tipo="erro">Acesso restrito à gestão do almoxarifado e ao administrador.</Aviso>

  async function executar(fn: () => Promise<unknown>, mensagem: string): Promise<boolean> {
    setErro(null)
    setOk(null)
    let deuCerto = false
    try {
      await fn()
      setOk(mensagem)
      deuCerto = true
    } catch (e) {
      setErro((e as { code?: string }).code === '23505' ? 'Já existe um motivo com esse nome.' : mensagemErro(e))
    }
    setNomes({})
    await consulta.recarregar()
    return deuCerto
  }

  async function cadastrar(e: FormEvent) {
    e.preventDefault()
    const descricao = novo.trim()
    if (!descricao) return setErro('Informe o motivo.')
    const feito = await executar(
      () => dadosOuErro(supabase.from('motivos_reducao').insert({ descricao, exige_texto: exigeTexto, ordem: ORDEM_NOVO })),
      `Motivo "${descricao}" cadastrado.`,
    )
    if (feito) {
      setNovo('')
      setExigeTexto(false)
    }
  }

  const motivos = consulta.dados ?? []
  return (
    <div className="pilha">
      <PaginaTopo
        titulo="Motivos de redução"
        trilha={['Cadastros', 'Motivos de redução']}
        sub="Usados quando a solicitação é aprovada abaixo do pedido. Motivo não é apagado: inative para tirar da lista. Com “exige texto”, quem aprova precisa escrever o detalhe."
      />
      <Aviso tipo="erro">{erro ?? consulta.erro}</Aviso>
      <Aviso tipo="sucesso">{ok}</Aviso>
      {consulta.carregando && !consulta.dados ? (
        <Carregando />
      ) : (
        <div className="tabela-envoltorio">
          <table>
            <thead>
              <tr>
                <th>Motivo</th>
                <th>Exige texto</th>
                <th>Situação</th>
              </tr>
            </thead>
            <tbody>
              {motivos.map((m) => (
                <tr key={m.id}>
                  <td>
                    <input
                      aria-label={`Nome do motivo ${m.descricao}`}
                      value={nomes[m.id] ?? m.descricao}
                      onChange={(e) => setNomes({ ...nomes, [m.id]: e.target.value })}
                      onBlur={() => {
                        const nome = (nomes[m.id] ?? m.descricao).trim()
                        if (nome && nome !== m.descricao)
                          void executar(
                            () => dadosOuErro(supabase.from('motivos_reducao').update({ descricao: nome }).eq('id', m.id)),
                            `Motivo renomeado para "${nome}".`,
                          )
                        else setNomes({})
                      }}
                    />
                  </td>
                  <td>
                    <label className="linha">
                      <input
                        type="checkbox"
                        style={{ width: 'auto', minHeight: 0 }}
                        aria-label={`${m.descricao} exige texto`}
                        checked={m.exige_texto}
                        onChange={(e) =>
                          void executar(
                            () => dadosOuErro(supabase.from('motivos_reducao').update({ exige_texto: e.target.checked }).eq('id', m.id)),
                            `Motivo "${m.descricao}" atualizado.`,
                          )
                        }
                      />
                      {m.exige_texto ? 'Sim' : 'Não'}
                    </label>
                  </td>
                  <td>
                    <label className="linha">
                      <input
                        type="checkbox"
                        style={{ width: 'auto', minHeight: 0 }}
                        aria-label={`${m.descricao} ativo`}
                        checked={m.ativo}
                        onChange={(e) =>
                          void executar(
                            () => dadosOuErro(supabase.from('motivos_reducao').update({ ativo: e.target.checked }).eq('id', m.id)),
                            `Motivo "${m.descricao}" ${e.target.checked ? 'reativado' : 'inativado'}.`,
                          )
                        }
                      />
                      {m.ativo ? 'Ativo' : 'Inativo'}
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <form className="cartao linha-fim" onSubmit={(e) => void cadastrar(e)}>
        <Campo rotulo="Novo motivo" style={{ flex: 1, minWidth: 220 }}>
          <input value={novo} onChange={(e) => setNovo(e.target.value)} />
        </Campo>
        <label className="linha" style={{ minHeight: 42 }}>
          <input type="checkbox" style={{ width: 'auto', minHeight: 0 }} checked={exigeTexto} onChange={(e) => setExigeTexto(e.target.checked)} />
          Exige texto livre
        </label>
        <button className="botao primario" type="submit">
          Cadastrar motivo
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 4: Rota e menu**

Em `app/src/App.tsx`:
- acrescentar o import `import { MotivosReducao } from './pages/cadastros/MotivosReducao'`;
- antes de `<Route path="admin/almoxarifados" …`, acrescentar `<Route path="cadastros/motivos" element={<MotivosReducao />} />`.

Em `app/src/components/Layout.tsx`, em `useMenu`:
- trocar `const { ehAdmin, veTudo, almoxResponsavel, almoxVisiveis, almoxGeridos } = useSessao()` por `const { ehAdmin, ehGestora, veTudo, almoxResponsavel, almoxVisiveis, almoxGeridos } = useSessao()`;
- antes de `if (ehAdmin) {`, acrescentar:

```ts
  if (ehGestora || ehAdmin) itens.push({ para: '/cadastros/motivos', rotulo: 'Motivos de redução', grupo: 'Cadastros' })
```

- [ ] **Step 5: Rodar tudo**

Run: `cd app && npx tsc -b && npm run lint && npx playwright test`
Expected: `tsc` e lint sem erro; `27 passed`.

- [ ] **Step 6: Commit**

```bash
git add app/src/pages/cadastros/MotivosReducao.tsx app/src/App.tsx app/src/components/Layout.tsx app/e2e/01-cadastros.spec.ts
git commit -m "feat(app): cadastro de motivos de redução" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Equipes por base e saída com equipe e quem retirou (banco)

**Files:**
- Create: `supabase/migrations/20261001100200_equipes_saida.sql`
- Modify: `supabase/tests/database/04_fundacao.test.sql` (seções F e G, antes de `select * from finish();`)
- Modify: `supabase/tests/database/01_warefly.test.sql` (dados iniciais e seção E)
- Modify: `supabase/tests/database/02_painel.test.sql` (dados iniciais e saída)
- Modify: `supabase/tests/database/03_correcoes.test.sql` (dados iniciais e I1)
- Modify: `app/src/lib/database.types.ts` (regenerado)

**Interfaces:**
- Consumes: `public.fn_gere_local()` (Task 1), `public.fn_eh_responsavel()`, `public.fn_pode_ver()`, `public.fn_eh_admin()`.
- Produces:
  - Tabela `public.equipes (id uuid, almox_id uuid → base, nome text, ativa boolean, criado_por uuid nulo só em carga por script, criado_em)`; nome único por base sem diferenciar maiúscula; leitura para quem vê a base; `insert (almox_id, nome)` e `update (nome, ativa)` para o responsável da base, a gestão que gere a base e o admin; sem `delete`. Equipe só em base. Equipe com saída não muda de nome.
  - `public.saidas.equipe_id uuid`, `public.saidas.retirado_por_nome text`.
  - `public.rpc_registrar_saida(p_almox_id uuid, p_itens jsonb, p_motivo motivo_saida default 'aplicacao', p_data_ocorrencia date default null, p_justificativa text default null, p_observacao text default null, p_id uuid default null, p_equipe_id uuid default null, p_retirado_por_nome text default null) returns uuid`. Em base com motivo `aplicacao`: equipe e nome obrigatórios. Equipe informada precisa estar ativa e ser da própria base, ou, num regional, de uma base dele.
  - Mensagens exatas usadas pelo app (Task 9): `Informe a equipe que retirou o material.` e `Informe o nome de quem retirou o material.`

- [ ] **Step 1: Escrever as seções F e G do pgTAP**

Em `supabase/tests/database/04_fundacao.test.sql`, inserir antes de `select * from finish();`:

```sql
-- ---------------------------------------------------------------------
-- F. Equipes: por base, mantidas pelo supervisor da base, pela gestão e
--    pelo admin; não são apagadas
-- ---------------------------------------------------------------------
-- id da equipe pelo nome, sem passar pelo RLS de quem consulta
create function tests.equipe(p_nome text) returns uuid language sql stable security definer as $$
  select id from public.equipes where nome = p_nome
$$;
grant execute on function tests.equipe(text) to authenticated;

select tests.como('VICTOR');
select lives_ok($$ insert into equipes (almox_id, nome) values (tests.a('MNT'), 'Equipe 12') $$, 'supervisor cadastra equipe da própria base');
select throws_ok($$ insert into equipes (almox_id, nome) values (tests.a('MNT'), 'EQUIPE 12') $$, '23505', null, 'nome repetido na base, mesmo com outra caixa');
select throws_ok($$ insert into equipes (almox_id, nome) values (tests.a('MNT'), 'Equipe 13 ') $$, '23514', null, 'nome com espaço sobrando é recusado');
select throws_ok($$ insert into equipes (almox_id, nome) values (tests.a('RSP'), 'Equipe 1') $$, '42501', null, 'supervisor não cadastra equipe em base de outro');
select throws_ok($$ delete from equipes $$, '42501', null, 'equipe não é apagada');
reset role;
select is((select criado_por from equipes where nome = 'Equipe 12'), tests.u('VICTOR'), 'equipe guarda quem cadastrou');

select tests.como('GESTORA');
select lives_ok($$ insert into equipes (almox_id, nome) values (tests.a('ITB'), 'Equipe 7') $$, 'gestora cadastra equipe numa base do 211');
select throws_like($$ insert into equipes (almox_id, nome) values (tests.a('211'), 'Equipe do 211') $$,
  'Equipe é cadastrada em uma base%', 'equipe não fica no 211');
select throws_ok($$ insert into equipes (almox_id, nome) values (tests.a('B2'), 'Equipe B') $$, '42501', null, 'gestora não cadastra equipe em base de outro regional');
reset role;

select tests.como('ADMIN');
select lives_ok($$ insert into equipes (almox_id, nome) values (tests.a('B2'), 'Equipe B') $$, 'admin cadastra equipe em qualquer base');
reset role;

select tests.como('VICTOR');
select is((select count(*) from equipes)::int, 2, 'supervisor vê só as equipes das próprias bases');
reset role;

-- ---------------------------------------------------------------------
-- G. Saída com equipe e quem retirou
-- ---------------------------------------------------------------------
select tests.como('VICTOR');
select throws_like(
  $$ select rpc_registrar_saida(tests.a('MNT'), '[{"material_id":"10000000-0000-4000-a000-0000000000e1","quantidade":1}]') $$,
  'Informe a equipe que retirou o material.', 'aplicação na base exige equipe');
select throws_like(
  $$ select rpc_registrar_saida(tests.a('MNT'), '[{"material_id":"10000000-0000-4000-a000-0000000000e1","quantidade":1}]',
       'aplicacao', null, null, null, null, tests.equipe('Equipe 12'), '   ') $$,
  'Informe o nome de quem retirou o material.', 'e o nome de quem retirou');
select throws_like(
  $$ select rpc_registrar_saida(tests.a('MNT'), '[{"material_id":"10000000-0000-4000-a000-0000000000e1","quantidade":1}]',
       'aplicacao', null, null, null, null, tests.equipe('Equipe 7'), 'João') $$,
  'A equipe Equipe 7 não é de Mantena.', 'equipe de outra base é recusada');
select lives_ok(
  $$ select rpc_registrar_saida(tests.a('MNT'), '[{"material_id":"10000000-0000-4000-a000-0000000000e1","quantidade":2}]',
       'aplicacao', null, null, 'NS 4455', null, tests.equipe('Equipe 12'), '  João Silva ') $$,
  'saída de aplicação com equipe e quem retirou');
select lives_ok(
  $$ select rpc_registrar_saida(tests.a('MNT'), '[{"material_id":"10000000-0000-4000-a000-0000000000e1","quantidade":1}]',
       'perda', null, 'Caiu do caminhão') $$,
  'perda não exige equipe');
reset role;
select is((select retirado_por_nome from saidas where observacao = 'NS 4455'), 'João Silva', 'nome gravado sem espaços sobrando');
select is((select equipe_id from saidas where observacao = 'NS 4455'), tests.equipe('Equipe 12'), 'equipe gravada na saída');
select is(tests.saldo('MNT'), 17.000, 'saídas baixaram o saldo (20 − 2 − 1)');

select tests.como('VICTOR');
select throws_like($$ update equipes set nome = 'Equipe 12A' where nome = 'Equipe 12' $$,
  'A equipe Equipe 12 já tem saídas registradas%', 'equipe usada não muda de nome');
select lives_ok($$ update equipes set ativa = false where nome = 'Equipe 12' $$, 'equipe usada pode ser inativada');
select throws_like(
  $$ select rpc_registrar_saida(tests.a('MNT'), '[{"material_id":"10000000-0000-4000-a000-0000000000e1","quantidade":1}]',
       'aplicacao', null, null, null, null, tests.equipe('Equipe 12'), 'João') $$,
  'A equipe Equipe 12 está inativa%', 'equipe inativa é recusada');
reset role;

select tests.como('GESTORA');
select lives_ok(
  $$ select rpc_registrar_saida(tests.a('211'), '[{"material_id":"10000000-0000-4000-a000-0000000000e1","quantidade":1}]',
       'aplicacao', null, null, null, null, tests.equipe('Equipe 7'), 'Pedro') $$,
  'saída no 211 para equipe de uma base do 211');
select lives_ok(
  $$ select rpc_registrar_saida(tests.a('211'), '[{"material_id":"10000000-0000-4000-a000-0000000000e1","quantidade":1}]') $$,
  'no 211 a equipe é opcional');
select throws_like(
  $$ select rpc_registrar_saida(tests.a('211'), '[{"material_id":"10000000-0000-4000-a000-0000000000e1","quantidade":1}]',
       'aplicacao', null, null, null, null, tests.equipe('Equipe B'), 'Pedro') $$,
  'A equipe Equipe B não é de Almoxarifado regional.', 'equipe de base de outro regional é recusada');
reset role;
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `supabase test db`
Expected: FAIL em `04_fundacao.test.sql` com `relation "public.equipes" does not exist`.

- [ ] **Step 3: Escrever a migration**

Criar `supabase/migrations/20261001100200_equipes_saida.sql`:

```sql
-- =====================================================================
-- Warefly · Fundação 3 — Equipes por base e saída com equipe
-- A saída de aplicação numa base registra qual equipe e quem retirou.
-- O controle de estoque continua indo só até a base.
-- =====================================================================

-- ---------------------------------------------------------------------
-- equipes
-- ---------------------------------------------------------------------
create table public.equipes (
  id          uuid primary key default gen_random_uuid(),
  almox_id    uuid not null references public.almoxarifados (id),
  nome        text not null,
  ativa       boolean not null default true,
  criado_por  uuid default auth.uid() references public.perfis (id),
  criado_em   timestamptz not null default now(),
  constraint equipes_nome_ck check (nome = btrim(nome) and nome <> '')
);

create unique index equipes_nome_uk on public.equipes (almox_id, lower(nome));

comment on column public.equipes.criado_por is 'Quem cadastrou. Nulo só em carga feita por script.';

-- ---------------------------------------------------------------------
-- saidas: equipe e quem retirou
-- ---------------------------------------------------------------------
alter table public.saidas
  add column equipe_id uuid references public.equipes (id),
  add column retirado_por_nome text,
  add constraint saidas_retirado_por_ck check (
    retirado_por_nome is null or (retirado_por_nome = btrim(retirado_por_nome) and retirado_por_nome <> '')
  );

create index saidas_equipe_idx on public.saidas (equipe_id);

-- ---------------------------------------------------------------------
-- Regras da equipe: fica numa base; com saída registrada, não muda de nome
-- ---------------------------------------------------------------------
create or replace function interno.tg_equipe()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT'
     and not exists (select 1 from public.almoxarifados where id = new.almox_id and tipo = 'base') then
    raise exception 'Equipe é cadastrada em uma base.';
  end if;
  if tg_op = 'UPDATE' and new.nome is distinct from old.nome
     and exists (select 1 from public.saidas where equipe_id = old.id) then
    raise exception 'A equipe % já tem saídas registradas e não pode mudar de nome. Inative esta e cadastre outra.', old.nome;
  end if;
  return new;
end;
$$;

create trigger equipes_regras
  before insert or update on public.equipes
  for each row execute function interno.tg_equipe();

-- ---------------------------------------------------------------------
-- RLS: lê quem vê a base; mantém o responsável da base, a gestão que
-- gere a base e o admin
-- ---------------------------------------------------------------------
alter table public.equipes enable row level security;

create policy equipes_select on public.equipes
  for select to authenticated using (public.fn_pode_ver(almox_id));
create policy equipes_insert on public.equipes
  for insert to authenticated
  with check (public.fn_eh_responsavel(almox_id) or public.fn_gere_local(almox_id) or public.fn_eh_admin());
create policy equipes_update on public.equipes
  for update to authenticated
  using (public.fn_eh_responsavel(almox_id) or public.fn_gere_local(almox_id) or public.fn_eh_admin())
  with check (public.fn_eh_responsavel(almox_id) or public.fn_gere_local(almox_id) or public.fn_eh_admin());

revoke all on public.equipes from anon, authenticated;
grant select on public.equipes to authenticated;
grant insert (almox_id, nome), update (nome, ativa) on public.equipes to authenticated;

-- ---------------------------------------------------------------------
-- rpc_registrar_saida (+ p_equipe_id, p_retirado_por_nome)
-- ---------------------------------------------------------------------
drop function public.rpc_registrar_saida(uuid, jsonb, public.motivo_saida, date, text, text, uuid);

create function public.rpc_registrar_saida(
  p_almox_id          uuid,
  p_itens             jsonb,
  p_motivo            public.motivo_saida default 'aplicacao',
  p_data_ocorrencia   date default null,
  p_justificativa     text default null,
  p_observacao        text default null,
  p_id                uuid default null,
  p_equipe_id         uuid default null,
  p_retirado_por_nome text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_usuario  uuid;
  v_almox    public.almoxarifados;
  v_equipe   public.equipes;
  v_motivo   public.motivo_saida := coalesce(p_motivo, 'aplicacao');
  v_data     date := coalesce(p_data_ocorrencia, public.fn_hoje());
  v_nome     text := interno.fn_texto(p_retirado_por_nome);
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

  -- Aplicação em serviço numa base: qual equipe e quem retirou
  if v_almox.tipo = 'base' and v_motivo = 'aplicacao' then
    if p_equipe_id is null then
      raise exception 'Informe a equipe que retirou o material.';
    end if;
    if v_nome is null then
      raise exception 'Informe o nome de quem retirou o material.';
    end if;
  end if;

  -- A equipe é da própria base; num regional, de uma das bases dele
  if p_equipe_id is not null then
    select * into v_equipe from public.equipes where id = p_equipe_id;
    if not found then
      raise exception 'Equipe não encontrada.';
    end if;
    if not v_equipe.ativa then
      raise exception 'A equipe % está inativa. Escolha outra ou reative em Equipes.', v_equipe.nome;
    end if;
    if v_equipe.almox_id <> p_almox_id
       and not exists (select 1 from public.almoxarifados b where b.id = v_equipe.almox_id and b.pai_id = p_almox_id) then
      raise exception 'A equipe % não é de %.', v_equipe.nome, v_almox.nome;
    end if;
  end if;

  perform interno.fn_checar_data(v_data, 'data da saída');
  perform interno.fn_checar_itens(p_itens);

  insert into public.saidas (id, almox_id, motivo, data_ocorrencia, justificativa, observacao,
                             equipe_id, retirado_por_nome, registrado_por)
  values (coalesce(p_id, gen_random_uuid()), p_almox_id, v_motivo, v_data, interno.fn_texto(p_justificativa),
          interno.fn_texto(p_observacao), p_equipe_id, v_nome, v_usuario)
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
-- Privilégios
-- ---------------------------------------------------------------------
revoke execute on all functions in schema public from public, anon;
grant execute on all functions in schema public to authenticated;
revoke execute on all functions in schema interno from public;
```

- [ ] **Step 4: Rodar o pgTAP**

Run: `supabase db reset --local && supabase test db`
Expected: `04_fundacao.test.sql .. ok`. Os arquivos 01, 02 e 03 falham nas saídas de aplicação em base sem equipe (esperado; o Step 5 corrige).

- [ ] **Step 5: Ajustar os testes existentes (saída em base passa equipe e quem retirou)**

Em `supabase/tests/database/01_warefly.test.sql`, logo depois do `insert into materiais (...) values ... ;` dos dados iniciais (termina na linha com `'MATERIAL INATIVO'`), acrescentar:

```sql
insert into equipes (id, almox_id, nome) values ('20000000-0000-4000-a000-000000000001', tests.a('MNT'), 'Equipe 12');
```

Na seção E do mesmo arquivo, trocar:

```sql
select throws_like(
  $$ select rpc_registrar_saida(tests.a('MNT'), tests.j('[{"material_id":"PARAF","quantidade":100}]')) $$,
  'Saldo insuficiente em Mantena%Faça um ajuste de inventário%', 'saída acima do saldo é bloqueada');
```

por:

```sql
select throws_like(
  $$ select rpc_registrar_saida(tests.a('MNT'), tests.j('[{"material_id":"PARAF","quantidade":100}]'), 'aplicacao', null, null, null, null,
       '20000000-0000-4000-a000-000000000001', 'João') $$,
  'Saldo insuficiente em Mantena%Faça um ajuste de inventário%', 'saída acima do saldo é bloqueada');
```

e trocar:

```sql
select lives_ok(
  $$ select rpc_registrar_saida(tests.a('MNT'), tests.j('[{"material_id":"PARAF","quantidade":4}]'), 'aplicacao', null, null, 'Equipe 12, NS 4455') $$,
  'saída de aplicação');
```

por:

```sql
select lives_ok(
  $$ select rpc_registrar_saida(tests.a('MNT'), tests.j('[{"material_id":"PARAF","quantidade":4}]'), 'aplicacao', null, null, 'NS 4455', null,
       '20000000-0000-4000-a000-000000000001', 'João') $$,
  'saída de aplicação com equipe e quem retirou');
```

Em `supabase/tests/database/02_painel.test.sql`, depois do `insert into materiais (...)` dos dados iniciais, acrescentar:

```sql
insert into equipes (id, almox_id, nome) values ('20000000-0000-4000-a000-0000000000e1', tests.a('MNT'), 'Equipe 1');
```

e trocar:

```sql
select rpc_registrar_saida(tests.a('MNT'),
  '[{"material_id":"10000000-0000-4000-a000-0000000000b1","quantidade":4},{"material_id":"10000000-0000-4000-a000-0000000000b2","quantidade":1}]');
```

por:

```sql
select rpc_registrar_saida(tests.a('MNT'),
  '[{"material_id":"10000000-0000-4000-a000-0000000000b1","quantidade":4},{"material_id":"10000000-0000-4000-a000-0000000000b2","quantidade":1}]',
  'aplicacao', null, null, null, null, '20000000-0000-4000-a000-0000000000e1', 'João');
```

Em `supabase/tests/database/03_correcoes.test.sql`, depois do `insert into materiais (...)` dos dados iniciais, acrescentar:

```sql
insert into equipes (id, almox_id, nome) values ('20000000-0000-4000-a000-0000000000f1', tests.a('MNT'), 'Equipe 1');
```

e trocar as duas chamadas de saída do bloco I1:

```sql
select is(rpc_registrar_saida(tests.a('MNT'), '[{"material_id":"10000000-0000-4000-a000-0000000000d1","quantidade":5}]',
  'aplicacao', null, null, null, tests.id('sai')), tests.id('sai'), 'saída usa o id gerado pelo app');
select is(rpc_registrar_saida(tests.a('MNT'), '[{"material_id":"10000000-0000-4000-a000-0000000000d1","quantidade":5}]',
  'aplicacao', null, null, null, tests.id('sai')), tests.id('sai'), 'repetir a saída devolve o mesmo registro');
```

por:

```sql
select is(rpc_registrar_saida(tests.a('MNT'), '[{"material_id":"10000000-0000-4000-a000-0000000000d1","quantidade":5}]',
  'aplicacao', null, null, null, tests.id('sai'), '20000000-0000-4000-a000-0000000000f1', 'João'), tests.id('sai'),
  'saída usa o id gerado pelo app');
select is(rpc_registrar_saida(tests.a('MNT'), '[{"material_id":"10000000-0000-4000-a000-0000000000d1","quantidade":5}]',
  'aplicacao', null, null, null, tests.id('sai'), '20000000-0000-4000-a000-0000000000f1', 'João'), tests.id('sai'),
  'repetir a saída devolve o mesmo registro');
```

- [ ] **Step 6: Rodar o pgTAP inteiro**

Run: `supabase test db`
Expected: `All tests successful.` nos 4 arquivos.

- [ ] **Step 7: Regenerar os tipos e checar o app**

Run: o comando de tipos, depois `cd app && npx tsc -b`
Expected: `tipos atualizados`; `tsc` sem erro; `equipes`, `saidas.equipe_id`, `saidas.retirado_por_nome` e os novos argumentos `p_equipe_id` e `p_retirado_por_nome` de `rpc_registrar_saida` aparecem em `database.types.ts`. Não rode o E2E nesta task: os testes de saída de aplicação em base ficam vermelhos até a Task 9, que traz a tela com equipe.

- [ ] **Step 8: Commit**

```bash
git add supabase/migrations/20261001100200_equipes_saida.sql supabase/tests/database app/src/lib/database.types.ts
git commit -m "feat(banco): equipes por base e saída com equipe e quem retirou" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Cadastro de equipes por base (app)

**Files:**
- Create: `app/src/pages/cadastros/Equipes.tsx`
- Modify: `app/src/App.tsx` (rota)
- Modify: `app/src/components/Layout.tsx` (`useMenu`)
- Modify: `app/e2e/03-movimentar.spec.ts` (teste novo antes do teste de saída)

**Interfaces:**
- Consumes: tabela `equipes` (Task 7); `useSessao().basesEquipes` (Task 3); `SeletorAlmox` de `app/src/pages/Saldo.tsx`.
- Produces: rota `/cadastros/equipes?base=<id>`; item de menu "Equipes" (grupo Cadastros) para quem tem `basesEquipes`; seletor "Base"; linhas com `aria-label` `Nome da equipe <nome>` e `<nome> ativa`; formulário "Nova equipe" + botão "Cadastrar equipe"; mensagens `Equipe "<nome>" cadastrada em <base>.` e `Já existe uma equipe "<nome>" em <base>.` A Task 9 linka para esta rota.

- [ ] **Step 1: Escrever o teste E2E**

Em `app/e2e/03-movimentar.spec.ts`, acrescentar **antes** do teste `'saída da base: …'`:

```ts
test('supervisor cadastra as equipes das próprias bases', async ({ page }) => {
  await entrar(page, 'victor')
  await page.getByRole('link', { name: 'Equipes', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Equipes', level: 1 })).toBeVisible()
  const bases = await page.getByLabel('Base').locator('option').allTextContents()
  expect(bases).toEqual(['CRC · Coroaci', 'ITB · Itabirinha', 'MNT · Mantena'])

  await page.getByLabel('Base').selectOption({ label: 'MNT · Mantena' })
  for (const nome of ['Equipe 12', 'Equipe 15']) {
    await page.getByLabel('Nova equipe').fill(nome)
    await page.getByRole('button', { name: 'Cadastrar equipe' }).click()
    await expect(page.getByText(`Equipe "${nome}" cadastrada em Mantena.`)).toBeVisible()
  }
  await page.getByLabel('Nova equipe').fill('equipe 12')
  await page.getByRole('button', { name: 'Cadastrar equipe' }).click()
  await expect(page.getByText('Já existe uma equipe "equipe 12" em Mantena.')).toBeVisible()

  await page.getByLabel('Base').selectOption({ label: 'ITB · Itabirinha' })
  await page.getByLabel('Nova equipe').fill('Equipe 7')
  await page.getByRole('button', { name: 'Cadastrar equipe' }).click()
  await expect(page.getByText('Equipe "Equipe 7" cadastrada em Itabirinha.')).toBeVisible()
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd app && npx playwright test`
Expected: FAIL no teste novo: não existe o link "Equipes".

- [ ] **Step 3: Criar a tela**

Criar `app/src/pages/cadastros/Equipes.tsx`:

```tsx
import { useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useSessao } from '../../auth/SessaoContext'
import { Aviso, Campo, Carregando, PaginaTopo, Vazio } from '../../components/ui'
import { mensagemErro } from '../../lib/erros'
import { supabase } from '../../lib/supabase'
import { dadosOuErro, listaOuErro, useConsulta } from '../../lib/useConsulta'
import { SeletorAlmox } from '../Saldo'

export function Equipes() {
  const { basesEquipes } = useSessao()
  const [params, setParams] = useSearchParams()
  const baseId = params.get('base') ?? basesEquipes[0]?.id ?? ''
  const base = basesEquipes.find((b) => b.id === baseId)
  const consulta = useConsulta(
    () => (base ? listaOuErro(supabase.from('equipes').select('*').eq('almox_id', base.id).order('nome')) : Promise.resolve([])),
    [base?.id],
  )
  const [nomes, setNomes] = useState<Record<string, string>>({})
  const [nova, setNova] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)

  if (!basesEquipes.length) {
    return <Vazio>As equipes são mantidas pelo supervisor da base, pela gestão do almoxarifado e pelo administrador.</Vazio>
  }

  async function executar(fn: () => Promise<unknown>, mensagem: string, repetido: string): Promise<boolean> {
    setErro(null)
    setOk(null)
    let deuCerto = false
    try {
      await fn()
      setOk(mensagem)
      deuCerto = true
    } catch (e) {
      setErro((e as { code?: string }).code === '23505' ? repetido : mensagemErro(e))
    }
    setNomes({})
    await consulta.recarregar()
    return deuCerto
  }

  async function cadastrar(e: FormEvent) {
    e.preventDefault()
    if (!base) return
    const nome = nova.trim()
    if (!nome) return setErro('Informe o nome da equipe.')
    const feito = await executar(
      () => dadosOuErro(supabase.from('equipes').insert({ almox_id: base.id, nome })),
      `Equipe "${nome}" cadastrada em ${base.nome}.`,
      `Já existe uma equipe "${nome}" em ${base.nome}.`,
    )
    if (feito) setNova('')
  }

  return (
    <div className="pilha">
      <PaginaTopo
        titulo="Equipes"
        trilha={['Cadastros', 'Equipes']}
        sub="Equipes de cada base, para a saída registrar quem retirou o material. Equipe que já tem saída não muda de nome: inative e cadastre outra."
      />
      <SeletorAlmox
        rotulo="Base"
        valor={baseId}
        onChange={(id) => {
          setParams({ base: id })
          setNomes({})
          setErro(null)
          setOk(null)
        }}
        opcoes={basesEquipes}
      />
      {!base && <Aviso tipo="erro">Você não mantém as equipes desta base.</Aviso>}
      <Aviso tipo="erro">{erro ?? consulta.erro}</Aviso>
      <Aviso tipo="sucesso">{ok}</Aviso>
      {base &&
        (consulta.carregando && !consulta.dados ? (
          <Carregando />
        ) : !consulta.dados?.length ? (
          <Vazio>Nenhuma equipe cadastrada em {base.nome}.</Vazio>
        ) : (
          <div className="tabela-envoltorio">
            <table>
              <thead>
                <tr>
                  <th>Equipe</th>
                  <th>Situação</th>
                </tr>
              </thead>
              <tbody>
                {consulta.dados.map((q) => (
                  <tr key={q.id}>
                    <td>
                      <input
                        aria-label={`Nome da equipe ${q.nome}`}
                        value={nomes[q.id] ?? q.nome}
                        onChange={(e) => setNomes({ ...nomes, [q.id]: e.target.value })}
                        onBlur={() => {
                          const nome = (nomes[q.id] ?? q.nome).trim()
                          if (nome && nome !== q.nome)
                            void executar(
                              () => dadosOuErro(supabase.from('equipes').update({ nome }).eq('id', q.id)),
                              `Equipe renomeada para "${nome}".`,
                              `Já existe uma equipe "${nome}" em ${base.nome}.`,
                            )
                          else setNomes({})
                        }}
                      />
                    </td>
                    <td>
                      <label className="linha">
                        <input
                          type="checkbox"
                          style={{ width: 'auto', minHeight: 0 }}
                          aria-label={`${q.nome} ativa`}
                          checked={q.ativa}
                          onChange={(e) =>
                            void executar(
                              () => dadosOuErro(supabase.from('equipes').update({ ativa: e.target.checked }).eq('id', q.id)),
                              `Equipe "${q.nome}" ${e.target.checked ? 'reativada' : 'inativada'}.`,
                              '',
                            )
                          }
                        />
                        {q.ativa ? 'Ativa' : 'Inativa'}
                      </label>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      {base && (
        <form className="cartao linha-fim" onSubmit={(e) => void cadastrar(e)}>
          <Campo rotulo="Nova equipe" style={{ flex: 1, minWidth: 220 }}>
            <input value={nova} onChange={(e) => setNova(e.target.value)} />
          </Campo>
          <button className="botao primario" type="submit">
            Cadastrar equipe
          </button>
        </form>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Rota e menu**

Em `app/src/App.tsx`:
- acrescentar o import `import { Equipes } from './pages/cadastros/Equipes'`;
- depois da rota `cadastros/motivos`, acrescentar `<Route path="cadastros/equipes" element={<Equipes />} />`.

Em `app/src/components/Layout.tsx`, em `useMenu`:
- trocar `const { ehAdmin, ehGestora, veTudo, almoxResponsavel, almoxVisiveis, almoxGeridos } = useSessao()` por `const { ehAdmin, ehGestora, veTudo, almoxResponsavel, almoxVisiveis, almoxGeridos, basesEquipes } = useSessao()`;
- logo depois da linha do item `/cadastros/motivos`, acrescentar:

```ts
  if (basesEquipes.length > 0) itens.push({ para: '/cadastros/equipes', rotulo: 'Equipes', grupo: 'Cadastros' })
```

- [ ] **Step 5: Rodar tudo**

Run: `cd app && npx tsc -b && npm run lint && npx playwright test`
Expected: `tsc` e lint sem erro. O teste novo passa. Falham, desde a Task 7, os testes que registram saída de aplicação em base sem equipe (`'saída da base: …'` e `'resposta perdida na rede: …'`) e os que dependem do saldo ou do histórico deixados por eles (`'ajuste de inventário: …'` e, se houver, testes de arquivos seguintes que usem esse saldo). A Task 9 corrige; os demais passam.

- [ ] **Step 6: Commit**

```bash
git add app/src/pages/cadastros/Equipes.tsx app/src/App.tsx app/src/components/Layout.tsx app/e2e/03-movimentar.spec.ts
git commit -m "feat(app): cadastro de equipes por base" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Saída com equipe e quem retirou; histórico mostra os dois (app)

**Files:**
- Create: `app/src/lib/saida.ts`
- Create: `app/src/lib/saida.test.ts`
- Modify: `app/src/pages/movimentar/Movimentar.tsx` (`Saida`)
- Modify: `app/src/pages/Historico.tsx`
- Modify: `app/e2e/03-movimentar.spec.ts` (testes de saída, de ajuste e de resposta perdida)

**Interfaces:**
- Consumes: `rpc_registrar_saida` com `p_equipe_id` e `p_retirado_por_nome` e as mensagens exatas (Task 7); tabela `equipes`; rota `/cadastros/equipes?base=<id>` (Task 8); equipes "Equipe 12", "Equipe 15" (MNT) e "Equipe 7" (ITB) criadas pelo E2E da Task 8.
- Produces: `validarQuemRetirou(p: { ehBase: boolean; motivo: Enum<'motivo_saida'>; equipeId: string; retiradoPor: string }): string | null`. Na tela de saída, campos "Equipe" e "Quem retirou". No histórico, o documento da saída aparece como `SAI-000123 · <equipe> · <quem retirou>`.

- [ ] **Step 1: Escrever os testes da validação**

Criar `app/src/lib/saida.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { validarQuemRetirou } from './saida'

describe('validarQuemRetirou', () => {
  const aplicacaoNaBase = { ehBase: true, motivo: 'aplicacao' as const, equipeId: 'e1', retiradoPor: 'João' }

  it('aplicação na base exige a equipe', () => {
    expect(validarQuemRetirou({ ...aplicacaoNaBase, equipeId: '' })).toBe('Informe a equipe que retirou o material.')
  })
  it('e o nome de quem retirou, sem aceitar só espaços', () => {
    expect(validarQuemRetirou({ ...aplicacaoNaBase, retiradoPor: '   ' })).toBe('Informe o nome de quem retirou o material.')
  })
  it('com equipe e nome, passa', () => {
    expect(validarQuemRetirou(aplicacaoNaBase)).toBeNull()
  })
  it('perda e avaria não exigem equipe nem nome', () => {
    expect(validarQuemRetirou({ ...aplicacaoNaBase, motivo: 'perda', equipeId: '', retiradoPor: '' })).toBeNull()
    expect(validarQuemRetirou({ ...aplicacaoNaBase, motivo: 'avaria', equipeId: '', retiradoPor: '' })).toBeNull()
  })
  it('no almoxarifado regional os dois são opcionais', () => {
    expect(validarQuemRetirou({ ...aplicacaoNaBase, ehBase: false, equipeId: '', retiradoPor: '' })).toBeNull()
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd app && npx vitest run src/lib/saida.test.ts`
Expected: FAIL com `Failed to resolve import "./saida"`.

- [ ] **Step 3: Escrever a validação**

Criar `app/src/lib/saida.ts`:

```ts
import type { Enum } from './supabase'

/**
 * Na aplicação em serviço de uma base, a saída diz qual equipe e quem retirou.
 * Mesmas regras e mensagens da rpc_registrar_saida. Devolve o erro ou null.
 */
export function validarQuemRetirou(p: {
  ehBase: boolean
  motivo: Enum<'motivo_saida'>
  equipeId: string
  retiradoPor: string
}): string | null {
  if (!p.ehBase || p.motivo !== 'aplicacao') return null
  if (!p.equipeId) return 'Informe a equipe que retirou o material.'
  if (!p.retiradoPor.trim()) return 'Informe o nome de quem retirou o material.'
  return null
}
```

- [ ] **Step 4: Rodar os testes da validação**

Run: `cd app && npx vitest run src/lib/saida.test.ts`
Expected: PASS (5 testes).

- [ ] **Step 5: Atualizar os testes E2E de saída**

Em `app/e2e/03-movimentar.spec.ts`, trocar o teste `'saída da base: bloqueia acima do saldo e exige justificativa de perda'` inteiro por:

```ts
test('saída da base: exige equipe e quem retirou, bloqueia acima do saldo e exige justificativa de perda', async ({ page }) => {
  await entrar(page, 'victor')
  await page.getByRole('link', { name: 'Movimentar', exact: true }).click()
  await page.getByRole('link', { name: /Registrar saída/ }).last().click()
  await page.getByLabel('Almoxarifado').selectOption({ label: 'MNT · Mantena' })
  await adicionarItem(page, '900001', '100')
  await page.getByRole('button', { name: 'Registrar saída' }).click()
  await expect(page.getByText('Informe a equipe que retirou o material.')).toBeVisible()

  // Trocar de base limpa a equipe escolhida
  await page.getByLabel('Equipe').selectOption({ label: 'Equipe 12' })
  await page.getByLabel('Almoxarifado').selectOption({ label: 'ITB · Itabirinha' })
  await expect(page.getByLabel('Equipe')).toHaveValue('')
  await page.getByLabel('Almoxarifado').selectOption({ label: 'MNT · Mantena' })
  await expect(page.getByLabel('Equipe')).toHaveValue('')

  await page.getByLabel('Equipe').selectOption({ label: 'Equipe 12' })
  await page.getByRole('button', { name: 'Registrar saída' }).click()
  await expect(page.getByText('Informe o nome de quem retirou o material.')).toBeVisible()
  await page.getByLabel('Quem retirou').fill('João Silva')
  await page.getByRole('button', { name: 'Registrar saída' }).click()
  await expect(page.getByText(/Saldo insuficiente em Mantena.*Faça um ajuste de inventário/)).toBeVisible()

  await page.getByLabel('Quantidade de 900001').fill('4')
  await page.getByLabel('Motivo').selectOption('perda')
  await page.getByRole('button', { name: 'Registrar saída' }).click()
  await expect(page.getByText('Informe a justificativa da perda.')).toBeVisible()

  await page.getByLabel('Motivo').selectOption('aplicacao')
  await page.getByLabel('Observação').fill('NS 4455')
  await page.getByRole('button', { name: 'Registrar saída' }).click()
  await expect(page.getByText(/SAI-\d{6} registrada/)).toBeVisible()
  await expect(await saldo(page, 'MNT · Mantena', '900001')).toContainText('20')
})
```

No teste de ajuste (Task 4), trocar a última linha:

```ts
  await expect(page.getByRole('row', { name: /Saída.*900001.*−4/ })).toBeVisible()
```

por:

```ts
  await expect(page.getByRole('row', { name: /Saída.*900001.*−4.*Equipe 12 · João Silva/ })).toBeVisible()
```

No teste `'resposta perdida na rede: tentar de novo não duplica a saída'`, trocar:

```ts
  await adicionarItem(page, '900003', '1')
```

por:

```ts
  await adicionarItem(page, '900003', '1')
  await page.getByLabel('Equipe').selectOption({ label: 'Equipe 15' })
  await page.getByLabel('Quem retirou').fill('Maria')
```

- [ ] **Step 6: Rodar e ver falhar**

Run: `cd app && npx playwright test`
Expected: FAIL no teste de saída: não existe o campo "Equipe".

- [ ] **Step 7: Tela de saída com equipe e quem retirou**

Em `app/src/pages/movimentar/Movimentar.tsx`:

Acrescentar aos imports:

```ts
import { validarQuemRetirou } from '../../lib/saida'
import { listaOuErro, useConsulta } from '../../lib/useConsulta'
```

Logo depois da função `useSaldos`, acrescentar:

```tsx
/** Equipes ativas que podem retirar num almoxarifado: as da base, ou as das bases de um regional. */
function useEquipes(local: Almox | undefined, almoxarifados: Almox[]) {
  const ids = !local
    ? []
    : local.tipo === 'base'
      ? [local.id]
      : almoxarifados.filter((a) => a.pai_id === local.id).map((a) => a.id)
  return useConsulta(
    () =>
      ids.length
        ? listaOuErro(supabase.from('equipes').select('id, nome, almox_id').eq('ativa', true).in('almox_id', ids).order('nome'))
        : Promise.resolve([]),
    [ids.join()],
  )
}
```

Na função `Saida`, trocar:

```tsx
  const { almoxResponsavel } = useSessao()
  const { material, aceitaFracao } = useCatalogo()
  const [almoxId, setAlmoxId] = useState(almoxResponsavel.find((a) => a.tipo === 'base')?.id ?? almoxResponsavel[0]?.id ?? '')
  const [versao, setVersao] = useState(0)
  const saldos = useSaldos(almoxId, versao)
```

por:

```tsx
  const { almoxResponsavel, almoxarifados, almox } = useSessao()
  const { material, aceitaFracao } = useCatalogo()
  const [almoxId, setAlmoxId] = useState(almoxResponsavel.find((a) => a.tipo === 'base')?.id ?? almoxResponsavel[0]?.id ?? '')
  const [versao, setVersao] = useState(0)
  const saldos = useSaldos(almoxId, versao)
  const atual = almox(almoxId)
  const equipes = useEquipes(atual, almoxarifados)
  // Trocar de almoxarifado limpa a equipe (ver o SeletorAlmox abaixo)
  const [equipeId, setEquipeId] = useState('')
  const [retiradoPor, setRetiradoPor] = useState('')
```

Ainda em `Saida`, logo depois da linha `const [idRegistro, setIdRegistro] = useState(() => crypto.randomUUID())`, acrescentar:

```tsx
  const ehBase = atual?.tipo === 'base'
  const exigeQuem = ehBase && motivo === 'aplicacao'
```

Em `registrar()`, trocar:

```tsx
    if (motivo !== 'aplicacao' && !justificativa.trim()) return setErro(`Informe a justificativa da ${rotuloStatus(motivo).toLowerCase()}.`)
    setOcupado(true)
```

por:

```tsx
    if (motivo !== 'aplicacao' && !justificativa.trim()) return setErro(`Informe a justificativa da ${rotuloStatus(motivo).toLowerCase()}.`)
    const quem = validarQuemRetirou({ ehBase, motivo, equipeId, retiradoPor })
    if (quem) return setErro(quem)
    setOcupado(true)
```

trocar:

```tsx
      p_id: idRegistro,
    })
    setOcupado(false)
    if (error) return setErro(mensagemErro(error))
```

(o da chamada `rpc_registrar_saida`) por:

```tsx
      p_id: idRegistro,
      p_equipe_id: equipeId || undefined,
      p_retirado_por_nome: retiradoPor.trim() || undefined,
    })
    setOcupado(false)
    if (error) return setErro(mensagemErro(error))
```

e, logo depois de `setObservacao('')` no fim de `registrar()`, acrescentar `setRetiradoPor('')`.

No JSX de `Saida`, trocar `<SeletorAlmox valor={almoxId} onChange={setAlmoxId} opcoes={almoxResponsavel} />` por (depois da Task 4 essa linha só existe em `Saida`; a de `Ajuste` usa `almoxGeridos`):

```tsx
          <SeletorAlmox
            valor={almoxId}
            onChange={(id) => {
              setAlmoxId(id)
              setEquipeId('')
            }}
            opcoes={almoxResponsavel}
          />
```

Ainda no JSX de `Saida`, trocar:

```tsx
          <Campo rotulo="Observação" ajuda="Livre: equipe, nota de serviço…" style={{ gridColumn: '1 / -1' }}>
            <input value={observacao} onChange={(e) => setObservacao(e.target.value)} />
          </Campo>
        </div>
      </div>
```

por:

```tsx
          <Campo rotulo="Equipe" ajuda={exigeQuem ? 'Obrigatória na aplicação em serviço.' : 'Opcional.'}>
            <select value={equipeId} onChange={(e) => setEquipeId(e.target.value)}>
              <option value="">{exigeQuem ? 'Escolha a equipe' : 'Nenhuma'}</option>
              {(equipes.dados ?? []).map((q) => (
                <option key={q.id} value={q.id}>
                  {ehBase ? q.nome : `${q.nome} · ${almox(q.almox_id)?.codigo ?? ''}`}
                </option>
              ))}
            </select>
          </Campo>
          <Campo rotulo="Quem retirou" ajuda={exigeQuem ? 'Nome de quem pegou o material. Obrigatório na aplicação em serviço.' : 'Opcional.'}>
            <input value={retiradoPor} onChange={(e) => setRetiradoPor(e.target.value)} />
          </Campo>
          <Campo rotulo="Observação" ajuda="Livre: nota de serviço…" style={{ gridColumn: '1 / -1' }}>
            <input value={observacao} onChange={(e) => setObservacao(e.target.value)} />
          </Campo>
        </div>
        {ehBase && equipes.dados && equipes.dados.length === 0 && (
          <Aviso tipo="atencao">
            Nenhuma equipe ativa em {atual?.nome}. <Link to={`/cadastros/equipes?base=${almoxId}`}>Cadastre as equipes</Link> antes de
            registrar aplicação em serviço.
          </Aviso>
        )}
      </div>
```

- [ ] **Step 8: Histórico mostra equipe e quem retirou**

Em `app/src/pages/Historico.tsx`:
- no tipo `LinhaDocumento`, trocar `saidas: { numero: number } | null` por `saidas: { numero: number; retirado_por_nome?: string | null; equipes?: { nome: string } | null } | null`;
- na string do `select`, trocar `saidas(numero)` por `saidas(numero, retirado_por_nome, equipes(nome))`;
- trocar:

```tsx
                ) : m.saida_id ? (
                  formatarDoc('SAI', m.saidas?.numero ?? 0)
```

por:

```tsx
                ) : m.saida_id ? (
                  [formatarDoc('SAI', m.saidas?.numero ?? 0), m.saidas?.equipes?.nome, m.saidas?.retirado_por_nome].filter(Boolean).join(' · ')
```

- [ ] **Step 9: Rodar tudo**

Run: `cd app && npx vitest run && npx tsc -b && npm run lint && npx playwright test`
Expected: todos os unitários passam (75 + 10 + 5); `tsc` e lint sem erro; `28 passed`.

- [ ] **Step 10: Commit**

```bash
git add app/src/lib/saida.ts app/src/lib/saida.test.ts app/src/pages/movimentar/Movimentar.tsx app/src/pages/Historico.tsx app/e2e/03-movimentar.spec.ts
git commit -m "feat(app): saída registra equipe e quem retirou; histórico mostra os dois" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Documentação e verificação final da fase

**Files:**
- Modify: `README.md`
- Modify: `WAREFLY_PLANO_IMPLEMENTAÇÃO.MD`

**Interfaces:**
- Consumes: tudo das Tasks 1 a 9.
- Produces: documentação coerente com a fase 1 e a contagem real de testes.

- [ ] **Step 1: Rodar a verificação completa e anotar os números**

Run (na raiz): `supabase db reset --local && supabase test db`
Run: `cd app && npx vitest run && npx tsc -b && npm run lint && npx playwright test`
Expected: pgTAP `All tests successful.` (anotar o total da linha `Tests=`); Vitest com o total de testes (anotar); `tsc` e lint sem erro; `28 passed`.

- [ ] **Step 2: Atualizar o README**

Em `README.md`:
- onde aparece `(192 verificações)` (duas vezes: tabela de estrutura e seção Testes), trocar pelo total anotado do pgTAP;
- trocar `As 8 migrations já foram aplicadas no projeto `hkfbypwkjvhuuwbijlwy` em 28/09/2026.` por `As 8 primeiras migrations foram aplicadas no projeto `hkfbypwkjvhuuwbijlwy` em 28/09/2026. As da nova rodada (a partir de `20261001100000`) ainda não.`;
- no passo 3 de "Primeiro acesso", trocar `dê "Responsável" no 211 a quem opera o 211. Papel `gestao` para quem só acompanha.` por `dê "Responsável" no 211 à gestão do almoxarifado (aprova, entrega, ajusta o estoque e inventaria). Papel "Gerência" (`gestao`) para quem só acompanha.`;
- no mesmo passo 3, acrescentar o item: `- **Equipes**: cadastre as equipes de cada base (o supervisor também pode). A saída de aplicação em serviço exige equipe e o nome de quem retirou.`;
- em "Regras que o sistema garante", acrescentar dois itens:
  - `- Ajuste de estoque e saldo inicial só pela gestão do almoxarifado (responsável do regional) ou pelo administrador.`
  - `- Saída de aplicação em serviço numa base registra a equipe e quem retirou.`

- [ ] **Step 3: Atualizar o plano geral**

Em `WAREFLY_PLANO_IMPLEMENTAÇÃO.MD`:
- logo depois da linha `> 30/09/2026: o produto passou a se chamar Warefly e a seguir o design system em `design-system/` (seção 9).`, acrescentar: `> 30/09/2026: nova rodada (reservas CEMIG, solicitações, inventário) especificada em `docs/superpowers/specs/2026-09-30-warefly-reservas-solicitacoes-inventario-design.md`, que prevalece sobre este plano onde divergir.`;
- na tabela da seção 4, trocar `| Ajuste de inventário | Responsável do almox, com justificativa obrigatória |` por `| Ajuste de inventário | Gestão do almoxarifado (responsável do regional) ou admin, com justificativa obrigatória |`;
- na mesma tabela, trocar `| Registrar saída da base | Responsável da base |` por `| Registrar saída da base | Responsável da base, com equipe e quem retirou na aplicação em serviço |`.

- [ ] **Step 4: Commit**

```bash
git add README.md "WAREFLY_PLANO_IMPLEMENTAÇÃO.MD"
git commit -m "docs: fase 1 da nova rodada (gestão, motivos, equipes)" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
