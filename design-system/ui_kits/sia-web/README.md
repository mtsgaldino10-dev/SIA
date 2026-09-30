# SIA — UI kit desktop
Recriação clicável das telas desktop do app (`app/src/pages` em mtsgaldino10-dev/SIA). Abre em [`referencia/ui_kits/sia-web.html`](../../referencia/ui_kits/sia-web.html); a tela atual fica em localStorage.

- **Shell.jsx** — MenuLateral + área de conteúdo (28px 32px, máx. 1200px), como `components/Layout.tsx`.
- **Painel.jsx** — painel geral do 211: etiquetas com mini-gráfico, linha enviadas × recebidas, donut por status, fila, indicadores, ajustes (Inicio.tsx + Painel.tsx). Gráficos são adição pedida no brief; o app real só tem tabelas.
- **Pedidos.jsx** — lista com abas (Pedidos.tsx) e detalhe com "Separação e envio" (PedidoDetalhe.tsx → Envio).
- **Guia.jsx** — guia de remessa imprimível (remessas/Guia.tsx).
- **Operacao.jsx** — Saldo, Remessas, Divergências com tratamento.
- **Cadastros.jsx** — Importar materiais XLSX em 3 etapas; Login.

Clique: Início → etiqueta "Pedidos na fila" → PED-001042 → Registrar envio (valida saldo; a chave fusível passa do saldo — ajuste para 9) → Guia. Menu → Divergências → Tratar. Sair → Login.
