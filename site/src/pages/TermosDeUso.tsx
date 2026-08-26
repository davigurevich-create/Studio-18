const sections = [
  {
    title: '1. Sobre a Studio 18',
    body:
      'Este site é operado por Studio 18 Bricks Importação e Comércio LTDA, CNPJ 68.753.475/0001-92, com sede na Rua Francisco Pais, 362, Jardim Ipanema, CEP 04784-080, São Paulo/SP. Ao usar o site ou realizar uma compra, você concorda com estes Termos de Uso.',
  },
  {
    title: '2. Produtos e disponibilidade',
    body:
      'Os sets exibidos no site estão sujeitos à disponibilidade de estoque. Reservamo-nos o direito de recusar ou cancelar um pedido em caso de erro de preço, indisponibilidade do modelo ou suspeita de fraude, com reembolso integral de qualquer valor já pago.',
  },
  {
    title: '3. Preços e pagamento',
    body:
      'Os preços exibidos incluem os tributos aplicáveis e estão em reais (BRL). O frete é calculado à parte, conforme o CEP de entrega, e exibido antes da confirmação da compra. Pagamentos são processados via Mercado Pago (PIX, cartão ou boleto).',
  },
  {
    title: '4. Entrega',
    body:
      'O prazo de entrega informado no checkout é uma estimativa da transportadora e pode variar por fatores fora do nosso controle. Assim que o pedido é despachado, o código de rastreio fica disponível na área "Minha Conta".',
  },
  {
    title: '5. Trocas, devoluções e reembolso',
    body:
      'As condições de troca, devolução e reembolso estão detalhadas na nossa Política de Devolução, incluindo o direito de arrependimento de 7 dias previsto no Código de Defesa do Consumidor.',
  },
  {
    title: '6. Propriedade intelectual',
    body:
      'Todo o conteúdo do site — textos, fotos, vídeos e identidade visual — pertence à Studio 18 ou é usado sob licença, e não pode ser reproduzido sem autorização prévia.',
  },
  {
    title: '7. Alterações destes termos',
    body:
      'Podemos atualizar estes Termos de Uso periodicamente. A versão vigente é sempre a publicada nesta página.',
  },
  {
    title: '8. Contato',
    body:
      'Dúvidas sobre estes termos podem ser enviadas pelo chat do site ou pelos canais informados na página Quem Somos.',
  },
]

export function TermosDeUso() {
  return (
    <div className="mx-auto max-w-3xl px-6 pb-24 pt-32">
      <h1 className="mb-2 text-3xl">Termos de uso</h1>
      <p className="mb-10 text-sm" style={{ color: 'var(--ink-secondary)' }}>
        Última atualização: agosto de 2026. Leia com atenção antes de usar o site ou realizar uma compra.
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
