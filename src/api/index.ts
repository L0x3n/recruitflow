// API-fasaden — resursindelning formad efter SmartRecruiters öppna API
// (postings/candidates/offers/reporting) + Teamtailor-stil. UI:t använder ENDAST denna.

import { call } from './client'
import * as server from './server'
import type { AppSettings, PlanRow, Profile, ScorecardCriterion, StageId, TeamMember } from '../types'
import type { NewRoleInput } from './server'

export type { NewRoleInput, Snapshot } from './server'
export { snapshot, nowTs, todayIso } from './server'

export const api = {
  auth: {
    login: (userId: string) => call(() => server.login(userId), { bypassFail: true }),
    logout: () => call(() => server.logout(), { bypassFail: true }),
  },
  candidates: {
    move: (id: string, stage: StageId) => call(() => server.moveCandidate(id, stage)),
    reject: (id: string, reason: string, note: string) => call(() => server.rejectCandidate(id, reason, note)),
  },
  feedback: {
    answer: (requestId: string, channel: 'röst' | 'foto' | 'text', criteria: ScorecardCriterion[], motivation: string, voiceDuration?: string) =>
      call(() => server.answerFeedback(requestId, channel, criteria, motivation, voiceDuration)),
    remind: (requestId: string) => call(() => server.remindFeedback(requestId)),
  },
  offers: {
    remind: (offerId: string) => call(() => server.remindOffer(offerId)),
  },
  postings: {
    create: (input: NewRoleInput) => call(() => server.addRole(input)),
  },
  sourcing: {
    saveToPipeline: (profileId: string, roleId: string) => call(() => server.saveSourcedToPipeline(profileId, roleId)),
  },
  users: {
    updateProfile: (p: Profile) => call(() => server.updateProfile(p)),
    addMember: (m: TeamMember) => call(() => server.addMember(m)),
  },
  wfp: {
    updateRow: (rowId: string, patch: Partial<PlanRow>) => call(() => server.updatePlanRow(rowId, patch)),
    addRows: (rows: Omit<PlanRow, 'id'>[]) => call(() => server.addPlanRows(rows)),
    deleteRow: (rowId: string) => call(() => server.deletePlanRow(rowId)),
    createScenario: (namn: string) => call(() => server.createScenario(namn)),
    updateScenarioRow: (scenarioId: string, rowId: string, patch: Partial<PlanRow>) =>
      call(() => server.updateScenarioRow(scenarioId, rowId, patch)),
    deleteScenario: (scenarioId: string) => call(() => server.deleteScenario(scenarioId)),
    ackWarning: (warningId: string, comment: string) => call(() => server.ackWarning(warningId, comment)),
  },
  settings: {
    set: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) =>
      call(() => server.setSetting(key, value), { bypassFail: true }),
  },
}
