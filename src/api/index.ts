// API-fasaden — resursindelning formad efter SmartRecruiters öppna API
// (postings/candidates/offers/reporting) + Teamtailor-stil. UI:t använder ENDAST denna.

import { call } from './client'
import * as server from './server'
import type {
  AppSettings, CareerBlock, CareerPage, PlanRow, Profile, ScorecardCriterion, StageId, TeamMember, TriggerAction,
} from '../types'
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
  outreach: {
    send: (threadId: string, text: string) => call(() => server.sendMessage(threadId, text)),
    advance: (threadId: string) => call(() => server.advanceSequence(threadId)),
    enroll: (opts: { candidateId?: string; sourcedId?: string; roleId: string; sequenceId: string }) => call(() => server.enrollSequence(opts)),
    moveFromThread: (threadId: string, stage: StageId) => call(() => server.moveFromThread(threadId, stage)),
  },
  headhunt: {
    createLink: (roleId: string) => call(() => server.createHeadhuntLink(roleId)),
    registerClick: (linkId: string) => call(() => server.registerHeadhuntClick(linkId), { bypassFail: true }),
    apply: (linkId: string, roleId: string, name: string, note: string) => call(() => server.applyViaHeadhunt(linkId, roleId, name, note)),
  },
  career: {
    updateMeta: (patch: Partial<Pick<CareerPage, 'accent' | 'companyName' | 'tagline'>>) => call(() => server.updateCareerMeta(patch)),
    updateBlock: (blockId: string, patch: Partial<CareerBlock>) => call(() => server.updateCareerBlock(blockId, patch)),
    moveBlock: (blockId: string, dir: -1 | 1) => call(() => server.moveCareerBlock(blockId, dir)),
    publish: (published: boolean) => call(() => server.publishCareer(published)),
  },
  triggers: {
    toggle: (id: string) => call(() => server.toggleTrigger(id)),
    add: (when: StageId, action: TriggerAction, detail: string) => call(() => server.addTrigger(when, action, detail)),
  },
  nurture: {
    toggle: (id: string) => call(() => server.toggleNurture(id)),
    send: (id: string) => call(() => server.sendNurture(id)),
  },
  requisitions: {
    decide: (reqId: string, approve: boolean, comment: string) => call(() => server.decideRequisition(reqId, approve, comment)),
    create: (input: { rollTitel: string; avdelning: string; lonebudget: number; antal: number; motivering: string; planRowId?: string }) => call(() => server.createRequisition(input)),
    openRole: (reqId: string) => call(() => server.openRoleFromRequisition(reqId)),
  },
  offerDrafts: {
    create: (candidateId: string, roleId: string, lon: number, startDate: string) => call(() => server.createOffer(candidateId, roleId, lon, startDate)),
    send: (offerId: string) => call(() => server.sendOffer(offerId)),
    sign: (offerId: string, signature: string) => call(() => server.signOffer(offerId, signature)),
  },
  compliance: {
    runRetention: () => call(() => server.runRetention()),
  },
  integrations: {
    toggle: (id: string) => call(() => server.toggleIntegration(id)),
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
    resetDemo: () => call(() => server.resetDemo(), { bypassFail: true }),
  },
}
