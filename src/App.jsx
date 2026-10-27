import { lazy, Suspense, useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import ConsultSheet from './components/ConsultSheet.jsx'
import ScrollToTop from './components/ScrollToTop.jsx'
import Home from './pages/Home.jsx'
import Company from './pages/Company.jsx'
import Distribution from './pages/Distribution.jsx'
import Product from './pages/Product.jsx'
import EnzymeTab from './pages/EnzymeTab.jsx'
import AiMarketing from './pages/AiMarketing.jsx'
import Partner from './pages/Partner.jsx'
import Contact from './pages/Contact.jsx'
import NotFound from './pages/NotFound.jsx'
import Login from './pages/Login.jsx'
import RequireAuth from './components/RequireAuth.jsx'
import HomeFirst from './components/HomeFirst.jsx'

// 무거운 화면(진단·영상 만들기)은 들어갈 때만 불러옵니다 → 첫 화면이 빨리 뜸
const Diagnosis = lazy(() => import('./pages/Diagnosis.jsx'))
const DiagnosisNew = lazy(() => import('./pages/DiagnosisNew.jsx'))
const DiagnosisResult = lazy(() => import('./pages/DiagnosisResult.jsx'))
const MyDiagnoses = lazy(() => import('./pages/MyDiagnoses.jsx'))
const VideoMaker = lazy(() => import('./pages/VideoMaker.jsx'))
const Expense = lazy(() => import('./pages/Expense.jsx'))
import { AuthProvider } from './lib/auth.jsx'
import { ConsultContext } from './components/consult.js'

export default function App() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  // 영업비 정산(/expense)은 내부 도구라 사이트 메뉴·푸터·상담 버튼 없이 앱 화면만 보여 줍니다
  if (pathname.startsWith('/expense')) {
    return (
      <AuthProvider>
        <Suspense fallback={<div className="page-loading" role="status">불러오는 중…</div>}>
          <Expense />
        </Suspense>
      </AuthProvider>
    )
  }
  return (
    <AuthProvider>
    <ConsultContext.Provider value={{ open: () => setOpen(true) }}>
      <HomeFirst />
      <ScrollToTop />
      <a href="#main" className="sr-only">본문으로 건너뛰기</a>
      <Header />
      <main id="main">
        <Suspense fallback={<div className="page-loading" role="status">불러오는 중…</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/company" element={<Company />} />
          <Route path="/distribution" element={<Distribution />} />
          <Route path="/products" element={<Product />} />
          <Route path="/products/oryun" element={<Navigate to="/products" replace />} />
          <Route path="/products/enzyme" element={<EnzymeTab />} />
          <Route path="/product" element={<Navigate to="/products" replace />} />
          <Route path="/ai-marketing" element={<AiMarketing />} />
          <Route path="/partner" element={<Partner />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/diagnosis" element={<Diagnosis />} />
          <Route path="/login" element={<Login />} />
          <Route path="/video-maker" element={<VideoMaker />} />
          <Route path="/diagnosis/new" element={<RequireAuth><DiagnosisNew /></RequireAuth>} />
          <Route path="/diagnosis/result/:id" element={<RequireAuth><DiagnosisResult /></RequireAuth>} />
          <Route path="/my" element={<RequireAuth><MyDiagnoses /></RequireAuth>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
      </main>
      <Footer />
      <ConsultSheet open={open} onOpen={() => setOpen(true)} onClose={() => setOpen(false)} />
    </ConsultContext.Provider>
    </AuthProvider>
  )
}
