import { Link } from 'react-router-dom'

export function NotFound() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-6 pb-24 pt-40 text-center">
      <p className="eyebrow mb-4">Erro 404</p>
      <h1 className="mb-4 text-4xl sm:text-5xl">Essa página não existe</h1>
      <p className="mb-10 max-w-md text-sm" style={{ color: 'var(--ink-secondary)' }}>
        O endereço que você tentou acessar não foi encontrado. Confira o link ou volte para a coleção.
      </p>
      <Link
        to="/"
        className="inline-block rounded-full px-8 py-3 text-sm font-medium tracking-wide transition"
        style={{ background: 'var(--gold)', color: '#0a0a0a' }}
      >
        Voltar para a coleção
      </Link>
    </div>
  )
}
