import type { MatchResult, Role, SourcedProfile } from './types'

// Naturspråkssök över "hela webben" — tokeniserar frågan och rankar poolen
// på överlappande nyckelord. (Ren funktion, deterministisk för demon.)

const STOP = new Set([
  'och', 'i', 'på', 'med', 'en', 'ett', 'som', 'har', 'för', 'av', 'till', 'gärna', 'helst',
  'erfarenhet', 'erfaren', 'senior', 'junior', 'the', 'a', 'in', 'with', 'who', 'söker', 'letar',
  'hitta', 'find', 'någon', 'person', 'kandidat', 'minst', 'års', 'år',
])

const tokenize = (s: string): string[] =>
  s.toLowerCase()
    .replace(/[^a-zåäö0-9+#. ]/g, ' ')
    .split(/\s+/)
    .map(t => t.trim())
    .filter(t => t.length >= 2 && !STOP.has(t))

export interface RankedProfile {
  profile: SourcedProfile
  relevance: number // 0–100
  hits: string[] // vilka tokens matchade
}

export function searchProfiles(query: string, pool: SourcedProfile[]): RankedProfile[] {
  const tokens = tokenize(query)
  if (!tokens.length) return []

  return pool
    .map(profile => {
      const hay = [
        ...profile.tags,
        ...profile.skills.map(s => s.toLowerCase()),
        profile.title.toLowerCase(),
        profile.location.toLowerCase(),
      ]
      const hits = new Set<string>()
      let raw = 0
      for (const tok of tokens) {
        const matched = hay.some(h => h.includes(tok) || tok.includes(h))
        if (matched) { hits.add(tok); raw += 1 }
      }
      // öppenhet för nytt jobb ger en liten knuff uppåt
      const relevance = Math.min(100, Math.round((raw / tokens.length) * 88 + (profile.openToWork / 100) * 12))
      return { profile, relevance, hits: [...hits] }
    })
    .filter(r => r.hits.length > 0)
    .sort((a, b) => b.relevance - a.relevance)
}

// Förklarbar matchning mot en rolls kravprofil — aldrig ett svart lådnummer.
export function matchProfile(profile: SourcedProfile, role: Role): MatchResult {
  const contributions: MatchResult['contributions'] = []
  const tokens = new Set([
    ...profile.tags,
    ...profile.skills.map(s => s.toLowerCase()),
    ...profile.growthSignals.map(s => s.toLowerCase()),
  ])
  const has = (needle: string) => {
    const n = needle.toLowerCase()
    return [...tokens].some(t => t.includes(n) || n.includes(t))
  }

  let score = 40 // baslinje

  // Must-have-kompetenser väger tyngst
  for (const must of role.mustHave) {
    const key = must.toLowerCase().split(/[\s/&]+/)[0]
    if (has(key)) {
      const frag = profile.fragments.find(f => f.detail.toLowerCase().includes(key))
      contributions.push({
        label: must, delta: 12,
        reason: frag ? `+ ${must} syns i ${frag.source} (${frag.detail.slice(0, 42)}…)` : `+ ${must} finns i profilen`,
      })
      score += 12
    } else {
      contributions.push({ label: must, delta: -8, reason: `− ingen tydlig ${must}-signal` })
      score -= 8
    }
  }

  // Meriterande ger mindre plus
  for (const merit of role.meriterande) {
    const key = merit.toLowerCase().split(/[\s/&]+/)[0]
    if (has(key)) {
      contributions.push({ label: merit + ' (meriterande)', delta: 5, reason: `+ meriterande ${merit}` })
      score += 5
    }
  }

  // Tillväxtsignaler — Talentiums kärna: värdera bana, inte bara titlar
  if (profile.growthSignals.length >= 2) {
    contributions.push({
      label: 'Tillväxtbana', delta: 6,
      reason: `+ starka tillväxtsignaler (${profile.growthSignals.length} st, t.ex. ”${profile.growthSignals[0]}”)`,
    })
    score += 6
  }

  // Öppenhet för nytt
  if (profile.openToWork >= 70) {
    contributions.push({ label: 'Tillgänglighet', delta: 4, reason: `+ sannolikt öppen för nytt (${profile.openToWork}%)` })
    score += 4
  } else if (profile.openToWork < 55) {
    contributions.push({ label: 'Tillgänglighet', delta: -3, reason: `− verkar nöjd där hen är (${profile.openToWork}%)` })
    score -= 3
  }

  score = Math.max(5, Math.min(99, score))
  contributions.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
  return { score, contributions }
}

export const matchLabel = (score: number) =>
  score >= 80 ? 'Utmärkt match' : score >= 65 ? 'Stark match' : score >= 50 ? 'Möjlig match' : 'Svag match'
