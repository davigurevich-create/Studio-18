import { BLACK_FRIDAY_COUPON_CODE, BLACK_FRIDAY_PIX_TOTAL_PCT, isBlackFridayActive } from '@/lib/blackFriday'

// Altura fixa da faixa — o Layout usa esse mesmo número pra empurrar o
// header (e o resto do site) pra baixo só quando a campanha está ativa.
export const BLACK_FRIDAY_BANNER_HEIGHT = 36

export function BlackFridayBanner() {
  if (!isBlackFridayActive()) return null
  return (
    <div
      className="fixed inset-x-0 top-0 z-[60] flex items-center justify-center overflow-hidden px-4 text-center"
      style={{
        height: BLACK_FRIDAY_BANNER_HEIGHT,
        background: 'linear-gradient(90deg, var(--gold), var(--gold-bright), var(--gold))',
        color: '#1a1206',
      }}
    >
      <p className="truncate text-[11px] font-semibold tracking-wide sm:text-xs">
        BLACK FRIDAY — 25% OFF em até 6x, ou {BLACK_FRIDAY_PIX_TOTAL_PCT}% OFF no Pix · cupom{' '}
        <span className="font-mono">{BLACK_FRIDAY_COUPON_CODE}</span>
      </p>
    </div>
  )
}
