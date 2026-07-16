// Desconto de 10% para pagamentos à vista no PIX — usado nos cards de
// produto, na página de produto, no carrinho/checkout e replicado no
// cálculo real de cobrança na Edge Function mp-create-payment.
export const PIX_DISCOUNT = 0.1

export function pixPrice(fullPrice: number): number {
  return Math.round(fullPrice * (1 - PIX_DISCOUNT) * 100) / 100
}
