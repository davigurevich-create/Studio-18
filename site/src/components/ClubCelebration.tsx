import { useEffect, useRef, useState } from 'react'
import confetti from 'canvas-confetti'
import { AnimatePresence, motion } from 'framer-motion'
import { Trophy } from 'lucide-react'
import { checkNewClubMilestone } from '@/lib/api'
import { useAuth } from '@/lib/auth'

const GOLD_COLORS = ['#e6c778', '#cda44d', '#f3e3b2', '#a9793a']

function fireGoldenConfetti() {
  // Duas rajadas de cantos opostos (em vez de 1 central) cobrem a tela
  // inteira sem depender do tamanho da viewport — mesmo truque clássico da
  // lib pra "explosão" de confete em telas largas.
  const duration = 1600
  const end = Date.now() + duration
  ;(function frame() {
    confetti({ particleCount: 4, angle: 60, spread: 70, origin: { x: 0, y: 0.6 }, colors: GOLD_COLORS, zIndex: 9999 })
    confetti({ particleCount: 4, angle: 120, spread: 70, origin: { x: 1, y: 0.6 }, colors: GOLD_COLORS, zIndex: 9999 })
    if (Date.now() < end) requestAnimationFrame(frame)
  })()
  confetti({ particleCount: 140, spread: 100, origin: { y: 0.4 }, colors: GOLD_COLORS, startVelocity: 45, zIndex: 9999 })
}

// Confere 1x por sessão (em qualquer página logada, montado no Layout) se
// o cliente acabou de cruzar a pontuação de algum clube — se for a
// primeira vez (o banco quem decide isso, nunca o front), comemora com
// confete dourado + um cartão de parabéns, e o e-mail de boas-vindas já
// foi disparado junto pela mesma chamada (ver check_new_club_milestone).
export function ClubCelebration() {
  const { session } = useAuth()
  const [celebration, setCelebration] = useState<{ clubName: string; discountPct: number } | null>(null)
  const checkedRef = useRef(false)

  useEffect(() => {
    if (!session || checkedRef.current) return
    checkedRef.current = true
    checkNewClubMilestone()
      .then((result) => {
        if (result.isNewClub && result.clubName && result.discountPct != null) {
          setCelebration({ clubName: result.clubName, discountPct: result.discountPct })
          fireGoldenConfetti()
        }
      })
      .catch(() => {})
  }, [session])

  return (
    <AnimatePresence>
      {celebration && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/70 px-6"
          onClick={() => setCelebration(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl border p-8 text-center"
            style={{
              borderColor: 'var(--gold-dim)',
              background: 'var(--carbon-1)',
              boxShadow: '0 0 60px rgba(230,199,120,0.15)',
            }}
          >
            <div
              className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full"
              style={{ background: 'linear-gradient(135deg, var(--gold-bright), var(--gold))' }}
            >
              <Trophy size={28} strokeWidth={2} style={{ color: '#1a1206' }} />
            </div>
            <p className="eyebrow mb-2" style={{ color: 'var(--gold-bright)' }}>
              Novo clube desbloqueado
            </p>
            <h2 className="mb-3 text-2xl font-medium" style={{ color: 'var(--ink)' }}>
              Bem-vindo ao {celebration.clubName}!
            </h2>
            <p className="mb-6 text-sm" style={{ color: 'var(--ink-muted)' }}>
              Obrigado pela confiança em cada peça da sua coleção. Seu benefício de{' '}
              <strong style={{ color: 'var(--gold-bright)' }}>{celebration.discountPct}% OFF</strong> já foi ativado
              automaticamente — ele entra sozinho no carrinho no seu próximo checkout, e acumula com qualquer outro
              cupom que você usar.
            </p>
            <button
              type="button"
              onClick={() => setCelebration(null)}
              className="w-full rounded-full px-6 py-2.5 text-sm font-medium"
              style={{ background: 'var(--gold)', color: '#0a0a0a' }}
            >
              Show de bola!
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
