import type { ReactNode } from 'react'

const DEMO_URL = process.env.NEXT_PUBLIC_DEMO_URL ?? 'http://localhost:3000'

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
