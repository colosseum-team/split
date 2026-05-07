import type { FC, ReactNode } from 'react'

interface WrapperProps {
  children: ReactNode
  icon: ReactNode
  iconColor: string
  iconBgColor?: string
  singleIcon?: boolean
  title: string
  description?: string
  paragraph?: string
  bgGray?: boolean
  className?: string
}

export const Wrapper: FC<WrapperProps> = ({
  children,
  icon,
  iconColor,
  iconBgColor,
  singleIcon = false,
  title,
  description,
  paragraph,
  bgGray = false,
  className = '',
}) => {
  if (!singleIcon && !iconBgColor) {
    throw new Error('iconBgColor is required when singleIcon is false')
  }

  const containerBaseClasses =
    'rounded-[var(--radius-xl)] p-[24px] md:p-[16px] shadow-[var(--shadow-sm)]'
  const containerBgClasses = bgGray
    ? 'md:bg-(--color-surface-raised) bg-(--color-surface-muted)'
    : 'border border-(--color-border-subtle) bg-(--color-surface-raised)'
  const containerClasses = `${containerBaseClasses} ${containerBgClasses} ${className}`

  const hasDescription = !!description
  const headerAlignment = hasDescription ? 'items-start' : 'items-center'
  const headerClasses = `flex ${headerAlignment} gap-[8px]`

  const iconWrapper = singleIcon ? (
    <div className="w-[20px] h-[20px] flex-shrink-0" style={{ color: iconColor }}>
      {icon}
    </div>
  ) : (
    <div
      className="w-[40px] h-[40px] rounded-[var(--radius-md)] flex items-center justify-center flex-shrink-0"
      style={{ backgroundColor: iconBgColor }}
    >
      <div className="w-[20px] h-[20px]" style={{ color: iconColor }}>
        {icon}
      </div>
    </div>
  )

  const textContent = (
    <div className="flex flex-col gap-0">
      <h3 className="text-h3 text-(--color-text-primary)">{title}</h3>
      {description && (
        <p className="md:text-[14px] text-[12px] font-medium text-(--color-text-secondary) text-left">
          {description}
        </p>
      )}
    </div>
  )

  return (
    <div className={containerClasses}>
      <div className={headerClasses}>
        {iconWrapper}
        {textContent}
      </div>

      {paragraph && (
        <p className="text-(--color-text-secondary) text-[14px] font-medium text-left mt-1 mb-4">
          {paragraph}
        </p>
      )}

      {children}
    </div>
  )
}
