import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Analys } from './pages/Analys'
import { Datapipeline } from './pages/Datapipeline'
import { Erbjudanden } from './pages/Erbjudanden'
import { FeedbackPage } from './pages/Feedback'
import { Installningar } from './pages/Installningar'
import { Kandidater } from './pages/Kandidater'
import { Ledningsfragor } from './pages/Ledningsfragor'
import { Login } from './pages/Login'
import { Oversikt } from './pages/Oversikt'
import { Planering } from './pages/Planering'
import { Roller } from './pages/Roller'
import { Sourcing } from './pages/Sourcing'
import { StoreProvider, useStore } from './store'
import './styles.css'

function Root() {
  const { currentUser } = useStore()
  if (!currentUser) return <Login />
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Oversikt />} />
        <Route path="/planering" element={<Planering />} />
        <Route path="/ledningsfragor" element={<Ledningsfragor />} />
        <Route path="/sourcing" element={<Sourcing />} />
        <Route path="/roller" element={<Roller />} />
        <Route path="/roller/:roleId" element={<Roller />} />
        <Route path="/kandidater" element={<Kandidater />} />
        <Route path="/kandidater/:candidateId" element={<Kandidater />} />
        <Route path="/feedback" element={<FeedbackPage />} />
        <Route path="/erbjudanden" element={<Erbjudanden />} />
        <Route path="/analys" element={<Analys />} />
        <Route path="/datapipeline" element={<Datapipeline />} />
        <Route path="/installningar" element={<Installningar />} />
        <Route path="*" element={<Oversikt />} />
      </Route>
    </Routes>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <StoreProvider>
        <Root />
      </StoreProvider>
    </BrowserRouter>
  </StrictMode>,
)
