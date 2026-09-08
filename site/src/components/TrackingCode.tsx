import { useState } from 'react'
import { Copy } from 'lucide-react'

/**
 * Código de rastreio + botão de copiar, com link pro rastreamento oficial
 * dos Correios quando a transportadora for Correios (link só o domínio
 * oficial — o cliente cola o código lá, sem depender de um formato de URL
 * de terceiro que pode mudar).
 */
export function TrackingCode({ code, service }: { code: string; service: string | null }) {
  const [copied, setCopied] = useState(false)
  const isCorreios = (service ?? '').toLowerCase().includes('correios')

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // silencioso — o código já está visível pra copiar manualmente
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 rounded-lg border px-3 py-2" style={{ borderColor: 'var(--hairline)', background: 'var(--carbon-1)' }}>
        <span className="text-xs" style={{ color: 'var(--ink-muted)' }}>
          {service ?? 'Transportadora'}
        </span>
        <code className="flex-1 truncate text-sm" style={{ color: 'var(--ink)' }}>
          {code}
        </code>
        <button
          type="button"
          onClick={copy}
          className="shrink-0 flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors"
          style={{
            background: copied ? '#3f7f4f' : 'var(--gold)',
            color: copied ? '#f3f1ec' : '#0a0a0a',
          }}
        >
          <Copy size={11} strokeWidth={2} />
          {copied ? 'Copiado!' : 'Copiar'}
        </button>
      </div>
      {isCorreios && (
        <a
          href="https://rastreamento.correios.com.br"
          target="_blank"
          rel="noreferrer"
          className="text-xs underline"
          style={{ color: 'var(--gold-bright)' }}
        >
          Rastrear no site dos Correios →
        </a>
      )}
    </div>
  )
}
