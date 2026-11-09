import { BLACK_FRIDAY_COUPON_CODE, BLACK_FRIDAY_PIX_TOTAL_PCT, isBlackFridayActive } from '@/lib/blackFriday'

// Altura fixa da faixa — o Layout usa esse mesmo número pra empurrar o
// header (e o resto do site) pra baixo só quando a campanha está ativa.
export const BLACK_FRIDAY_BANNER_HEIGHT = 36

function BannerText() {
  return (
    <>
      BLACK FRIDAY — 25% OFF em até 6x, ou {BLACK_FRIDAY_PIX_TOTAL_PCT}% OFF no Pix · cupom
      <span className="ml-1 font-mono">{BLACK_FRIDAY_COUPON_CODE}</span>
    </>
  )
}

export function BlackFridayBanner() {
  if (!isBlackFridayActive()) return null
  return (
    <div
      className="fixed inset-x-0 top-0 z-[60] overflow-hidden"
      style={{
        height: BLACK_FRIDAY_BANNER_HEIGHT,
        background: 'linear-gradient(90deg, var(--gold), var(--gold-bright), var(--gold))',
        color: '#1a1206',
      }}
    >
      {/* Desktop/tablet: o texto cabe inteiro, sem rolar */}
      <p className="hidden h-full items-center justify-center px-4 text-center text-xs font-semibold tracking-wide sm:flex">
        <BannerText />
      </p>

      {/* Mobile: o texto não cabe — em vez de cortar, roda em loop
          contínuo (duas cópias lado a lado, desliza -50% e recomeça, sem
          "costura" visível). */}
      <div className="marquee-track flex h-full items-center sm:hidden">
        <span className="flex shrink-0 items-center whitespace-nowrap px-4 text-[11px] font-semibold tracking-wide">
          <BannerText />
        </span>
        <span className="flex shrink-0 items-center whitespace-nowrap px-4 text-[11px] font-semibold tracking-wide" aria-hidden="true">
          <BannerText />
        </span>
      </div>
    </div>
  )
}
