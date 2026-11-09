// Studio 18 — campanha de Black Friday (ativa até 00:00 de 28/11, horário
// de Brasília). Centraliza a data de corte e o código do cupom aqui pra
// todo componente (hero, faixa fixa, contador, cards, popup) checar a
// mesma fonte — depois do prazo, tudo volta ao normal sozinho, sem
// precisar mexer em nada manualmente.
export const BLACK_FRIDAY_END = new Date('2026-11-28T00:00:00-03:00')
export const BLACK_FRIDAY_COUPON_CODE = 'BLACKFRIDAY25'
export const BLACK_FRIDAY_COUPON_PCT = 25
// Desconto combinado (cupom + Pix) nesta campanha é aditivo, por exceção —
// 25% do cupom + 5% do Pix = 30% no Pix, em vez do empilhamento
// multiplicativo padrão do resto do site (que daria ~28,75%).
export const BLACK_FRIDAY_PIX_TOTAL_PCT = 30

export function isBlackFridayActive(): boolean {
  return Date.now() < BLACK_FRIDAY_END.getTime()
}
