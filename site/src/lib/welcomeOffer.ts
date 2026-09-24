// Regras de quando o pop-up de boas-vindas (cupom de 10% na primeira
// compra) pode aparecer de novo — tudo guardado no navegador da pessoa
// (localStorage), sem precisar de login:
//   1. Já comprou nesse navegador -> nunca mais aparece.
//   2. Já deixou o e-mail no próprio pop-up -> nunca mais aparece.
//   3. Fechou no X / "Agora não" -> some por 48h, depois volta a valer
//      (se nenhuma das outras regras já tiver marcado o navegador).
export const WELCOME_COUPON_CODE = 'ENTREINOFLOW10'

const STATE_KEY = 'studio18_welcome_popup'
const PURCHASED_KEY = 'studio18_has_purchased'
const PENDING_COUPON_KEY = 'studio18_pending_coupon'
const DISMISS_COOLDOWN_MS = 48 * 60 * 60 * 1000

interface WelcomePopupState {
  status: 'converted' | 'dismissed'
  dismissedAt?: number
}

function readState(): WelcomePopupState | null {
  try {
    const raw = localStorage.getItem(STATE_KEY)
    return raw ? (JSON.parse(raw) as WelcomePopupState) : null
  } catch {
    return null
  }
}

function hasPurchasedBefore(): boolean {
  try {
    return localStorage.getItem(PURCHASED_KEY) === '1'
  } catch {
    return false
  }
}

export function shouldShowWelcomePopup(): boolean {
  if (hasPurchasedBefore()) return false
  const state = readState()
  if (!state) return true
  if (state.status === 'converted') return false
  if (state.status === 'dismissed') {
    return Date.now() - (state.dismissedAt ?? 0) >= DISMISS_COOLDOWN_MS
  }
  return true
}

export function markWelcomeDismissed(): void {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify({ status: 'dismissed', dismissedAt: Date.now() }))
  } catch {
    // localStorage indisponível (modo privado etc.) — sem persistência, o
    // pop-up pode voltar a aparecer, mas a navegação segue normal.
  }
}

export function markWelcomeConverted(): void {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify({ status: 'converted' }))
    localStorage.setItem(PENDING_COUPON_KEY, WELCOME_COUPON_CODE)
  } catch {
    // ver comentário acima
  }
}

// Marca que esse navegador já concluiu uma compra — chamado no fim do
// checkout, pra o pop-up nunca mais aparecer pra essa pessoa.
export function markHasPurchased(): void {
  try {
    localStorage.setItem(PURCHASED_KEY, '1')
  } catch {
    // ver comentário acima
  }
}

// Lido uma única vez pelo Checkout, pra aplicar sozinho o cupom de quem
// acabou de deixar o e-mail no pop-up (sem precisar digitar o código de
// novo). Remove a marca depois de ler, pra não reaplicar em pedidos futuros.
export function consumePendingCoupon(): string | null {
  try {
    const code = localStorage.getItem(PENDING_COUPON_KEY)
    if (code) localStorage.removeItem(PENDING_COUPON_KEY)
    return code
  } catch {
    return null
  }
}
