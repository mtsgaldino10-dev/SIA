# Warefly — Gestão de almoxarifado (antes SIA)
## Plano de implementação (MVP)

> Controle de almoxarifado descentralizado · Depósito 211 e bases
> Versão 1.2 · 28/09/2026 · Status: aguardando validação
> 30/09/2026: o produto passou a se chamar Warefly e a seguir o design system em `design-system/` (seção 9).
> 30/09/2026: nova rodada (reservas CEMIG, solicitações, inventário) especificada em `docs/superpowers/specs/2026-09-30-warefly-reservas-solicitacoes-inventario-design.md`, que prevalece sobre este plano onde divergir.

---

## 1. Contexto

O depósito **3256** é o almoxarifado geral e atende todos os tipos de equipe. O material de multifuncional, moto e comercial passa a ser controlado por um almoxarifado próprio, o **211**, que abastece **11 mini-almoxarifados** nas bases, divididos entre **4 supervisores**.

O SAP continua sendo o sistema oficial. O Warefly roda **em paralelo**, sem integração, e existe para responder uma pergunta que hoje não tem resposta confiável: *o que cada base pediu, o que foi enviado e o que realmente chegou*.

### Estrutura inicial

| Código | Nome | Tipo | Pai | Supervisor |
|---|---|---|---|---|
| 3256 | Almoxarifado geral | externo | — | — |
| 211 | Almoxarifado regional | regional | 3256 | — |
| RSP | Resplendor | base | 211 | Vinícius |
| AIM | Aimorés | base | 211 | Vinícius |
| CPN | Conselheiro Pena | base | 211 | Vinícius |
| MNT | Mantena | base | 211 | Victor |
| ITB | Itabirinha | base | 211 | Victor |
| CRC | Coroaci | base | 211 | Victor |
| SMS | Santa Maria do Suaçuí | base | 211 | Elton |
| SJE | São João Evangelista | base | 211 | Elton |
| SEF | Santa Efigênia | base | 211 | Elton |
| ITN | Itanhomi | base | 211 | Pedro |
| TRM | Tarumirim | base | 211 | Pedro |

> Os códigos de três letras das bases são sugestão e podem ser trocados antes do seed.

---

## 2. Decisões tomadas

- **Profundidade do controle:** até o mini-almox. A base registra entradas e saídas; a saída não é rastreada até a equipe.
- **Operação das bases:** hoje, o próprio supervisor. No futuro, um responsável local por base, entrando apenas como nova atribuição, sem mudar código.
- **SAP:** em paralelo, sem integração. O código SAP é a chave do material, e o número do documento SAP pode ser registrado como referência nas entradas.
- **Stack:** Supabase, projeto novo, começando do zero.
- **Transferência entre bases:** permitida de forma direta entre bases do mesmo supervisor.
- **Catálogo:** carga inicial a partir de planilha exportada do SAP.

---

## 3. Regras de ouro

1. **Saldo nunca é editado.** Saldo é sempre a soma das movimentações. A tabela `movimentacoes` só recebe inserções feitas por funções do banco; o app nunca escreve nela diretamente.
2. **Quatro quantidades por item de pedido:** solicitada, aprovada, enviada e recebida. Elas geram duas diferenças que nunca se misturam:
   - **Diferença de atendimento** = solicitado − enviado (o 211 não tinha ou cortou).
   - **Diferença de conferência** = enviado − recebido (saiu e não chegou igual).
3. **Quem envia não confirma o recebimento.** A conferência sempre tem dois lados.
4. **Todo registro guarda quem fez, quando registrou e a data real do fato.** O supervisor pode lançar depois; a data real fica preservada.
5. **Divergência não some sozinha.** Fica aberta até ser tratada com justificativa.
6. **Responsabilidade é do almoxarifado, não do cargo.** Permissões vêm da tabela de atribuições.
7. **Saldo não fica negativo.** Saída ou envio acima do saldo é bloqueado. Se o material existe fisicamente, o saldo está errado e o caminho é um ajuste de inventário com justificativa.

---

## 4. Papéis e permissões

Cada usuário tem um **papel global** e **atribuições por almoxarifado**.

- Papel global (`perfis.papel`): `admin`, `gestao` ou `operador`.
- Atribuição (`atribuicoes.funcao`): `responsavel` (opera o almox) ou `supervisor` (acompanha o almox).

Hoje cada supervisor recebe as duas funções nas suas bases. Quando houver responsável local, ele recebe `responsavel` e o supervisor mantém `supervisor`.

| Ação | Quem pode |
|---|---|
| Criar e enviar pedido de uma base | Responsável da base |
| Aprovar ou cortar pedido de base | Responsável do 211 |
| Enviar remessa de pedido | Responsável do 211 |
| Registrar recebimento | Responsável do almox de destino |
| Registrar "chegou depois" em divergência | Responsável do almox de destino |
| Tratar divergência (reenvio, baixa, ajuste) | Responsável do almox de origem |
| Registrar saída da base | Responsável da base, com equipe e quem retirou na aplicação em serviço |
| Transferir entre bases | Responsável da origem; origem e destino precisam ter o mesmo supervisor |
| Devolver material ao 211 | Responsável da base |
| Pedido externo ao 3256 e entrada avulsa | Responsável do 211 |
| Ajuste de inventário | Gestão do almoxarifado (responsável do regional) ou admin, com justificativa obrigatória |
| Cadastros, usuários e atribuições | Admin |
| Visualizar | Responsável e supervisor: seus almox · Responsável do 211: 211 e todas as bases · Gestão e admin: tudo |

---

## 5. Fluxos

### 5.1 Pedido da base ao 211

1. Responsável da base cria o pedido em **rascunho** e adiciona itens (busca por código SAP ou descrição).
2. Envia o pedido → status **solicitado**.
3. Responsável do 211 revisa: aprova a quantidade de cada item ou corta (com motivo) → status **aprovado**.
4. O 211 separa, informa a quantidade efetivamente enviada por item e registra o envio. O sistema cria a **remessa**, lança a saída do 211 e o pedido vai para **em trânsito**.
5. O 211 imprime a **guia de remessa**, que viaja junto com o material.

### 5.2 Recebimento com conferência

Como o supervisor não está em todas as bases quando o material chega, o controle se apoia na guia impressa:

1. Quem recebe fisicamente na base confere o material contra a guia, anota as quantidades e assina.
2. O supervisor lança o recebimento (na hora ou depois) informando:
   - quantidade contada de cada item;
   - **data real** da chegada;
   - **nome de quem contou** (não precisa ter login);
   - **foto da guia assinada** ou da carga (obrigatória);
   - itens que chegaram sem estar na guia (entram como sobra).
3. O sistema lança a entrada no destino com a quantidade recebida.
4. Sem diferença → remessa e pedido **encerrados**. Com diferença → **com divergência**, e cada item divergente recebe um motivo: `falta`, `sobra`, `avaria` ou `trocado`.

Item avariado não entra no saldo: `qtd_recebida` conta apenas o que chegou em condições de uso.

### 5.3 Tratamento de divergência

| Tratamento | Quando usar | Efeito no saldo |
|---|---|---|
| `reenvio` | Falta, e a origem vai mandar de novo | Gera nova remessa vinculada (com nova conferência) |
| `chegou_depois` | O item faltante apareceu | Entrada no destino |
| `baixa_transito` | Falta aceita como perda | Nenhum (o item já saiu da origem e não entrou no destino) |
| `ajuste_origem` | Sobra: a origem mandou mais do que registrou | Saída de ajuste na origem |
| `externo` | Divergência em remessa do 3256, tratada fora do sistema | Nenhum |

Toda ação exige justificativa. Quando todos os itens da remessa estiverem resolvidos, remessa e pedido vão para **encerrado**.

### 5.4 Pedido externo e entrada avulsa no 211

O 3256 não opera o sistema. Por isso:

- O 211 pode registrar um **pedido externo** ao 3256 (vai direto para solicitado, sem aprovação).
- Quando o material chega, o 211 registra o recebimento informando, por item, a quantidade enviada **conforme o documento SAP** e a quantidade contada, além do número do documento.
- **Entrada avulsa**: material que chegou sem pedido segue o mesmo fluxo, sem pedido vinculado.
- O 3256 não tem saldo no sistema; só o 211 recebe movimentação.

### 5.5 Saídas da base

Registro com data, motivo e itens:

- `aplicacao` — uso em serviço (motivo padrão);
- `perda` — justificativa obrigatória;
- `avaria` — justificativa obrigatória.

Campo de observação livre para quem quiser anotar equipe ou nota de serviço.

### 5.6 Transferência entre bases e devolução ao 211

As duas são remessas **sem pedido**:

- **Transferência:** origem e destino são bases com o mesmo supervisor. Entre supervisores diferentes, o material volta pelo 211.
- **Devolução:** base → 211.

Ambas seguem exatamente o fluxo de recebimento e divergência das seções 5.2 e 5.3.

### 5.7 Ajuste de inventário

O responsável conta o material, informa a quantidade contada e o sistema calcula a diferença contra o saldo e lança o ajuste. Justificativa obrigatória. Todo ajuste aparece em destaque no painel da gestão.

O mesmo mecanismo, com tipo `implantacao`, carrega o saldo inicial no dia D.

### 5.8 Ciclos de status

**Pedido**

```
rascunho → solicitado → aprovado → em_transito → encerrado
                                        └──→ com_divergencia → encerrado
rascunho | solicitado | aprovado (antes do envio) → cancelado
```

**Remessa**

```
em_transito → encerrada
     └──→ com_divergencia → encerrada
```

---

## 6. Modelo de dados

### 6.1 Enums

| Enum | Valores |
|---|---|
| `tipo_almox` | externo, regional, base |
| `papel_usuario` | admin, gestao, operador |
| `funcao_atribuicao` | responsavel, supervisor |
| `status_pedido` | rascunho, solicitado, aprovado, em_transito, com_divergencia, encerrado, cancelado |
| `tipo_remessa` | atendimento, externa, transferencia, devolucao, reenvio |
| `status_remessa` | em_transito, com_divergencia, encerrada |
| `motivo_divergencia` | falta, sobra, avaria, trocado |
| `tipo_tratamento` | reenvio, chegou_depois, baixa_transito, ajuste_origem, externo |
| `motivo_saida` | aplicacao, perda, avaria |
| `tipo_ajuste` | implantacao, inventario |
| `tipo_movimentacao` | saldo_inicial, envio_remessa, recebimento_remessa, saida, ajuste_inventario, ajuste_divergencia |

### 6.2 Tabelas

Quantidades usam `numeric(12,3)` para aceitar metro e quilo. Datas de registro em `timestamptz`; datas reais em `date`. Fuso: America/Sao_Paulo.

**almoxarifados**

| Coluna | Tipo | Observação |
|---|---|---|
| id | uuid PK | |
| codigo | text unique | 3256, 211, RSP… |
| nome | text | |
| tipo | tipo_almox | |
| pai_id | uuid FK → almoxarifados | nulo só no 3256 |
| cidade | text | |
| ativo | boolean | default true |

**perfis**

| Coluna | Tipo | Observação |
|---|---|---|
| id | uuid PK FK → auth.users | |
| nome | text | |
| matricula | text unique | opcional |
| email | text | |
| papel | papel_usuario | default operador |
| ativo | boolean | |

**atribuicoes**

| Coluna | Tipo | Observação |
|---|---|---|
| almox_id | uuid FK | |
| usuario_id | uuid FK → perfis | |
| funcao | funcao_atribuicao | |
| desde | date | default hoje |
| | | PK (almox_id, usuario_id, funcao) |

**materiais**

| Coluna | Tipo | Observação |
|---|---|---|
| id | uuid PK | |
| codigo_sap | text unique not null | chave de negócio |
| descricao | text | |
| unidade | text | lista fechada, definida a partir da planilha |
| grupo | text | opcional |
| ativo | boolean | |

**pedidos**

| Coluna | Tipo | Observação |
|---|---|---|
| id | uuid PK | |
| numero | bigint (sequence) | exibido como PED-000123 |
| solicitante_id | uuid FK → almoxarifados | |
| atendente_id | uuid FK → almoxarifados | sempre o pai do solicitante |
| externo | boolean | true quando o atendente é o 3256 |
| status | status_pedido | |
| observacao | text | |
| criado_por / criado_em | | |
| solicitado_em | timestamptz | |
| aprovado_por / aprovado_em | | |
| encerrado_em | timestamptz | |
| cancelado_por / cancelado_em / motivo_cancelamento | | |

**pedido_itens**

| Coluna | Tipo | Observação |
|---|---|---|
| id | uuid PK | |
| pedido_id | uuid FK | |
| material_id | uuid FK | unique (pedido_id, material_id) |
| qtd_solicitada | numeric > 0 | |
| qtd_aprovada | numeric ≥ 0 | nulo até a aprovação |
| motivo_corte | text | obrigatório se aprovada < solicitada |

**remessas**

| Coluna | Tipo | Observação |
|---|---|---|
| id | uuid PK | |
| numero | bigint (sequence) | exibido como REM-000123 |
| tipo | tipo_remessa | |
| origem_id / destino_id | uuid FK → almoxarifados | |
| pedido_id | uuid FK | único quando preenchido (1 pedido = 1 remessa no MVP) |
| remessa_ref_id | uuid FK → remessas | preenchido em reenvio |
| status | status_remessa | |
| documento_ref | text | nº da guia ou do documento SAP |
| enviado_por / enviado_em | | |
| data_recebimento | date | data real da chegada |
| conferido_por_nome | text | quem contou fisicamente |
| foto_path | text | caminho no Storage |
| recebido_registrado_por / recebido_registrado_em | | |
| observacao | text | |

**remessa_itens**

| Coluna | Tipo | Observação |
|---|---|---|
| id | uuid PK | |
| remessa_id | uuid FK | |
| material_id | uuid FK | unique (remessa_id, material_id) |
| qtd_enviada | numeric ≥ 0 | 0 para item que chegou sem estar na guia |
| qtd_recebida | numeric ≥ 0 | nulo até o recebimento |
| motivo_divergencia | motivo_divergencia | obrigatório quando recebida ≠ enviada |
| observacao | text | |

**divergencia_tratamentos**

| Coluna | Tipo | Observação |
|---|---|---|
| id | uuid PK | |
| remessa_item_id | uuid FK | |
| tipo | tipo_tratamento | |
| quantidade | numeric > 0 | |
| justificativa | text not null | |
| remessa_gerada_id | uuid FK | preenchido em reenvio |
| tratado_por / tratado_em | | |

**saidas** e **saida_itens**

| Tabela | Colunas |
|---|---|
| saidas | id, numero (SAI-), almox_id, motivo, data_ocorrencia, observacao, registrado_por, registrado_em |
| saida_itens | id, saida_id, material_id, quantidade > 0 |

**ajustes** e **ajuste_itens**

| Tabela | Colunas |
|---|---|
| ajustes | id, numero (AJU-), almox_id, tipo (tipo_ajuste), justificativa, data_ocorrencia, registrado_por, registrado_em |
| ajuste_itens | id, ajuste_id, material_id, saldo_sistema, qtd_contada, diferenca |

**movimentacoes** (livro-razão, somente inserção)

| Coluna | Tipo | Observação |
|---|---|---|
| id | bigint identity PK | |
| almox_id | uuid FK | |
| material_id | uuid FK | |
| quantidade | numeric ≠ 0 | positivo entra, negativo sai |
| tipo | tipo_movimentacao | |
| data_ocorrencia | date | data real |
| remessa_id / saida_id / ajuste_id / tratamento_id | uuid FK | uma referência por linha |
| criado_por / criado_em | | |

### 6.3 Views

| View | Conteúdo |
|---|---|
| `v_saldo` | almox, material, saldo (soma das movimentações) |
| `v_em_transito` | itens de remessas em trânsito, com dias desde o envio |
| `v_pedido_resumo` | por item: solicitada, aprovada, enviada, recebida, diferença de atendimento, diferença de conferência |
| `v_divergencias_abertas` | item, diferença, quantidade já tratada, quantidade em aberto |

### 6.4 Funções (RPC)

Toda mudança de estado passa por uma função `security definer`, com `search_path` fixo, checagem explícita de permissão e transação única. Operações que baixam saldo usam `pg_advisory_xact_lock` por (almox, material) para evitar duas saídas simultâneas passando pela checagem.

| Função | O que faz |
|---|---|
| `rpc_enviar_pedido` | rascunho → solicitado |
| `rpc_aprovar_pedido` | grava aprovadas e motivos de corte; → aprovado |
| `rpc_cancelar_pedido` | → cancelado, com motivo |
| `rpc_enviar_remessa_pedido` | cria remessa e itens, lança `envio_remessa` na origem, → em trânsito |
| `rpc_criar_remessa_avulsa` | transferência ou devolução: cria remessa e lança envio |
| `rpc_registrar_recebimento` | grava contagem, data real, quem contou, foto; lança `recebimento_remessa`; define status |
| `rpc_registrar_recebimento_externo` | recebimento do 3256 (com ou sem pedido), com documento SAP |
| `rpc_tratar_divergencia` | registra o tratamento e seus efeitos; encerra remessa e pedido quando tudo estiver resolvido |
| `rpc_registrar_saida` | cria saída e lança `saida` |
| `rpc_registrar_ajuste` | calcula diferenças contra o saldo e lança os ajustes |

Pedidos em rascunho e seus itens podem ser criados e editados direto pelo app (via RLS), porque ainda não afetam nada.

### 6.5 RLS (em linguagem natural)

Funções auxiliares: `fn_eh_admin()`, `fn_eh_gestao()`, `fn_eh_responsavel(almox_id)`, `fn_pode_ver(almox_id)`.

`fn_pode_ver` é verdadeira quando o usuário é admin ou gestão, tem qualquer atribuição no almox, ou é responsável do almox pai.

- **almoxarifados, materiais:** leitura para qualquer autenticado; escrita só admin.
- **perfis, atribuicoes:** cada um lê o próprio perfil; admin lê e escreve tudo.
- **pedidos e pedido_itens:** leitura se `fn_pode_ver` no solicitante ou no atendente; inserção e edição só em rascunho, pelo responsável do solicitante.
- **remessas, remessa_itens, divergencia_tratamentos, saidas, ajustes:** leitura se `fn_pode_ver` na origem ou no destino (ou no almox); escrita só via RPC.
- **movimentacoes:** leitura se `fn_pode_ver`; nenhuma escrita pelo cliente.
- **Storage:** bucket privado `recebimentos`, caminho `{remessa_id}/{uuid}.jpg`; upload por autenticado, leitura por quem pode ver a remessa.

---

## 7. Telas

### Responsável de base (mobile first)

- **Início:** minhas bases, remessas a caminho, pedidos abertos, divergências pendentes.
- **Saldo da base:** busca por código ou descrição.
- **Novo pedido:** escolher base, adicionar itens, enviar.
- **Receber remessa:** itens da guia, campo de contagem, motivo de divergência, quem contou, data, foto, adicionar item não listado.
- **Registrar saída.**
- **Transferir entre bases** e **Devolver ao 211.**
- **Ajuste de inventário.**

### Almoxarife do 211 (desktop first)

- **Fila de pedidos:** aprovar e cortar.
- **Separação e envio:** quantidades enviadas e impressão da guia.
- **Entradas do 3256:** pedido externo, recebimento externo e entrada avulsa.
- **Divergências:** lista e tratamento.
- **Saldo do 211.**

### Admin e gestão

- **Painel geral** (fase 5).
- **Cadastros:** almoxarifados, usuários, atribuições, materiais (com importação).
- **Importação de saldo inicial.**

### Guia de remessa

Página de impressão (CSS de impressão + `window.print`) com número da remessa, origem, destino, data, itens com código SAP, descrição, unidade e quantidade enviada, coluna em branco para a contagem e campos para nome e assinatura de quem conferiu.

---

## 8. Importações

### 8.1 Materiais (planilha do SAP)

1. Upload de XLSX ou CSV (SheetJS).
2. Mapeamento de colunas para `codigo_sap`, `descricao`, `unidade` e `grupo` (opcional).
3. Pré-visualização com validação:
   - código vazio → bloqueia a linha;
   - código repetido na planilha → bloqueia;
   - código que já existe no banco → bloqueia (não atualiza);
   - unidade fora da lista → bloqueia.
4. Inserção em lotes de 50.
5. Relatório final: inseridos, bloqueados e motivo.

### 8.2 Saldo inicial

Modelo de planilha com `codigo_sap` e `quantidade`, uma planilha por almoxarifado. Material inexistente bloqueia a importação. Gera um ajuste do tipo `implantacao` e movimentações `saldo_inicial`. Só admin.

---

## 9. Identidade visual

**Nome:** Warefly — Gestão de almoxarifado, desde 30/09/2026. Até então, SIA — Sistema Integrado de Almoxarifado.

**Fonte da verdade:** o design system em `design-system/`. Os tokens ficam em `design-system/tokens/*.css` e o app os importa direto; os fundamentos (conteúdo, visual, iconografia) estão em `design-system/README.md`. Esta seção só resume.

**Estilo:** moderno e limpo. Superfícies brancas sobre fundo névoa, bordas finas, muito respiro. Legível no galpão e no celular, sem enfeite nem animação.

**Marca:** símbolo de asa com três penas em arco ascendente (azul voo e asa), ao lado de "Warefly" em Barlow 600. "Gestão de almoxarifado" aparece como subtítulo no login, na guia impressa e no rodapé do menu lateral.

### Cores base

| Token | Nome | Hex | Uso |
|---|---|---|---|
| `--cor-marca` | Azul voo | `#1E66C9` | Marca, ação principal, foco, dado em destaque |
| `--cor-asa` | Asa | `#5B9CF0` | Segunda pena do símbolo, realces |
| `--cor-estrutura` | Marinho | `#0B2447` | Títulos, logotipo |
| `--cor-neutra` | Cinza | `#74808F` | Bordas, texto secundário |
| `--cor-fundo` | Névoa | `#F3F6FA` | Fundo |

### Cores de status

| Status | Cor | Fundo do badge | Texto do badge |
|---|---|---|---|
| Solicitado / aprovado | `#0E8AA8` | `#DFF3F7` | `#0A6780` |
| Em trânsito | `#D49A1C` | `#FBF0D9` | `#8A6310` |
| Encerrado | `#2F9E62` | `#E1F5E9` | `#1D7446` |
| Com divergência | `#B3263E` | `#F7E0E4` | `#8E1D31` |
| Rascunho / cancelado | `#76838A` | `#ECEFF0` | `#4B575D` |

Status nunca é comunicado só por cor: todo badge tem texto.

### Tipografia

- **Barlow** (Google Fonts), pesos 400, 500 e 600: interface, títulos e números dos indicadores (tabulares).
- **IBM Plex Mono** (Google Fonts), peso 400: códigos SAP, números de documento e quantidades em tabela, com `font-variant-numeric: tabular-nums` para alinhar colunas.

### Tom dos textos

Direto e operacional. Verbos no botão ("Enviar pedido", "Registrar recebimento"). Sem "por favor", sem exclamação. Mensagem de erro diz o que aconteceu e o que fazer ("Saldo insuficiente em Mantena. Faça um ajuste de inventário se o material existir").

---

## 10. Fases e passos

Cada passo termina com validação antes do próximo.

### Fase 0 — Preparação

| Passo | O quê | Quem |
|---|---|---|
| 0.1 | Criar projeto Supabase (região São Paulo) e repositório | Matheus |
| 0.2 | Limpar a planilha do SAP e fechar a lista de unidades | Matheus |
| 0.3 | Levantar nomes e e-mails: pessoa(s) do 211, supervisores, gestão | Matheus |
| 0.4 | Definir o dia D da contagem inicial | Matheus + liderança |

### Fase 1 — Banco

| Passo | O quê | Quem |
|---|---|---|
| 1.1 | Enums e tabelas de cadastro + seed dos 13 almoxarifados | SQL: Claude escreve, Matheus executa |
| 1.2 | Tabelas operacionais e sequências de numeração | idem |
| 1.3 | Views | idem |
| 1.4 | Funções auxiliares e RLS | idem |
| 1.5 | RPCs | idem |
| 1.6 | Bucket `recebimentos` e políticas | idem |
| 1.7 | Script de teste simulando cada papel (via `request.jwt.claims`) | idem |

**Aceite:** o script de teste passa em todos os cenários, inclusive os que devem ser bloqueados (supervisor tentando ver base de outro, saída acima do saldo, escrita direta em `movimentacoes`).

### Fase 2 — Base do app

| Passo | O quê | Quem |
|---|---|---|
| 2.1 | React + Vite + react-router + supabase-js, AuthContext, rotas por papel | Antigravity |
| 2.2 | Tokens da identidade, fontes, layout responsivo (menu lateral no desktop, barra inferior no celular) | Antigravity |
| 2.3 | Cadastros: almoxarifados, atribuições, materiais | Antigravity |
| 2.4 | Importação de materiais | Antigravity |
| 2.5 | Importação de saldo inicial | Antigravity |

Usuários são criados pelo admin no painel do Supabase; o app só vincula perfil e atribuições. Sem cadastro aberto.

### Fase 3 — Ciclo pedido → envio → recebimento

| Passo | O quê |
|---|---|
| 3.1 | Pedido da base (rascunho, itens, enviar) |
| 3.2 | Fila do 211: aprovar e cortar |
| 3.3 | Envio e guia de remessa imprimível |
| 3.4 | Recebimento com conferência e foto (compressão no cliente: lado maior 1600 px, JPEG ~0,7) |
| 3.5 | Divergências: lista e tratamento |
| 3.6 | Pedido externo, recebimento externo e entrada avulsa no 211 |

**Aceite:** um pedido de Mantena com corte no 211 e falta na conferência mostra as duas diferenças separadas, e o saldo das duas pontas bate com as movimentações.

### Fase 4 — Movimentação das bases

| Passo | O quê |
|---|---|
| 4.1 | Saídas |
| 4.2 | Transferência entre bases do mesmo supervisor |
| 4.3 | Devolução ao 211 |
| 4.4 | Ajuste de inventário |

### Fase 5 — Painéis

| Passo | O quê |
|---|---|
| 5.1 | Início da base: saldo, a caminho, pedidos, divergências |
| 5.2 | Painel do 211: fila, em trânsito, divergências (com Realtime) |
| 5.3 | Painel da gestão com os indicadores abaixo |

**Indicadores**

| Indicador | Cálculo |
|---|---|
| Taxa de atendimento | Σ enviado ÷ Σ solicitado, por base e período |
| Índice de divergência | remessas com divergência ÷ remessas recebidas |
| Perda em trânsito | Σ quantidade em `baixa_transito`, por período |
| Tempo de trânsito | data de recebimento − data de envio |
| Remessas paradas | em trânsito há mais de 3 dias (configurável) |
| Ajustes de inventário | quantidade e valor absoluto por base |
| Consumo | Σ saídas por base e material |

### Fase 6 — Implantação

1. Treinamento curto com os supervisores e o 211 (recebimento com guia e foto é o ponto crítico).
2. Dia D: contagem no 211 e nas 11 bases.
3. Importação do saldo inicial.
4. Início da operação.
5. Acompanhamento diário nas duas primeiras semanas pelo painel de divergências e ajustes.

### Fora do MVP

- Responsável local por base (só atribuição, já suportado pelo modelo).
- Mais de uma remessa por pedido.
- Estoque mínimo por base e sugestão de pedido a partir do consumo.
- Modo offline ou app nativo.
- Relatório de conferência manual com o SAP.
- Controle até a equipe.

---

## 11. Regras para o Claude

- **Um passo por vez.** Parar ao fim de cada passo para validação.
- **Não refatorar nada fora do escopo do passo.**
- **Toda escrita que muda estado passa pelas RPCs.** Nunca inserir em `movimentacoes` pelo cliente.
- **Usar apenas os tokens do design system** (`design-system/tokens`, resumidos na seção 9). Não inventar cores; `npm run lint` avisa cor ou px soltos no código.
- Textos da interface e mensagens de commit em **português (BR)**.
- Comandos de terminal em **PowerShell** (Windows).

---

## 12. Premissas a validar

- [ ] Nome da pessoa (ou pessoas) que opera o 211.
- [ ] Foto obrigatória em todo recebimento.
- [ ] Saldo negativo bloqueado.
- [ ] Um pedido gera uma única remessa no MVP; o que não foi enviado vira corte.
- [ ] Transferência direta só entre bases do mesmo supervisor; entre supervisores passa pelo 211.
- [ ] Ajuste de inventário feito pelo próprio responsável, com justificativa e destaque no painel da gestão.
- [ ] Usuários criados pelo admin no painel do Supabase.
- [ ] Códigos de três letras das bases.