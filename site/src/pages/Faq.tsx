import { useState } from 'react'
import { Link } from 'react-router-dom'

const faqs = [
  {
    q: 'Quanto tempo leva para o pedido chegar?',
    a: 'Os sets ficam em pronta entrega no Brasil (não é uma importação individual) — o prazo de envio segue a modalidade escolhida no frete, geralmente entre 5 e 15 dias úteis dependendo da região.',
  },
  {
    q: 'Como acompanho meu pedido?',
    a: 'Assim que finalizar a compra, você recebe o número do pedido. Use a página "Rastreio" no menu para consultar o status a qualquer momento com esse número + o e-mail usado na compra.',
  },
  {
    q: 'Quais formas de pagamento vocês aceitam?',
    a: 'PIX, cartão de crédito (em até 12x) e boleto bancário, todos processados com segurança pelo Mercado Pago.',
  },
  {
    q: 'Os sets são originais?',
    a: 'Trabalhamos com fabricantes de blocos de montar técnicos premium em escala 1:8, com curadoria própria da Studio 18. Cada set vem com caixa oficial e manual completo do fabricante.',
  },
  {
    q: 'Posso trocar ou devolver meu pedido?',
    a: 'Sim. Você tem até 7 dias corridos após o recebimento para desistir da compra, sem precisar justificar (direito de arrependimento previsto no Código de Defesa do Consumidor). Veja todos os detalhes na nossa Política de Devolução.',
  },
  {
    q: 'O que faço se o set chegar com peças faltando ou danificadas?',
    a: 'Entre em contato com a gente informando o número do pedido — resolvemos com reposição de peças ou troca do set, sem custo adicional.',
  },
]

export function Faq() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <div className="mx-auto max-w-3xl px-6 pb-24 pt-32">
      <h1 className="mb-2 text-3xl">Perguntas frequentes</h1>
      <p className="mb-10 text-sm" style={{ color: 'var(--ink-secondary)' }}>
        Tudo que você precisa saber antes e depois da compra.
      </p>

      <div className="flex flex-col gap-3">
        {faqs.map((item, i) => (
          <div
            key={item.q}
            className="rounded-xl border px-5 py-4"
            style={{ borderColor: 'var(--hairline)', background: 'var(--carbon-2)' }}
          >
            <button
              type="button"
              onClick={() => setOpen(open === i ? null : i)}
              className="flex w-full items-center justify-between gap-4 text-left"
            >
              <span className="text-sm font-medium" style={{ color: 'var(--ink)' }}>
                {item.q}
              </span>
              <span
                className="shrink-0 text-lg"
                style={{ color: 'var(--gold)', transform: open === i ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }}
              >
                +
              </span>
            </button>
            {open === i && (
              <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--ink-secondary)' }}>
                {item.a}
              </p>
            )}
          </div>
        ))}
      </div>

      <p className="mt-10 text-sm" style={{ color: 'var(--ink-muted)' }}>
        Não achou o que precisava?{' '}
        <Link to="/politica-de-devolucao" className="underline" style={{ color: 'var(--gold)' }}>
          Veja a política de devolução
        </Link>{' '}
        ou fale com a gente.
      </p>
    </div>
  )
}
