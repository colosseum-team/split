import { type FC, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { type ContractTemplateKey, findTemplate, useContractsStore } from '@/entities/contract'
import { useUserStore } from '@/entities/user'
import { FormWrapper } from '@/shared/ui'
import { Step1Parties } from './steps/Step1Parties'
import { Step2TechnicalAssignment } from './steps/Step2TechnicalAssignment'
import { Step3Subject } from './steps/Step3Subject'
import { Step4Term } from './steps/Step4Term'
import { Step5Cost } from './steps/Step5Cost'
import { Step6Jurisdiction } from './steps/Step6Jurisdiction'
import type { ContractFormValues } from '../model/types'

interface ContractFormProps {
  templateKey: ContractTemplateKey
}

const MOCK_PERFORMER = {
  fullName: 'Maya Reyes',
  email: 'maya.reyes@split.demo',
  companyName: 'Independent contractor',
  walletAddress: 'PerformerDemoWalletAddress00000000000000000000',
}

const TOTAL_STEPS = 6

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
  const setUserProfile = useUserStore((s) => s.setProfile)
  const walletAddress = useUserStore((s) => s.walletAddress)
  const createContract = useContractsStore((s) => s.create)

  const template = useMemo(() => findTemplate(templateKey), [templateKey])

  const [step, setStep] = useState(1)

  const form = useForm<ContractFormValues>({
    mode: 'onChange',
    defaultValues: {
      templateKey,
      customerFullName: userProfile.fullName,
      customerEmail: userProfile.email,
      customerCompanyName: userProfile.companyName ?? '',
      performerFullName: MOCK_PERFORMER.fullName,
      performerEmail: MOCK_PERFORMER.email,
      performerCompanyName: MOCK_PERFORMER.companyName,
      performerWalletAddress: MOCK_PERFORMER.walletAddress,
      technicalAssignment: template?.defaultTechnicalAssignment ?? '',
      subject: template?.defaultSubject ?? '',
      startDate: null,
      endDate: null,
      amount: template?.defaultAmount ?? 0,
      currency: template?.defaultCurrencyCode ?? 'SOL',
      jurisdictionCode: template?.defaultJurisdictionCode ?? 'US',
      additionalTerms: '',
    },
  })

  const stepFields: Array<Array<keyof ContractFormValues>> = [
    ['customerFullName', 'customerEmail'],
    ['technicalAssignment'],
    ['subject'],
    ['startDate', 'endDate'],
    ['amount', 'currency'],
    ['jurisdictionCode'],
  ]

  const goNext = async () => {
    const fields = stepFields[step - 1]
    const ok = await form.trigger(fields)
    if (!ok) return
    setStep((prev) => Math.min(prev + 1, TOTAL_STEPS))
  }

  const goBack = () => {
    if (step === 1) {
      navigate('/contracts/new')
      return
    }
    setStep((prev) => Math.max(prev - 1, 1))
  }

  const handleSubmit = form.handleSubmit((values) => {
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
          walletAddress: values.performerWalletAddress,
        },
        subject: values.subject,
        technicalAssignment: values.technicalAssignment,
        jurisdictionCode: values.jurisdictionCode,
        currency: values.currency,
        amount: values.amount,
        startDate: values.startDate,
        endDate: values.endDate,
        additionalTerms: values.additionalTerms || undefined,
      },
      walletAddress,
    )

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
        {step === 3 && <Step3Subject form={form} />}
        {step === 4 && <Step4Term form={form} />}
        {step === 5 && <Step5Cost form={form} />}
        {step === 6 && <Step6Jurisdiction form={form} />}
      </form>
    </FormWrapper>
  )
}
