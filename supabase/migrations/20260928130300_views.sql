-- =====================================================================
-- SIA · Passo 1.3 — Views
-- security_invoker: as views respeitam o RLS de quem consulta.
-- =====================================================================

-- ---------------------------------------------------------------------
-- v_saldo: saldo = soma das movimentações
-- ---------------------------------------------------------------------
create view public.v_saldo
with (security_invoker = true)
as
select
  mv.almox_id,
  a.codigo    as almox_codigo,
  a.nome      as almox_nome,
  mv.material_id,
  m.codigo_sap,
  m.descricao,
  m.unidade,
  m.grupo,
  sum(mv.quantidade)::numeric(12,3) as saldo,
  max(mv.data_ocorrencia)           as ultima_movimentacao
from public.movimentacoes mv
join public.almoxarifados a on a.id = mv.almox_id
join public.materiais m on m.id = mv.material_id
group by mv.almox_id, a.codigo, a.nome, mv.material_id, m.codigo_sap, m.descricao, m.unidade, m.grupo;

-- ---------------------------------------------------------------------
-- v_em_transito: itens de remessas em trânsito, com dias desde o envio
-- ---------------------------------------------------------------------
create view public.v_em_transito
with (security_invoker = true)
as
select
  r.id          as remessa_id,
  r.numero      as remessa_numero,
  r.tipo,
  r.pedido_id,
  r.origem_id,
  o.codigo      as origem_codigo,
  o.nome        as origem_nome,
  r.destino_id,
  d.codigo      as destino_codigo,
  d.nome        as destino_nome,
  r.data_envio,
  r.enviado_em,
  (public.fn_hoje() - r.data_envio) as dias_em_transito,
  ri.id         as remessa_item_id,
  ri.material_id,
  m.codigo_sap,
  m.descricao,
  m.unidade,
  ri.qtd_enviada
from public.remessas r
join public.remessa_itens ri on ri.remessa_id = r.id
join public.almoxarifados o on o.id = r.origem_id
join public.almoxarifados d on d.id = r.destino_id
join public.materiais m on m.id = ri.material_id
where r.status = 'em_transito';

-- ---------------------------------------------------------------------
-- v_pedido_resumo: as quatro quantidades e as duas diferenças por item
--   diferença de atendimento = solicitado − enviado
--   diferença de conferência = enviado − recebido
-- Itens que chegaram sem estar no pedido aparecem com solicitado 0.
-- ---------------------------------------------------------------------
create view public.v_pedido_resumo
with (security_invoker = true)
as
select
  p.id                as pedido_id,
  p.numero            as pedido_numero,
  p.status            as pedido_status,
  p.externo,
  p.solicitante_id,
  s.codigo            as solicitante_codigo,
  s.nome              as solicitante_nome,
  p.atendente_id,
  at.codigo           as atendente_codigo,
  at.nome             as atendente_nome,
  r.id                as remessa_id,
  r.numero            as remessa_numero,
  r.status            as remessa_status,
  x.material_id,
  m.codigo_sap,
  m.descricao,
  m.unidade,
  coalesce(x.qtd_solicitada, 0)::numeric(12,3) as qtd_solicitada,
  x.qtd_aprovada,
  x.motivo_corte,
  case when r.id is not null then coalesce(x.qtd_enviada, 0) end::numeric(12,3) as qtd_enviada,
  case when r.data_recebimento is not null then coalesce(x.qtd_recebida, 0) end::numeric(12,3) as qtd_recebida,
  x.motivo_divergencia,
  case when r.id is not null
       then coalesce(x.qtd_solicitada, 0) - coalesce(x.qtd_enviada, 0)
  end::numeric(12,3) as diferenca_atendimento,
  case when r.data_recebimento is not null
       then coalesce(x.qtd_enviada, 0) - coalesce(x.qtd_recebida, 0)
  end::numeric(12,3) as diferenca_conferencia
from public.pedidos p
join public.almoxarifados s on s.id = p.solicitante_id
join public.almoxarifados at on at.id = p.atendente_id
left join public.remessas r on r.pedido_id = p.id
join lateral (
  select
    coalesce(pi.material_id, ri.material_id) as material_id,
    pi.qtd_solicitada,
    pi.qtd_aprovada,
    pi.motivo_corte,
    ri.qtd_enviada,
    ri.qtd_recebida,
    ri.motivo_divergencia
  from (select * from public.pedido_itens where pedido_id = p.id) pi
  full join (select * from public.remessa_itens where remessa_id = r.id) ri
    on ri.material_id = pi.material_id
) x on true
join public.materiais m on m.id = x.material_id;

-- ---------------------------------------------------------------------
-- v_divergencias_abertas: diferença, quantidade tratada e em aberto
--   diferenca > 0: faltou no destino · diferenca < 0: sobrou no destino
-- ---------------------------------------------------------------------
create view public.v_divergencias_abertas
with (security_invoker = true)
as
select
  ri.id              as remessa_item_id,
  r.id               as remessa_id,
  r.numero           as remessa_numero,
  r.tipo             as remessa_tipo,
  r.status           as remessa_status,
  r.pedido_id,
  r.origem_id,
  o.codigo           as origem_codigo,
  o.nome             as origem_nome,
  r.destino_id,
  d.codigo           as destino_codigo,
  d.nome             as destino_nome,
  r.data_envio,
  r.data_recebimento,
  (public.fn_hoje() - r.data_recebimento) as dias_em_aberto,
  ri.material_id,
  m.codigo_sap,
  m.descricao,
  m.unidade,
  ri.qtd_enviada,
  ri.qtd_recebida,
  ri.motivo_divergencia,
  (ri.qtd_enviada - ri.qtd_recebida)::numeric(12,3)                              as diferenca,
  coalesce(t.qtd_tratada, 0)::numeric(12,3)                                     as qtd_tratada,
  (abs(ri.qtd_enviada - ri.qtd_recebida) - coalesce(t.qtd_tratada, 0))::numeric(12,3) as qtd_em_aberto
from public.remessa_itens ri
join public.remessas r on r.id = ri.remessa_id
join public.almoxarifados o on o.id = r.origem_id
join public.almoxarifados d on d.id = r.destino_id
join public.materiais m on m.id = ri.material_id
left join (
  select remessa_item_id, sum(quantidade) as qtd_tratada
    from public.divergencia_tratamentos
   group by remessa_item_id
) t on t.remessa_item_id = ri.id
where ri.qtd_recebida is not null
  and ri.qtd_recebida <> ri.qtd_enviada
  and abs(ri.qtd_enviada - ri.qtd_recebida) - coalesce(t.qtd_tratada, 0) > 0;
