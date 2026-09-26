import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import { CartProvider } from '@/lib/cart'
import { AuthProvider } from '@/lib/auth'
import { FavoritesProvider } from '@/lib/favorites'
import { Layout } from '@/components/Layout'
import { Home } from '@/pages/Home'
import { Recomendador } from '@/pages/Recomendador'
import { Product } from '@/pages/Product'
import { Checkout } from '@/pages/Checkout'
import { Rastreio } from '@/pages/Rastreio'
import { Faq } from '@/pages/Faq'
import { PoliticaDevolucao } from '@/pages/PoliticaDevolucao'
import { TermosDeUso } from '@/pages/TermosDeUso'
import { PoliticaDePrivacidade } from '@/pages/PoliticaDePrivacidade'
import { Blog } from '@/pages/Blog'
import { BlogPost } from '@/pages/BlogPost'
import { QuemSomos } from '@/pages/QuemSomos'
import { Diferenciais } from '@/pages/Diferenciais'
import { Badges } from '@/pages/Badges'
import { Conta } from '@/pages/Conta'
import { NotFound } from '@/pages/NotFound'

function App() {
  return (
    // reducedMotion="user": toda animação do framer-motion (drawers, lightbox,
    // hero, reveal de texto, menus) passa a respeitar o "reduzir movimento" do
    // sistema automaticamente — troca slide/spring por opacity, sem precisar
    // tratar caso a caso em cada componente.
    <MotionConfig reducedMotion="user">
      <AuthProvider>
        <FavoritesProvider>
          <CartProvider>
            <BrowserRouter>
              <Routes>
                <Route element={<Layout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/recomendador" element={<Recomendador />} />
                  <Route path="/produto/:id" element={<Product />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/rastreio" element={<Rastreio />} />
                  <Route path="/faq" element={<Faq />} />
                  <Route path="/politica-de-devolucao" element={<PoliticaDevolucao />} />
                  <Route path="/termos-de-uso" element={<TermosDeUso />} />
                  <Route path="/politica-de-privacidade" element={<PoliticaDePrivacidade />} />
                  <Route path="/blog" element={<Blog />} />
                  <Route path="/blog/:slug" element={<BlogPost />} />
                  <Route path="/quem-somos" element={<QuemSomos />} />
                  <Route path="/diferenciais" element={<Diferenciais />} />
                  <Route path="/badges" element={<Badges />} />
                  <Route path="/conta" element={<Conta />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </CartProvider>
        </FavoritesProvider>
      </AuthProvider>
    </MotionConfig>
  )
}

export default App
