import { type FC, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useWallet } from '@solana/wallet-adapter-react'
import { type ContractTemplateKey, findTemplate, useContractsStore } from '@/entities/contract'
import { useUserStore } from '@/entities/user'
import { structuredTechnicalAssignmentFromCopilot } from '@/features/ai/contractCopilotText'
import { createLocalAiService } from '@/features/ai/service'
import { demoLocalAiAdapter } from '@/features/ai/adapters/demoLocalAiAdapter'
import { qvacLocalAiAdapter } from '@/features/ai/adapters/qvacLocalAiAdapter'
import type { DemoScenario } from '@/features/ai/types'
import { api, ApiError } from '@/shared/api/client'
import { signAndSendChainTx, ChainTxError } from '@/shared/lib/chainTx'
import { Button, FormWrapper } from '@/shared/ui'
import { Step1Parties } from './steps/Step1Parties'
import { Step2TechnicalAssignment } from './steps/Step2TechnicalAssignment'
import { Step3Subject } from './steps/Step3Subject'
import { Step4Term } from './steps/Step4Term'
import { Step5Cost } from './steps/Step5Cost'
import { Step6Jurisdiction } from './steps/Step6Jurisdiction'
import type { ContractFormValues } from '../model/types'
import {
  deriveSubjectFromTechnicalAssignment,
  MIN_TA_CHARS_FOR_SYNTHESIS,
} from '../lib/deriveSubjectFromTechnicalAssignment'

interface ContractFormProps {
  templateKey: ContractTemplateKey
}

const TOTAL_STEPS = 6
const MIN_TECHNICAL_ASSIGNMENT_CHARS_FOR_AI = 120

const STEP_TITLES: Record<number, string> = {
  1: 'Parties',
  2: 'Technical assignment',
  3: 'Subject of contract',
  4: 'Execution term',
  5: 'Cost',
  6: 'Jurisdiction',
}

export const ContractForm: FC<ContractFormProps> = ({ templateKey }) => {
  const navigate = useNavigate()
  const userProfile = useUserStore((s) => s.profile)
  const authToken = useUserStore((s) => s.authToken)
  const setUserProfile = useUserStore((s) => s.setProfile)
  const walletAddress = useUserStore((s) => s.walletAddress)
  const createContract = useContractsStore((s) => s.create)
  const linkChain = useContractsStore((s) => s.linkChain)
  const wallet = useWallet()

  const template = useMemo(() => findTemplate(templateKey), [templateKey])

  const [step, setStep] = useState(1)
  const [isImprovingAssignment, setIsImprovingAssignment] = useState(false)
  const [improveAssignmentError, setImproveAssignmentError] = useState('')
  /** Text that was in the TA field immediately before the last successful Improve. */
  const [assignmentBeforeAi, setAssignmentBeforeAi] = useState<string | null>(null)
  /** Last Improve result (frozen); user can toggle between this and `assignmentBeforeAi`. */
  const [assignmentLastAi, setAssignmentLastAi] = useState<string | null>(null)

  useEffect(() => {
    setAssignmentBeforeAi(null)
    setAssignmentLastAi(null)
  }, [templateKey])

  const form = useForm<ContractFormValues>({
    mode: 'onChange',
    defaultValues: {
      templateKey,
      customerFullName: userProfile.fullName,
      customerEmail: userProfile.email,
      customerCompanyName: userProfile.companyName ?? '',
      performerFullName: '',
      performerEmail: '',
      performerCompanyName: '',
      performerWalletAddress: '',
      technicalAssignment: template?.defaultTechnicalAssignment ?? '',
      subject: template?.defaultSubject ?? '',
      startDate: null,
      endDate: null,
      amount: template?.defaultAmount ?? 0,
      currency: template?.defaultCurrencyCode ?? 'SOL',
      jurisdictionCode: template?.defaultJurisdictionCode ?? 'US',
      additionalTerms: '',
      disputeResolutionDays: 7,
    },
  })
  const technicalAssignment = form.watch('technicalAssignment') ?? ''
  const technicalAssignmentLength = technicalAssignment.trim().length
  const isTechnicalAssignmentReadyForAi =
    technicalAssignmentLength >= MIN_TECHNICAL_ASSIGNMENT_CHARS_FOR_AI

  const aiService = useMemo(
    () =>
      createLocalAiService({
        source: ((import.meta.env.VITE_AI_SOURCE as 'demo' | 'qvac' | undefined) ?? 'qvac') as
          | 'demo'
          | 'qvac',
        adapters: {
          demo: demoLocalAiAdapter,
          qvac: qvacLocalAiAdapter,
        },
        qvacApi: {
          baseUrl: (import.meta.env.VITE_API_URL as string | undefined) ?? '/api',
          getAuthToken: () => authToken,
        },
        fallbackToDemo: true,
      }),
    [authToken],
  )
  const aiScenario: Exclude<DemoScenario, 'off'> = templateKey === 'logo-design' ? 'logo' : 'design'

  const applyTechnicalAssignmentSnapshot = (value: string | null) => {
    if (!value) return
    form.setValue('technicalAssignment', value, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    })
  }

  const stepFields: Array<Array<keyof ContractFormValues>> = [
    ['customerFullName', 'customerEmail'],
    ['technicalAssignment'],
    ['subject'],
    ['startDate', 'endDate'],
    ['amount', 'currency'],
    ['jurisdictionCode', 'disputeResolutionDays'],
  ]

  const goNext = async () => {
    const fields = stepFields[step - 1]
    const ok = await form.trigger(fields)
    if (!ok) return

    if (step === 2) {
      const ta = form.getValues('technicalAssignment').trim()
      const subjectState = form.getFieldState('subject', form.formState)
      const subjectUnused = !subjectState.isDirty
      if (subjectUnused && ta.length >= MIN_TA_CHARS_FOR_SYNTHESIS) {
        const derived = deriveSubjectFromTechnicalAssignment(ta)
        if (derived.length >= 10) {
          form.setValue('subject', derived, {
            shouldDirty: false,
            shouldTouch: false,
            shouldValidate: true,
          })
        }
      }
    }

    setStep((prev) => Math.min(prev + 1, TOTAL_STEPS))
  }

  const goBack = () => {
    if (step === 1) {
      navigate('/contracts/new')
      return
    }
    setStep((prev) => Math.max(prev - 1, 1))
  }

  const handleImproveTechnicalAssignment = async () => {
    if (!isTechnicalAssignmentReadyForAi || isImprovingAssignment) return
    setIsImprovingAssignment(true)
    setImproveAssignmentError('')

    const before = technicalAssignment.trim()
    const payload = { technicalAssignment: before }

    try {
      const result = await aiService.improveContract('preview', payload, aiScenario)
      const nextText = structuredTechnicalAssignmentFromCopilot(result).trim()
      if (!nextText) {
        setImproveAssignmentError('QVAC did not return an improved version. Try again.')
        return
      }
      setAssignmentBeforeAi(before)
      setAssignmentLastAi(nextText)
      form.setValue('technicalAssignment', nextText, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      })
    } catch (error) {
      setImproveAssignmentError(
        error instanceof Error ? error.message : 'Failed to improve technical assignment.',
      )
    } finally {
      setIsImprovingAssignment(false)
    }
  }

  const handleSubmit = form.handleSubmit(async (values) => {
    if (!walletAddress) return
    if (!template) return

    setUserProfile({
      fullName: values.customerFullName,
      email: values.customerEmail,
      companyName: values.customerCompanyName,
    })

    const contract = createContract(
      {
        templateKey: values.templateKey,
        customer: {
          fullName: values.customerFullName,
          email: values.customerEmail,
          companyName: values.customerCompanyName || undefined,
          walletAddress,
        },
        performer: {
          fullName: values.performerFullName,
          email: values.performerEmail,
          companyName: values.performerCompanyName || undefined,
          walletAddress: values.performerWalletAddress || undefined,
        },
        subject: values.subject,
        technicalAssignment: values.technicalAssignment,
        jurisdictionCode: values.jurisdictionCode,
        currency: values.currency,
        amount: values.amount,
        startDate: values.startDate,
        endDate: values.endDate,
        additionalTerms: values.additionalTerms || undefined,
        disputeResolutionDays: values.disputeResolutionDays,
      },
      walletAddress,
    )

    // Mirror the contract onto the backend + on-chain escrow PDA in
    // the background. Navigate now so the user sees the contract page
    // immediately; chain status (linking → ready / error) is rendered
    // from the contract object on that page.
    void (async () => {
      try {
        if (!authToken) {
          throw new Error('No auth token; finish wallet sign-in before creating a contract')
        }
        if (!values.performerWalletAddress) {
          throw new Error('Performer wallet address is required for the on-chain escrow PDA')
        }
        const health = await api.health()
        const created = await api.contracts.create(authToken, {
          title: contract.title,
          description: contract.subject || contract.text.slice(0, 200),
          amount: String(contract.amount),
          currency: contract.currency,
          deadline: contract.endDate ?? undefined,
          assigneeAddress: values.performerWalletAddress,
          disputeResolutionDays: values.disputeResolutionDays,
        })

        if (health.chain === 'mock') {
          linkChain(contract.id, {
            backendId: created.id,
            onchainAddress: created.onchainAddress,
            initTxSignature: created.unsignedTx,
            chainMode: 'mock',
            textHash: created.contractHash,
            chainError: undefined,
          })
        } else {
          const { signature } = await signAndSendChainTx(created.unsignedTx, wallet)
          linkChain(contract.id, {
            backendId: created.id,
            onchainAddress: created.onchainAddress,
            initTxSignature: signature,
            chainMode: 'solana',
            textHash: created.contractHash,
            chainError: undefined,
          })
        }
      } catch (err) {
        const msg =
          err instanceof ApiError
            ? `${err.code}: ${err.message}`
            : err instanceof ChainTxError
              ? err.message
              : err instanceof Error
                ? err.message
                : 'Unknown chain error'
        linkChain(contract.id, { chainError: msg })
      }
    })()

    navigate(`/contracts/${contract.id}`, { replace: true })
  })

  if (!template) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
        <h2 className="text-h2 text-(--color-text-primary)">Template not found</h2>
        <button
          type="button"
          onClick={() => navigate('/contracts/new')}
          className="text-[14px] font-bold text-(--color-brand) cursor-pointer hover:opacity-80"
        >
          Back to templates
        </button>
      </div>
    )
  }

  const isLastStep = step === TOTAL_STEPS
  const title = STEP_TITLES[step]

  return (
    <FormWrapper
      title={title}
      currentStep={step}
      totalSteps={TOTAL_STEPS}
      onBack={goBack}
      onNext={goNext}
      onSubmit={handleSubmit}
      isLastStep={isLastStep}
    >
      <form
        className="flex flex-col gap-4 min-h-0 flex-1"
        onSubmit={(e) => {
          e.preventDefault()
          if (isLastStep) handleSubmit()
          else goNext()
        }}
      >
        {step === 1 && <Step1Parties form={form} />}
        {step === 2 && <Step2TechnicalAssignment form={form} />}
        {step === 2 && assignmentBeforeAi !== null && assignmentLastAi !== null && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-(--color-border-subtle) bg-(--color-surface-overlay) px-3 py-2">
            <span className="text-[13px] font-medium text-(--color-text-secondary) shrink-0">
              Version:
            </span>
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => applyTechnicalAssignmentSnapshot(assignmentBeforeAi)}
            >
              Before QVAC
            </Button>
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => applyTechnicalAssignmentSnapshot(assignmentLastAi)}
            >
              QVAC version
            </Button>
          </div>
        )}
        {step === 2 && isTechnicalAssignmentReadyForAi && (
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              onClick={handleImproveTechnicalAssignment}
              disabled={isImprovingAssignment}
              className="w-full md:w-auto"
            >
              {isImprovingAssignment ? 'Improving with QVAC...' : 'Improve with QVAC'}
            </Button>
            {improveAssignmentError && (
              <p className="text-[13px] font-medium text-(--color-state-danger)">
                {improveAssignmentError}
              </p>
            )}
          </div>
        )}
        {step === 2 && !isTechnicalAssignmentReadyForAi && (
          <p className="text-[13px] font-medium text-(--color-text-muted)">
            Write at least {MIN_TECHNICAL_ASSIGNMENT_CHARS_FOR_AI} characters in Technical
            assignment to enable AI improvement ({technicalAssignmentLength}/
            {MIN_TECHNICAL_ASSIGNMENT_CHARS_FOR_AI}).
          </p>
        )}
        {step === 3 && <Step3Subject form={form} />}
        {step === 4 && <Step4Term form={form} />}
        {step === 5 && <Step5Cost form={form} />}
        {step === 6 && <Step6Jurisdiction form={form} />}
      </form>
    </FormWrapper>
  )
}
