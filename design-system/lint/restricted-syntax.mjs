// Equivalente ao `no-restricted-syntax` do ESLint, que o oxlint não implementa.
// Recebe as mesmas opções ({ selector, message } ou só o seletor) e reporta
// cada nó que casar com o seletor.
const restrictedSyntax = {
  meta: {
    type: 'suggestion',
    schema: {
      type: 'array',
      items: {
        oneOf: [
          { type: 'string' },
          {
            type: 'object',
            properties: { selector: { type: 'string' }, message: { type: 'string' } },
            required: ['selector'],
            additionalProperties: false,
          },
        ],
      },
    },
  },
  create(context) {
    const visitantes = {}
    for (const opcao of context.options) {
      const { selector, message } = typeof opcao === 'string' ? { selector: opcao } : opcao
      // Dois itens com o mesmo seletor reportam os dois.
      const anterior = visitantes[selector]
      visitantes[selector] = (node) => {
        anterior?.(node)
        context.report({ node, message: message ?? `'${node.type}' não é permitido aqui.` })
      }
    }
    return visitantes
  },
}

export default {
  meta: { name: 'design-system' },
  rules: { 'restricted-syntax': restrictedSyntax },
}
