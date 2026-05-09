import { type FC, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import { type ContractTemplateKey, findTemplate } from '@/entities/contract'
import { useUserStore } from '@/entities/user'
import { ContractForm } from '@/features/contract/create'
import { AuroraBackdrop } from '@/shared/ui'

export const ContractCreatePage: FC = () => {
  const navigate = useNavigate()
  const role = useUserStore((s) => s.role)
  const { templateKey } = useParams<{ templateKey: string }>()

  const template = findTemplate(templateKey)
  const isValidTemplate = !!template

  useEffect(() => {
    if (role && role !== 'customer') {
      navigate('/home', { replace: true })
    }
  }, [role, navigate])

  useEffect(() => {
    if (templateKey && !isValidTemplate) {
      navigate('/contracts/new', { replace: true })
    }
  }, [templateKey, isValidTemplate, navigate])

  if (!templateKey || !isValidTemplate) return null

  return (
    <div className="relative min-h-screen w-full bg-(--color-surface-base) overflow-x-hidden">
      <AuroraBackdrop fixed />

      <div className="sticky top-0 z-20 bg-(--color-surface-overlay) backdrop-blur-md border-b border-(--color-border-subtle)">
        <div className="w-full max-w-[820px] mx-auto px-4 md:px-6 py-3 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate('/contracts/new')}
            className="flex items-center gap-1 text-[14px] font-bold text-(--color-text-secondary) cursor-pointer hover:opacity-80"
            aria-label="Back to templates"
          >
            <ChevronLeftIcon className="w-5 h-5" />
            <span>Back</span>
          </button>
          <span className="text-[12px] font-mono text-(--color-text-muted) truncate">
            {template?.title ?? 'Create contract'}
          </span>
        </div>
      </div>

      <main className="relative z-10 w-full max-w-[820px] mx-auto px-4 md:px-6 py-6 md:py-10">
        <ContractForm key={templateKey} templateKey={templateKey as ContractTemplateKey} />
      </main>
    </div>
  )
}
