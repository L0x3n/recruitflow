import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'

const ROLE_DESC: Record<string, string> = {
  ledning: 'Ser allt — planer, utfall, statistik. Läsläge.',
  chef: 'Sätter & delegerar budget, godkänner, ser varningar och står till svars mot ledningen.',
  rekryterare: 'Arbetar operativt: pipeline, feedback, outreach — och ser sina egna mål & budget.',
}

const ROLE_ICON: Record<string, string> = { ledning: '📊', chef: '🎯', rekryterare: '🤝' }

export function Login() {
  const { users, login } = useStore()
  const navigate = useNavigate()
  const loginAs = async (id: string) => { await login(id); navigate('/') }
  return (
    <div className="login-page">
      <div className="login-card">
        <div className="logo" style={{ justifyContent: 'center', paddingBottom: 8 }}>
          <div className="logo-mark">R</div>
          <div>
            <div className="logo-name" style={{ color: '#fff' }}>RecruitFlow</div>
            <div className="logo-sub">Rekrytering i en perfekt värld</div>
          </div>
        </div>
        <p className="login-sub">Demo — välj vem du vill logga in som. Varje roll ser sin egen värld.</p>
        <div className="login-accounts">
          {users.map(u => (
            <button key={u.id} className="login-account" onClick={() => loginAs(u.id)} data-testid={`login-${u.id}`}>
              <span className="login-ico">{ROLE_ICON[u.role]}</span>
              <span className="login-avatar">{u.name.split(/\s+/).map(w => w[0]).join('').slice(0, 2)}</span>
              <span style={{ flex: 1, textAlign: 'left' }}>
                <b>{u.name}</b>
                <span className="login-rolelabel">{u.roleLabel}</span>
                <span className="login-desc">{ROLE_DESC[u.role]}</span>
              </span>
              <span className="login-arrow">→</span>
            </button>
          ))}
        </div>
        <div className="login-foot">All data är fiktiv · inget lösenord i demon</div>
      </div>
    </div>
  )
}
