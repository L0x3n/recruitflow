import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TOUR_STEPS, useStore } from '../store'

interface Rect { top: number; left: number; width: number; height: number }

export function Tour() {
  const { tourStep, setTourStep, requestReject, cancelReject } = useStore()
  const navigate = useNavigate()
  const [rect, setRect] = useState<Rect | null>(null)

  const step = tourStep === null ? null : TOUR_STEPS[tourStep]

  useEffect(() => {
    if (tourStep === null || !step) return
    navigate(step.route)
    if (step.openRejectDemo) requestReject('demo')
    else cancelReject()

    let tries = 0
    setRect(null)
    const timer = setInterval(() => {
      tries++
      const el = document.querySelector(`[data-tour="${step.selector}"]`)
      if (el) {
        el.scrollIntoView({ block: 'center', behavior: 'auto' })
        const r = el.getBoundingClientRect()
        setRect({ top: r.top - 8, left: r.left - 8, width: r.width + 16, height: r.height + 16 })
        clearInterval(timer)
      } else if (tries > 30) {
        clearInterval(timer)
      }
    }, 80)
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourStep])

  if (tourStep === null || !step) return null

  const end = () => { cancelReject(); setTourStep(null) }
  const next = () => tourStep < TOUR_STEPS.length - 1 ? setTourStep(tourStep + 1) : end()
  const prev = () => tourStep > 0 && setTourStep(tourStep - 1)

  // Placera kortet under spotlighten om det får plats, annars ovanför.
  const cardStyle: React.CSSProperties = rect
    ? {
        top: rect.top + rect.height + 14 + 320 < window.innerHeight
          ? rect.top + rect.height + 14
          : Math.max(16, rect.top - 200),
        left: Math.min(Math.max(16, rect.left), window.innerWidth - 390),
      }
    : { top: '40%', left: '50%', transform: 'translateX(-50%)' }

  return (
    <>
      {rect && <div className="tour-spot" style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }} />}
      <div className="tour-card" style={cardStyle} data-testid="tour-card">
        <div className="tour-step-num">Guidad tur · steg {tourStep + 1} av {TOUR_STEPS.length}</div>
        <h3>{step.title}</h3>
        <p>{step.text}</p>
        <div className="tour-actions">
          <button className="btn small" onClick={end}>Avsluta</button>
          <div style={{ display: 'flex', gap: 8 }}>
            {tourStep > 0 && <button className="btn small" onClick={prev}>Föregående</button>}
            <button className="btn small primary" onClick={next} data-testid="tour-next">
              {tourStep < TOUR_STEPS.length - 1 ? 'Nästa →' : 'Klart ✓'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
