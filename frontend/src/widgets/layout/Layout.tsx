import type { FC, ReactNode } from 'react'

interface LayoutProps {
  children: ReactNode
  className?: string
}

export const Layout: FC<LayoutProps> = ({ children, className = '' }) => {
  return (
    <div className={`min-h-screen w-full bg-(--color-surface-base) flex flex-col ${className}`}>
      <div className="w-full max-w-[1024px] mx-auto px-4 md:px-6 py-4 md:py-10 flex-1 flex flex-col md:justify-center min-h-0">
        {children}
      </div>
    </div>
  )
}
