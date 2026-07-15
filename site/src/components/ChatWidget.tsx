import { useRef, useState, type FormEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { sendChatMessage, type ChatMessage } from '@/lib/api'

export function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Olá! Sou o assistente da Studio 18. Posso ajudar com dúvidas sobre os sets, entrega, pagamento ou o status do seu pedido.' },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || loading) return

    const next: ChatMessage[] = [...messages, { role: 'user', content: text }]
    setMessages(next)
    setInput('')
    setLoading(true)

    try {
      const reply = await sendChatMessage(next)
      setMessages([...next, { role: 'assistant', content: reply }])
    } catch {
      setMessages([...next, { role: 'assistant', content: 'Desculpe, não consegui responder agora. Tente novamente em instantes.' }])
    } finally {
      setLoading(false)
      requestAnimationFrame(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
      })
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="mb-4 flex h-[480px] w-[340px] flex-col overflow-hidden rounded-2xl border shadow-2xl sm:w-[380px]"
            style={{ borderColor: 'var(--hairline)', background: 'var(--carbon-1)' }}
          >
            <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: 'var(--hairline)' }}>
              <div className="text-sm font-medium" style={{ color: 'var(--ink)' }}>
                Studio <span style={{ color: 'var(--gold)' }}>18</span> · Assistente
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Fechar chat" style={{ color: 'var(--ink-muted)' }}>
                ✕
              </button>
            </div>

            <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4">
              <div className="flex flex-col gap-3">
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className="max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed"
                    style={
                      m.role === 'user'
                        ? { alignSelf: 'flex-end', background: 'var(--gold)', color: '#0a0a0a' }
                        : { alignSelf: 'flex-start', background: 'var(--carbon-2)', color: 'var(--ink)' }
                    }
                  >
                    {m.content}
                  </div>
                ))}
                {loading && (
                  <div
                    className="max-w-[60%] rounded-xl px-3 py-2 text-sm"
                    style={{ alignSelf: 'flex-start', background: 'var(--carbon-2)', color: 'var(--ink-muted)' }}
                  >
                    Digitando...
                  </div>
                )}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t p-3" style={{ borderColor: 'var(--hairline)' }}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Digite sua pergunta..."
                className="flex-1 rounded-lg border bg-transparent px-3 py-2 text-sm outline-none"
                style={{ borderColor: 'var(--hairline)', color: 'var(--ink)' }}
              />
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
                style={{ background: 'var(--gold)', color: '#0a0a0a' }}
              >
                Enviar
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Fechar chat' : 'Abrir chat'}
        className="flex h-14 w-14 items-center justify-center rounded-full shadow-xl"
        style={{ background: 'var(--gold)', color: '#0a0a0a' }}
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <line x1="5" y1="5" x2="19" y2="19" />
            <line x1="19" y1="5" x2="5" y2="19" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
        )}
      </button>
    </div>
  )
}
