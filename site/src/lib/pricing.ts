// Desconto de 10% para pagamentos à vista no PIX — usado nos cards de
// produto, na página de produto, no carrinho/checkout e replicado no
// cálculo real de cobrança na Edge Function mp-create-payment.
export const PIX_DISCOUNT = 0.1

export function pixPrice(fullPrice: number): number {
  return Math.round(fullPrice * (1 - PIX_DISCOUNT) * 100) / 100
}

// Máximo de parcelas oferecido no cartão no checkout — a taxa de juros real
// (se houver, a partir de qual parcela) é decidida pelo Mercado Pago
// conforme o cartão do cliente, então mostramos só o valor de referência
// nas vitrines, sem prometer "sem juros".
export const MAX_INSTALLMENTS = 12

export function installmentPrice(fullPrice: number, installments = MAX_INSTALLMENTS): number {
  return Math.round((fullPrice / installments) * 100) / 100
}

// Acréscimo pra parcelas de 7x a 12x, repassando a diferença de taxa que a
// Rede cobra da loja nessas parcelas mais longas (taxa uniforme entre
// bandeiras — a diferença entre a taxa "à vista" e a de 7-12x é sempre
// ~1,26 ponto percentual, seja Master/Visa ou Elo/Amex). De 1x a 6x a
// diferença de taxa é pequena e fica por conta da loja (sem juros pro
// cliente). Mesma regra replicada na Edge Function rede-create-payment.
export const INSTALLMENT_SURCHARGE_FROM = 7
export const INSTALLMENT_SURCHARGE_RATE = 0.0126

export function installmentTotal(total: number, installments: number): number {
  const withSurcharge = installments >= INSTALLMENT_SURCHARGE_FROM
  return withSurcharge ? Math.round(total * (1 + INSTALLMENT_SURCHARGE_RATE) * 100) / 100 : total
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
