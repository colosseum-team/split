import { type FC, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { type ContractTemplateKey, findTemplate } from '@/entities/contract'
import { useUserStore } from '@/entities/user'
import { Layout } from '@/widgets/layout'
import { ContractForm } from '@/features/contract/create'

export const ContractCreatePage: FC = () => {
  const navigate = useNavigate()
  const role = useUserStore((s) => s.role)
  const { templateKey } = useParams<{ templateKey: string }>()

  const isValidTemplate = !!findTemplate(templateKey)

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
    <Layout>
      <ContractForm templateKey={templateKey as ContractTemplateKey} />
    </Layout>
  )
}
