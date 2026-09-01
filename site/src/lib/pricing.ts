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
