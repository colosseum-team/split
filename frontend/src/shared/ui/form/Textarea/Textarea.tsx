import type { CSSProperties, FocusEvent, TextareaHTMLAttributes } from 'react'
import { forwardRef, useId, useState } from 'react'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  resize?: 'none' | 'vertical' | 'horizontal' | 'both'
  error?: string
  helperText?: string
  requiredErrorPosition?: 'top-right' | 'bottom'
  showRequiredError?: boolean
  activeColor?: string
  /** Растягивать textarea на всю высоту доступного контейнера (height:100%) */
  fillHeight?: boolean
  /** Принудительная min-height (например '200px' или 'auto') */
  minHeight?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      resize = 'vertical',
      error,
      helperText,
      requiredErrorPosition = 'bottom',
      showRequiredError = false,
      className = '',
      activeColor = 'var(--color-brand)',
      fillHeight = false,
      minHeight,
      onBlur,
      onFocus,
      ...props
    },
    ref,
  ) => {
    const [hasInteracted, setHasInteracted] = useState(false)
    const [isFocused, setIsFocused] = useState(false)
    const reactId = useId()

    const resizeClasses = {
      none: 'resize-none',
      vertical: 'resize-y',
      horizontal: 'resize-x',
      both: 'resize',
    }

    const value = props.value as string | undefined
    const isEmpty = !value || value === ''
    const isFilled = !isEmpty && !isFocused
    const isActive = isFocused

    const shouldShowRequiredError = props.required && showRequiredError && hasInteracted && isEmpty
    const shouldShowError = error && hasInteracted

    const borderStyle: CSSProperties = {}
    let textareaStateClasses: string
    if (error && hasInteracted) {
      textareaStateClasses =
        'bg-(--color-surface-raised) border-2 border-(--color-state-danger) text-(--color-text-primary)'
    } else if (isActive) {
      textareaStateClasses =
        'bg-(--color-surface-muted) border-2 text-(--color-text-primary) placeholder:font-medium placeholder:text-[14px] placeholder:text-(--color-text-muted)'
      borderStyle.borderColor = activeColor
    } else if (isFilled) {
      textareaStateClasses =
        'bg-(--color-surface-muted) border-2 border-(--color-border-subtle) text-(--color-text-primary)'
    } else {
      textareaStateClasses =
        'bg-(--color-surface-muted) border-2 border-(--color-border-subtle) placeholder:font-medium placeholder:text-[14px] placeholder:text-(--color-text-muted)'
    }

    const heightClass = fillHeight ? 'h-full flex-1' : ''
    const computedMinHeight = minHeight ?? (fillHeight ? '0' : '160px')
    if (computedMinHeight) {
      borderStyle.minHeight = computedMinHeight
    }

    const textareaClasses = `w-full rounded-[var(--radius-lg)] px-3 py-2 focus:outline-none transition-colors ${
      fillHeight ? 'resize-none' : resizeClasses[resize]
    } ${heightClass} ${textareaStateClasses} ${className}`

    const handleBlur = (e: FocusEvent<HTMLTextAreaElement>) => {
      setHasInteracted(true)
      setIsFocused(false)
      onBlur?.(e)
    }

    const handleFocus = (e: FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(true)
      onFocus?.(e)
    }

    const textareaId =
      props.id ||
      props.name ||
      (label ? `textarea-${label.toLowerCase().replace(/\s+/g, '-')}` : `textarea-${reactId}`)

    const containerClasses = `w-full relative ${fillHeight ? 'flex flex-col flex-1 min-h-0' : ''}`

    return (
      <div className={containerClasses}>
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-[14px] font-bold text-(--color-text-primary) mb-2"
          >
            {label}
            {props.required && <span className="text-(--color-state-danger) ml-1">*</span>}
          </label>
        )}

        {shouldShowRequiredError && requiredErrorPosition === 'top-right' && (
          <div className="absolute top-0 right-0 text-[12px] text-(--color-state-danger)">
            Required
          </div>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          aria-label={label || props['aria-label'] || (props.placeholder as string) || 'Textarea'}
          className={textareaClasses}
          style={borderStyle}
          onBlur={handleBlur}
          onFocus={handleFocus}
          {...props}
        />

        {shouldShowRequiredError && requiredErrorPosition === 'bottom' && (
          <p className="mt-1 text-[14px] text-(--color-state-danger)">
            This field cannot be left blank
          </p>
        )}

        {shouldShowError && <p className="mt-1 text-sm text-(--color-state-danger)">{error}</p>}

        {helperText && !error && !shouldShowRequiredError && (
          <p className="mt-1 text-sm text-(--color-text-secondary)">{helperText}</p>
        )}
      </div>
    )
  },
)

Textarea.displayName = 'Textarea'
