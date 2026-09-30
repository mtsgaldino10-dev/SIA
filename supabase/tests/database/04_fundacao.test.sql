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
