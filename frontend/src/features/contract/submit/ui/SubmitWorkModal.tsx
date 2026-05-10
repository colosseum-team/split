import { type FC, useState } from 'react'
import { PaperAirplaneIcon } from '@heroicons/react/24/outline'
import { BottomModal, Button, Textarea } from '@/shared/ui'

interface SubmitWorkModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (payload: string) => void
  isSubmitting?: boolean
  error?: string | null
}

export const SubmitWorkModal: FC<SubmitWorkModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
  error,
}) => {
  const [payload, setPayload] = useState('')
  // React's "adjusting state on prop change" pattern — clear the textarea
  // each time the modal transitions from closed to open, without effects.
  const [lastOpen, setLastOpen] = useState(isOpen)
  if (isOpen !== lastOpen) {
    setLastOpen(isOpen)
    if (isOpen) setPayload('')
  }

  const handleSubmit = () => {
    onSubmit(payload)
  }

  const trimmed = payload.trim()
  const canSubmit = trimmed.length > 0 && !isSubmitting

  return (
    <BottomModal isOpen={isOpen} onClose={onClose} maxWidth="520">
      <div className="flex flex-col items-stretch gap-5">
        <div className="flex flex-col items-center gap-3">
          <div className="w-[64px] h-[64px] rounded-full bg-(--color-brand-accent) flex items-center justify-center">
            <PaperAirplaneIcon className="w-7 h-7 text-(--color-brand)" />
          </div>
          <div className="flex flex-col gap-1 text-center">
            <h2 className="text-h2 text-(--color-text-primary)">Submit work for review</h2>
            <p className="text-body text-(--color-text-secondary)">
              Describe what you delivered. You can paste a link, a commit hash, or a short summary
              of the deliverables. The customer will review and either approve or open a dispute.
            </p>
          </div>
        </div>

        <Textarea
          label="Submission"
          placeholder="e.g. https://github.com/acme/repo/pull/42 — landing page redesign delivered"
          value={payload}
          onChange={(e) => setPayload(e.target.value)}
          minHeight="160px"
        />

        {error && (
          <div className="w-full text-center text-[13px] font-medium text-(--color-state-danger)">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-2 w-full">
          <Button onClick={handleSubmit} disabled={!canSubmit} className="w-full">
            {isSubmitting ? 'Submitting…' : 'Submit work'}
          </Button>
          <Button onClick={onClose} variant="ghost" disabled={isSubmitting} className="w-full">
            Cancel
          </Button>
        </div>
      </div>
    </BottomModal>
  )
}
