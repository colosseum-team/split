import type { FC, ReactNode } from 'react'
import { AuroraBackdrop } from '@/shared/ui'

interface LayoutProps {
  children: ReactNode
  className?: string
  /** Hide the global Aurora decorative background (defaults to true). */
  withAurora?: boolean
}

export const Layout: FC<LayoutProps> = ({ children, className = '', withAurora = true }) => {
  return (
    <div
      className={`relative min-h-screen w-full bg-(--color-surface-base) flex flex-col overflow-x-hidden ${className}`}
    >
      {withAurora ? <AuroraBackdrop fixed /> : null}
      <div className="relative z-10 w-full max-w-[820px] mx-auto px-4 md:px-6 py-4 md:py-10 flex-1 flex flex-col md:justify-center min-h-0">
        {children}
      </div>
    </div>
  )
}
