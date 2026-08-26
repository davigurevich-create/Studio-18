const sections = [
  {
    title: '1. Quem trata seus dados',
    body:
      'Os dados coletados neste site são tratados pela Studio 18 Bricks Importação e Comércio LTDA, CNPJ 68.753.475/0001-92, na qualidade de controladora, nos termos da Lei Geral de Proteção de Dados (Lei nº 13.709/2018).',
  },
  {
    title: '2. Quais dados coletamos',
    body:
      'Para processar seu pedido, coletamos nome, e-mail, telefone, CPF e endereço de entrega. Ao criar uma conta, também associamos seu histórico de pedidos, favoritos e código de indicação ao seu e-mail. Se você usa o chat do site, as mensagens trocadas são registradas para melhorar o atendimento.',
  },
  {
    title: '3. Para que usamos esses dados',
    body:
      'Usamos os dados para processar pagamentos, calcular e gerar etiquetas de frete, emitir nota fiscal, enviar e-mails sobre o pedido (confirmação, rastreio), e para você acompanhar suas compras na área "Minha Conta". Não vendemos seus dados a terceiros.',
  },
  {
    title: '4. Com quem compartilhamos',
    body:
      'Compartilhamos os dados estritamente necessários com parceiros que viabilizam a compra: Mercado Pago (processamento de pagamento), Melhor Envio e transportadoras (entrega) e Focus NFe (emissão de nota fiscal). Cada um desses parceiros trata os dados apenas para a finalidade da sua própria função no pedido.',
  },
  {
    title: '5. Por quanto tempo guardamos',
    body:
      'Guardamos os dados do pedido pelo prazo exigido pela legislação fiscal e de defesa do consumidor (em geral, 5 anos). Você pode solicitar a exclusão de dados que não sejam obrigatórios por lei a qualquer momento.',
  },
  {
    title: '6. Seus direitos',
    body:
      'Você pode solicitar acesso, correção, portabilidade ou exclusão dos seus dados pessoais, além de revogar consentimentos, entrando em contato pelo chat do site ou pelos canais informados na página Quem Somos.',
  },
  {
    title: '7. Cookies',
    body:
      'Usamos apenas cookies essenciais ao funcionamento do site (como manter seu carrinho e sua sessão de login). Não utilizamos cookies de rastreamento publicitário de terceiros.',
  },
  {
    title: '8. Alterações desta política',
    body:
      'Podemos atualizar esta Política de Privacidade periodicamente. A versão vigente é sempre a publicada nesta página.',
  },
]

export function PoliticaDePrivacidade() {
  return (
    <div className="mx-auto max-w-3xl px-6 pb-24 pt-32">
      <h1 className="mb-2 text-3xl">Política de privacidade</h1>
      <p className="mb-10 text-sm" style={{ color: 'var(--ink-secondary)' }}>
        Última atualização: agosto de 2026. Veja como coletamos, usamos e protegemos seus dados pessoais.
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
