import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Analys } from './pages/Analys'
import { CareerBuilder } from './pages/CareerBuilder'
import { Compliance } from './pages/Compliance'
import { Datapipeline } from './pages/Datapipeline'
import { Erbjudanden } from './pages/Erbjudanden'
import { FeedbackPage } from './pages/Feedback'
import { Headhunt } from './pages/Headhunt'
import { Inbox } from './pages/Inbox'
import { Installningar } from './pages/Installningar'
import { Kandidater } from './pages/Kandidater'
import { Ledningsfragor } from './pages/Ledningsfragor'
import { Login } from './pages/Login'
import { Oversikt } from './pages/Oversikt'
import { Planering } from './pages/Planering'
import { Requisitions } from './pages/Requisitions'
import { PublicCareer } from './pages/PublicCareer'
import { PublicJob } from './pages/PublicJob'
import { Roller } from './pages/Roller'
import { Sourcing } from './pages/Sourcing'
import { StoreProvider, useStore } from './store'
import './styles.css'

function Root() {
  const { currentUser } = useStore()
  return (
    <Routes>
      {/* Publika sidor — ingen inloggning */}
      <Route path="/jobb" element={<PublicJob />} />
      <Route path="/karriar" element={<PublicCareer />} />
      {currentUser ? (
        <Route element={<Layout />}>
          <Route path="/" element={<Oversikt />} />
          <Route path="/planering" element={<Planering />} />
          <Route path="/ledningsfragor" element={<Ledningsfragor />} />
          <Route path="/sourcing" element={<Sourcing />} />
          <Route path="/headhunt" element={<Headhunt />} />
          <Route path="/karriarsida" element={<CareerBuilder />} />
          <Route path="/requisitions" element={<Requisitions />} />
          <Route path="/compliance" element={<Compliance />} />
          <Route path="/roller" element={<Roller />} />
          <Route path="/roller/:roleId" element={<Roller />} />
          <Route path="/kandidater" element={<Kandidater />} />
          <Route path="/kandidater/:candidateId" element={<Kandidater />} />
          <Route path="/inbox" element={<Inbox />} />
          <Route path="/feedback" element={<FeedbackPage />} />
          <Route path="/erbjudanden" element={<Erbjudanden />} />
          <Route path="/analys" element={<Analys />} />
          <Route path="/datapipeline" element={<Datapipeline />} />
          <Route path="/installningar" element={<Installningar />} />
          <Route path="*" element={<Oversikt />} />
        </Route>
      ) : (
        <Route path="*" element={<Login />} />
      )}
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
