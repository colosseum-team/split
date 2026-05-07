import type { FC, ReactNode } from 'react'

interface HeaderProps {
  children?: ReactNode
  className?: string
}

export const Header: FC<HeaderProps> = ({ children, className = '' }) => {
  return <header className={`flex w-full ${className}`}>{children}</header>
}
