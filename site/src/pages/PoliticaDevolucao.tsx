const sections = [
  {
    title: '1. Direito de arrependimento (7 dias)',
    body:
      'Conforme o Art. 49 do Código de Defesa do Consumidor, você pode desistir da compra em até 7 dias corridos a partir do recebimento do produto, sem precisar justificar o motivo. Basta entrar em contato com a gente informando o número do pedido — o reembolso é feito integralmente, incluindo o frete pago, após recebermos o set de volta em condições originais.',
  },
  {
    title: '2. Produto com defeito ou avaria no transporte',
    body:
      'Se o set chegar com peças faltando, trocadas ou danificadas, entre em contato em até 30 dias corridos após o recebimento. Resolvemos com reposição das peças específicas ou substituição integral do set, sem custo adicional para você.',
  },
  {
    title: '3. Condições para devolução',
    body:
      'O set deve ser devolvido na embalagem original, com todos os acessórios e o manual. Sets que já tiveram peças montadas ainda podem ser devolvidos dentro do prazo de arrependimento — pedimos apenas que todas as peças e o manual estejam inclusos na devolução.',
  },
  {
    title: '4. Como solicitar',
    body:
      'Entre em contato com a Studio 18 informando o número do pedido (disponível na confirmação de compra ou na página de Rastreio) e o motivo da devolução ou troca. Nossa equipe confirma os próximos passos, incluindo a coleta ou o endereço de envio do produto de volta.',
  },
  {
    title: '5. Prazo de reembolso',
    body:
      'Após recebermos e conferirmos o produto devolvido, o reembolso é processado em até 10 dias úteis, no mesmo método de pagamento usado na compra (estorno no cartão, PIX de volta, ou reembolso do boleto).',
  },
]

export function PoliticaDevolucao() {
  return (
    <div className="mx-auto max-w-3xl px-6 pb-24 pt-32">
      <h1 className="mb-2 text-3xl">Política de devolução</h1>
      <p className="mb-10 text-sm" style={{ color: 'var(--ink-secondary)' }}>
        Sua satisfação é prioridade. Veja abaixo como funcionam trocas, devoluções e reembolsos na Studio 18.
      </p>

      <div className="flex flex-col gap-8">
        {sections.map((s) => (
          <div key={s.title}>
            <h2 className="mb-2 text-base font-semibold" style={{ color: 'var(--ink)' }}>
              {s.title}
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-secondary)' }}>
              {s.body}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
