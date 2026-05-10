export { useContractsStore } from './model/store'
export { mapBackendStatus, patchFromBackendDto } from './model/statusMap'
export {
  DEMO_COMPLETED_DISPUTE_CONTRACT_ID,
  DEMO_COMPLETED_DISPUTE_CUSTOMER_CONTRACT_ID,
  DEMO_STATUS_IDS,
  LEGACY_REMOVED_GALLERY_IDS,
} from './model/mocks'
export { CONTRACT_TEMPLATES, findTemplate, renderContractText } from './model/templates'
export { computeContractTextHash } from './lib/textHash'
export { addDisputeCalendarDays, calendarDaysRemaining, formatDueLabel } from './lib/disputeDates'
export type {
  ContractTemplate,
  ContractTemplateKey,
  ContractTextData,
  PartyInfo,
} from './model/templates'
export type {
  Contract,
  ContractParty,
  ContractSignature,
  ContractSignatures,
  ContractStatus,
  CreateContractInput,
  DisputeAttachment,
  DisputeMessage,
} from './model/types'
