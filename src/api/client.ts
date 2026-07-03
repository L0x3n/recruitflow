// Simulerad nätverksklient: latens + valbart API-fel (Inställningar → "Simulera API-fel").
// Läsningar sker synkront via snapshot(); ALLA mutationer går genom call().

import { db } from './server'

const delay = () => new Promise(r => setTimeout(r, 120 + Math.random() * 180))

export async function call<T>(fn: () => T, opts?: { bypassFail?: boolean }): Promise<T> {
  await delay()
  if (db.settings.apiFel && !opts?.bypassFail) {
    throw new Error('Simulerat API-fel (503 Service Unavailable)')
  }
  return fn()
}
