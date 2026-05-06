import type { CSSProperties, FocusEvent, InputHTMLAttributes } from 'react'
import { forwardRef, useId, useState } from 'react'
import { PencilIcon } from '@heroicons/react/24/outline'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  requiredErrorPosition?: 'top-right' | 'bottom'
  showRequiredError?: boolean
  confirmEdit?: boolean
  bold?: boolean
  activeBorderColor?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      requiredErrorPosition = 'bottom',
      showRequiredError = false,
      confirmEdit = false,
      activeBorderColor,
      className = '',
      onBlur,
      onFocus,
      ...props
    },
    ref,
  ) => {
    const [hasInteracted, setHasInteracted] = useState(false)
    const [isFocused, setIsFocused] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const reactId = useId()

    const value = props.value as string | undefined
    const isEmpty = !value || value === ''
    const isFilled = !isEmpty && !isFocused
    const isActive = isFocused

    const hasValidationError =
      (props.required && isEmpty && hasInteracted) || (error && hasInteracted)
    const shouldShowRequiredError = props.required && showRequiredError && hasInteracted && isEmpty
    const shouldShowError = error && hasInteracted

    const borderStyle: CSSProperties = {}
    let inputStateClasses: string
    if (hasValidationError) {
      inputStateClasses =
        'bg-[var(--color-bg-secondary)] md:bg-[var(--color-input-bg)] border border-[var(--color-input-warning)] text-[var(--color-text-dark-blue)] font-medium md:text-[16px] text-[14px]'
    } else if (isActive) {
      inputStateClasses =
        'bg-[var(--color-bg-secondary)] md:bg-[var(--color-input-bg)] border text-[var(--color-text-dark-blue)] font-medium md:text-[16px] text-[14px]'
      borderStyle.borderColor = activeBorderColor || 'var(--color-input-active)'
    } else if (isFilled) {
      inputStateClasses =
        'bg-[var(--color-bg-secondary)] md:bg-[var(--color-input-bg)] border border-[var(--color-border-tertiary)] text-[var(--color-text-dark-blue)] font-medium md:text-[16px] text-[14px]'
    } else {
      inputStateClasses =
        'bg-[var(--color-input-bg)] border border-[var(--color-input-border)] placeholder:text-[var(--color-input-text-placeholder)] font-medium md:text-[16px] text-[14px]'
    }

    const inputClasses = `w-full h-[53px] rounded-[16px] px-5 py-4 focus:outline-none transition-colors ${inputStateClasses} ${className}`

    const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
      setHasInteracted(true)
      setIsFocused(false)
      onBlur?.(e)
    }

    const handleFocus = (e: FocusEvent<HTMLInputElement>) => {
      setIsFocused(true)
      onFocus?.(e)
    }

    const handleEditClick = () => {
      setIsEditing(true)
      if (ref && typeof ref === 'object' && 'current' in ref && ref.current) {
        ref.current.focus()
      }
    }

    const isReadOnly = (confirmEdit && !isEditing) || props.readOnly

    const labelClasses = `block md:text-[16px] text-[14px] font-bold text-[var(--color-form-label-text)] mb-2`

    const inputId =
      props.id ||
      props.name ||
      (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : `input-${reactId}`)

    return (
      <div className="w-full relative">
        {label && (
          <label htmlFor={inputId} className={labelClasses}>
            {label}
            {props.required && <span className="text-[var(--color-text-warning)]">*</span>}
          </label>
        )}

        {shouldShowRequiredError && requiredErrorPosition === 'top-right' && (
          <div className="absolute top-0 right-0 md:text-[14px] text-[12px] text-[var(--color-text-warning)]">
            Required
          </div>
        )}

        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            aria-label={label || props['aria-label'] || (props.placeholder as string) || 'Input'}
            className={inputClasses}
            style={Object.keys(borderStyle).length > 0 ? borderStyle : undefined}
            onBlur={handleBlur}
            onFocus={handleFocus}
            readOnly={isReadOnly}
            {...props}
          />

          {confirmEdit && !isEditing && (
            <button
              type="button"
              onClick={handleEditClick}
              className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
              aria-label="Edit"
            >
              <PencilIcon className="w-[18px] h-[18px] text-[var(--color-edit-icon)]" />
            </button>
          )}
        </div>

        {hasValidationError && props.required && isEmpty && (
          <p className="mt-[12px] text-start font-normal md:text-[16px] text-[14px] text-[var(--color-input-warning)]">
            This field cannot be left blank
          </p>
        )}

        {shouldShowError && !(props.required && isEmpty) && (
          <p className="mt-[12px] text-start font-normal md:text-[16px] text-[14px] text-[var(--color-input-warning)]">
            {error}
          </p>
        )}

        {helperText && !hasValidationError && (
          <p className="mt-[12px] text-start font-normal md:text-[16px] text-[14px] text-[var(--color-text-primary)]">
            {helperText}
          </p>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'
