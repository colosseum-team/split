import { type FC, useRef, useState } from 'react'
import {
  ChatBubbleLeftRightIcon,
  ClockIcon,
  DocumentArrowUpIcon,
  PaperClipIcon,
} from '@heroicons/react/24/outline'
import type { Contract } from '@/entities/contract'
import { addDisputeCalendarDays, calendarDaysRemaining, formatDueLabel } from '@/entities/contract'
import { Button } from '@/shared/ui'

const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED_MIME = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
])

type DisputeWorkspaceProps = {
  contract: Contract
  viewerSide: 'customer' | 'performer' | null
  onSaveComment: (body: string) => void
  onAddAttachments: (
    files: Array<{ fileName: string; mimeType: string; sizeBytes: number }>,
  ) => void
}

export const DisputeWorkspace: FC<DisputeWorkspaceProps> = ({
  contract,
  viewerSide,
  onSaveComment,
  onAddAttachments,
}) => {
  const [draft, setDraft] = useState('')
  const [fileHint, setFileHint] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const openedIso =
    contract.disputeOpenedAt ?? (contract.status === 'DISPUTED' ? contract.updatedAt : undefined)
  const dueIso =
    contract.disputeDueAt ??
    (openedIso
      ? addDisputeCalendarDays(
          new Date(openedIso),
          contract.disputeResolutionDays ?? 7,
        ).toISOString()
      : undefined)

  const daysLeft = dueIso ? calendarDaysRemaining(dueIso) : null
  const windowExpired = daysLeft !== null && daysLeft < 0
  const canCompose = viewerSide !== null && contract.status === 'DISPUTED' && !windowExpired

  const messages = contract.disputeMessages ?? []
  const attachments = contract.disputeAttachments ?? []

  const handleFiles = (list: FileList | null) => {
    setFileHint('')
    if (!list?.length || !canCompose) return
    const accepted: Array<{ fileName: string; mimeType: string; sizeBytes: number }> = []
    for (let i = 0; i < list.length; i++) {
      const f = list[i]
      if (f.size > MAX_BYTES) {
        setFileHint(`“${f.name}” exceeds 5 MB.`)
        return
      }
      const mime = f.type || 'application/octet-stream'
      if (!ALLOWED_MIME.has(mime)) {
        setFileHint(`“${f.name}”: use PDF or common images only.`)
        return
      }
      accepted.push({ fileName: f.name, mimeType: mime, sizeBytes: f.size })
    }
    if (accepted.length) onAddAttachments(accepted)
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleSave = () => {
    if (!canCompose) return
    const t = draft.trim()
    if (!t) return
    onSaveComment(t)
    setDraft('')
  }

  const fmtKb = (n: number) => (n < 1024 ? `${n} B` : `${(n / 1024).toFixed(1)} KB`)

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-h2 text-(--color-text-primary)">Dispute</h2>
        <p className="text-body text-(--color-text-secondary)">
          Opened from the customer side. Parties should exchange materials within the agreed
          calendar window ({contract.disputeResolutionDays ?? 7} days).
        </p>
      </div>

      <div className="flex flex-wrap gap-4 rounded-[var(--radius-xl)] border border-(--color-border-subtle) bg-(--color-surface-raised)/90 px-4 py-4 shadow-[var(--shadow-sm)] backdrop-blur-sm">
        <div className="flex min-w-[140px] flex-1 items-start gap-3">
          <ClockIcon className="mt-0.5 h-5 w-5 shrink-0 text-(--color-text-muted)" aria-hidden />
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-(--color-text-muted)">
              Opened
            </p>
            <p className="text-[14px] font-semibold text-(--color-text-primary)">
              {openedIso ? formatDueLabel(openedIso) : '—'}
            </p>
          </div>
        </div>
        <div className="flex min-w-[140px] flex-1 items-start gap-3">
          <ClockIcon className="mt-0.5 h-5 w-5 shrink-0 text-(--color-text-muted)" aria-hidden />
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-(--color-text-muted)">
              Respond by
            </p>
            <p className="text-[14px] font-semibold text-(--color-text-primary)">
              {dueIso ? formatDueLabel(dueIso) : '—'}
            </p>
          </div>
        </div>
        <div className="flex min-w-[120px] flex-1 items-start gap-3">
          <ChatBubbleLeftRightIcon
            className="mt-0.5 h-5 w-5 shrink-0 text-(--color-text-muted)"
            aria-hidden
          />
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-(--color-text-muted)">
              Days left
            </p>
            <p
              className={`text-[14px] font-semibold ${windowExpired ? 'text-(--color-state-danger)' : 'text-(--color-text-primary)'}`}
            >
              {daysLeft === null ? '—' : windowExpired ? 'Window ended' : daysLeft}
            </p>
          </div>
        </div>
      </div>

      <aside
        className="rounded-[var(--radius-xl)] border border-amber-200/90 bg-amber-50/95 px-4 py-3 text-[13px] leading-relaxed text-amber-950 shadow-[var(--shadow-sm)]"
        role="note"
      >
        <p className="font-bold text-[12px] uppercase tracking-wide text-amber-900/95">
          Disclaimer
        </p>
        <p className="mt-2">
          Submissions here are for documenting each party&apos;s position in this demo. They do not
          constitute legal advice. The platform does not adjudicate disputes in this MVP —
          resolution follows your agreement and any future arbitration process. Do not upload
          confidential data you are not permitted to share.
        </p>
      </aside>

      {messages.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-[15px] font-bold text-(--color-text-primary)">Conversation</h3>
          <ul className="flex flex-col gap-3">
            {messages.map((m) => (
              <li
                key={m.id}
                className="rounded-[var(--radius-lg)] border border-(--color-border-subtle) bg-white/75 px-4 py-3 shadow-[var(--shadow-sm)] backdrop-blur-sm"
              >
                <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[12px] font-bold uppercase tracking-wide text-(--color-brand)">
                    {m.side === 'customer' ? 'Customer' : 'Performer'}
                  </span>
                  <span className="text-[12px] text-(--color-text-muted)">
                    {formatDueLabel(m.createdAt)}
                  </span>
                </div>
                <p className="whitespace-pre-wrap text-body text-(--color-text-primary)">
                  {m.body}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="space-y-3">
        <h3 className="text-[15px] font-bold text-(--color-text-primary)">Attachments</h3>
        {attachments.length === 0 ? (
          <p className="text-body text-(--color-text-muted)">No files yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {attachments.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-(--color-border-subtle) bg-(--color-surface-raised) px-3 py-2 text-[13px]"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <PaperClipIcon
                    className="h-4 w-4 shrink-0 text-(--color-text-muted)"
                    aria-hidden
                  />
                  <span className="truncate font-medium text-(--color-text-primary)">
                    {a.fileName}
                  </span>
                </span>
                <span className="shrink-0 text-(--color-text-muted)">{fmtKb(a.sizeBytes)}</span>
              </li>
            ))}
          </ul>
        )}
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <Button
          type="button"
          variant="secondary"
          size="md"
          disabled={!canCompose}
          onClick={() => inputRef.current?.click()}
          className="inline-flex w-fit items-center gap-2"
        >
          <DocumentArrowUpIcon className="h-5 w-5" aria-hidden />
          Add files
        </Button>
        {fileHint ? <p className="text-[13px] text-(--color-state-danger)">{fileHint}</p> : null}
        {!canCompose && viewerSide && windowExpired ? (
          <p className="text-[13px] text-(--color-text-muted)">
            The exchange window has ended (demo). New uploads and comments are disabled.
          </p>
        ) : null}
      </div>

      <div className="space-y-3 rounded-[var(--radius-xl)] border border-(--color-border-subtle) bg-white/70 p-4 shadow-[var(--shadow-sm)] backdrop-blur-md">
        <label
          className="block text-[14px] font-bold text-(--color-text-primary)"
          htmlFor="dispute-comment"
        >
          Comment
        </label>
        <textarea
          id="dispute-comment"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          disabled={!canCompose}
          placeholder={
            viewerSide
              ? 'Describe your position or response…'
              : 'Connect with a party wallet to participate.'
          }
          rows={5}
          className="w-full rounded-[var(--radius-md)] border border-(--color-border-subtle) bg-(--color-surface-base) px-3 py-2 text-[14px] text-(--color-text-primary) placeholder:text-(--color-text-muted) disabled:opacity-60"
        />
        <Button
          type="button"
          variant="primary"
          size="md"
          disabled={!canCompose || !draft.trim()}
          onClick={handleSave}
          className="w-full sm:w-auto"
        >
          Save
        </Button>
      </div>
    </section>
  )
}
