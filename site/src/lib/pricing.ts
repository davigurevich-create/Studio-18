// Desconto de 5% para pagamentos à vista no PIX — usado nos cards de
// produto, na página de produto, no carrinho/checkout e replicado no
// cálculo real de cobrança na Edge Function rede-create-payment.
export const PIX_DISCOUNT = 0.05

export function pixPrice(fullPrice: number): number {
  return Math.round(fullPrice * (1 - PIX_DISCOUNT) * 100) / 100
}

// De 1x a 6x não tem juros (fica por conta da loja). De 7x a 12x aplica
// juros compostos de 1,99% ao mês (padrão de varejo online) pela tabela
// Price — quanto mais parcelas, maior o total pago, exatamente como um
// financiamento normal. Mesma regra replicada na Edge Function
// rede-create-payment (fonte da verdade do valor cobrado de fato).
export const INSTALLMENT_SURCHARGE_FROM = 7
export const INSTALLMENT_MONTHLY_INTEREST_RATE = 0.0199

// Parcela de referência mostrada nas vitrines (cards e página de produto) —
// a última sem juros, pra anunciar "6x sem juros" em vez do valor com juros
// embutido de uma parcela maior.
export const INTEREST_FREE_INSTALLMENTS = INSTALLMENT_SURCHARGE_FROM - 1

// Valor de cada parcela — pela tabela Price quando tem juros (7x-12x).
export function installmentValue(total: number, installments: number): number {
  if (installments < INSTALLMENT_SURCHARGE_FROM) {
    return Math.round((total / installments) * 100) / 100
  }
  const i = INSTALLMENT_MONTHLY_INTEREST_RATE
  const factor = (i * (1 + i) ** installments) / ((1 + i) ** installments - 1)
  return Math.round(total * factor * 100) / 100
}

export function installmentTotal(total: number, installments: number): number {
  // sem juros (1x-6x): o total é sempre o mesmo, exato — não pode variar
  // por causa do arredondamento do valor de cada parcela individual
  if (installments < INSTALLMENT_SURCHARGE_FROM) return total
  return Math.round(installmentValue(total, installments) * installments * 100) / 100
}

// Nível de estoque considerado baixo o suficiente para mostrar um aviso de
// urgência na vitrine ("restam poucas unidades").
export const LOW_STOCK_THRESHOLD = 5

// Preço unitário efetivo de um produto, somando o opcional de motor
// detalhado quando escolhido — usado em qualquer lugar que precise exibir
// ou calcular o valor de um item (card, página de produto, carrinho).
export function unitPriceWithMotor(
  product: { sale_price_brl: number; motor_price_brl?: number | null },
  withMotor: boolean,
): number {
  return product.sale_price_brl + (withMotor && product.motor_price_brl ? product.motor_price_brl : 0)
}
