import type { ReactNode } from 'react'

const FRONTEND_BASE_URL = process.env.NEXT_PUBLIC_DEMO_URL ?? 'http://localhost:5173'

function buildDemoUrl(baseUrl: string): string {
  const trimmed = baseUrl.trim()
  if (!trimmed) {
    return 'http://localhost:5173/start'
  }

  // Allows passing full route via env, but defaults to the role selection screen.
  if (trimmed.endsWith('/start')) {
    return trimmed
  }

  return `${trimmed.replace(/\/+$/, '')}/start`
}

const DEMO_URL = buildDemoUrl(FRONTEND_BASE_URL)

type Props = {
  children: ReactNode
  variant?: 'primary' | 'ghost'
  size?: 'md' | 'lg'
  href?: string
}

export function CtaButton({ children, variant = 'primary', size = 'md', href = DEMO_URL }: Props) {
  const className = `lp-cta ${variant}${size === 'lg' ? ' lg' : ''}`
  return (
    <a className={className} href={href}>
      {children}
    </a>
  )
}
