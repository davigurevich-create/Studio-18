import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { CartProvider } from '@/lib/cart'
import { Layout } from '@/components/Layout'
import { Home } from '@/pages/Home'
import { Product } from '@/pages/Product'
import { Checkout } from '@/pages/Checkout'
import { Rastreio } from '@/pages/Rastreio'
import { Faq } from '@/pages/Faq'
import { PoliticaDevolucao } from '@/pages/PoliticaDevolucao'

function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/produto/:id" element={<Product />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/rastreio" element={<Rastreio />} />
            <Route path="/faq" element={<Faq />} />
            <Route path="/politica-de-devolucao" element={<PoliticaDevolucao />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </CartProvider>
  )
}

export default App
