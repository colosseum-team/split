interface AuroraBackdropProps {
  className?: string
}

export function AuroraBackdrop({ className = '' }: AuroraBackdropProps) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <div className="absolute -top-24 -left-20 h-120 w-120 rounded-full bg-(--color-decor-peach) blur-3xl" />
      <div className="absolute top-20 -right-24 h-80 w-80 rounded-full bg-(--color-decor-mint) blur-3xl" />
      <div className="absolute bottom-0 left-1/2 hidden h-100 w-100 -translate-x-1/2 rounded-full bg-(--color-decor-lavender) blur-3xl md:block" />
    </div>
  )
}
