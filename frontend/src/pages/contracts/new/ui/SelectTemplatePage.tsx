import type { FC } from 'react'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  GlobeAltIcon,
  PencilSquareIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'
import { CONTRACT_TEMPLATES, type ContractTemplateKey } from '@/entities/contract'
import { useUserStore } from '@/entities/user'
import { Card, AuroraBackdrop } from '@/shared/ui'

const TEMPLATE_ICON: Record<ContractTemplateKey, typeof GlobeAltIcon> = {
  custom: PencilSquareIcon,
  'landing-development': GlobeAltIcon,
  'logo-design': SparklesIcon,
}

export const SelectTemplatePage: FC = () => {
  const navigate = useNavigate()
  const role = useUserStore((s) => s.role)

  useEffect(() => {
    if (role && role !== 'customer') {
      navigate('/home', { replace: true })
    }
  }, [role, navigate])

  const handleSelect = (templateKey: ContractTemplateKey) => {
    navigate(`/contracts/create/${templateKey}`)
  }

  return (
    <div className="relative min-h-screen w-full bg-(--color-surface-base) overflow-x-hidden">
      <AuroraBackdrop fixed />

      <div className="sticky top-0 z-20 bg-(--color-surface-overlay) backdrop-blur-md border-b border-(--color-border-subtle)">
        <div className="w-full max-w-[820px] mx-auto px-4 md:px-6 py-3 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate('/home')}
            className="flex items-center gap-1 text-[14px] font-bold text-(--color-text-secondary) hover:opacity-80 transition-opacity cursor-pointer"
            aria-label="Back"
          >
            <ChevronLeftIcon className="w-5 h-5" />
            <span>Back</span>
          </button>
          <span className="text-[12px] font-mono text-(--color-text-muted) truncate">
            Create contract
          </span>
        </div>
      </div>

      <main className="relative z-10 w-full max-w-[820px] mx-auto px-4 md:px-6 py-6 md:py-10">
        <div className="flex flex-col gap-2 mb-6">
          <h1 className="text-h1 text-(--color-text-primary)">New contract</h1>
          <p className="text-body md:text-[16px] text-(--color-text-secondary)">
            Pick a template or create your own contract from scratch. Every section stays editable
            in the next steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CONTRACT_TEMPLATES.map((template) => {
            const Icon = TEMPLATE_ICON[template.key]
            return (
              <Card
                as="button"
                key={template.key}
                type="button"
                onClick={() => handleSelect(template.key)}
                interactive
                className="text-left flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-[var(--radius-md)] bg-(--color-brand-accent) flex items-center justify-center">
                    <Icon className="w-6 h-6 text-(--color-brand)" />
                  </div>
                  <ChevronRightIcon className="w-5 h-5 text-(--color-text-muted)" />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="text-h3 text-(--color-text-primary)">{template.title}</div>
                  <p className="text-body text-(--color-text-secondary)">{template.description}</p>
                </div>
              </Card>
            )
          })}
        </div>
      </main>
    </div>
  )
}
