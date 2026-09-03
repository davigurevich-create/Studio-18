import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// gerenciamos a rolagem na mão (Layout.tsx + Home.tsx) — a restauração
// automática do navegador corre por fora do React e, na volta pra Home
// antes do catálogo recarregar, tenta restaurar um scrollY que a página
// ainda curta não comporta, ficando "presa" perto do fim (rodapé/seção
// de pós-venda) até nós mesmos corrigirmos
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual'
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
