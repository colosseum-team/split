import type { FC } from 'react'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  GlobeAltIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'
import { CONTRACT_TEMPLATES, type ContractTemplateKey } from '@/entities/contract'
import { useUserStore } from '@/entities/user'
import { Header, Layout } from '@/widgets/layout'

const TEMPLATE_ICON: Record<ContractTemplateKey, typeof GlobeAltIcon> = {
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
    <Layout>
      <Header className="items-center mb-4">
        <button
          type="button"
          onClick={() => navigate('/home')}
          className="flex items-center gap-1 text-[14px] font-bold text-(--color-text-start-page) hover:opacity-80 transition-opacity cursor-pointer"
          aria-label="Back"
        >
          <ChevronLeftIcon className="w-5 h-5" />
          <span>Back</span>
        </button>
      </Header>

      <div className="flex flex-col gap-2 mb-6">
        <h1 className="md:text-[24px] text-[20px] font-bold text-(--color-text-dark-blue)">
          New contract
        </h1>
        <p className="md:text-[16px] text-[14px] font-medium text-(--color-text-start-page)">
          Pick a starting template. The technical assignment is pre-filled — you can edit every
          detail in the next steps.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CONTRACT_TEMPLATES.map((template) => {
          const Icon = TEMPLATE_ICON[template.key]
          return (
            <button
              key={template.key}
              type="button"
              onClick={() => handleSelect(template.key)}
              className="text-left p-5 rounded-[16px] bg-(--color-bg-secondary) border border-(--color-border-contract-card) hover:border-(--color-input-active) transition-colors cursor-pointer flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-[12px] bg-(--color-button) flex items-center justify-center">
                  <Icon className="w-6 h-6 text-(--color-text-purple)" />
                </div>
                <ChevronRightIcon className="w-5 h-5 text-(--color-text-light-gray)" />
              </div>
              <div className="flex flex-col gap-1">
                <div className="text-[18px] font-bold text-(--color-text-dark-blue)">
                  {template.title}
                </div>
                <p className="text-[14px] font-medium text-(--color-text-start-page) leading-snug">
                  {template.description}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </Layout>
  )
}
