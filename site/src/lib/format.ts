export function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

/**
 * Preço "fechado" (sem centavos, sempre arredondado pra baixo) — decisão
 * deliberada de pricing psychology pra preço de produto (cards, página de
 * detalhes, itens do carrinho/checkout). Nunca usar isso pra parcelas
 * individuais nem pra valores já cobrados de verdade (histórico de
 * pedidos) — nesses dois casos mantém formatBRL normal, com centavos.
 */
export function formatBRLRounded(value: number): string {
  // toLocaleString sempre mostra 2 casas decimais por padrão (",00") mesmo
  // pra valor inteiro — precisa forçar 0 casas, senão o floor não teria
  // efeito nenhum na hora de exibir.
  return Math.floor(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

/**
 * Mesma coisa que formatBRLRounded, mas separada em símbolo e número — pra
 * renderizar o "R$" num tamanho menor que o valor (outro truque de pricing
 * psychology), já que formatBRL devolve os dois colados numa string só.
 */
export function formatBRLRoundedParts(value: number): { symbol: string; amount: string } {
  const amount = formatBRLRounded(value).replace(/^R\$\s*/, '')
  return { symbol: 'R$', amount }
}
