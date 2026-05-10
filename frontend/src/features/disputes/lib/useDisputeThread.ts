import { useCallback, useEffect, useState } from 'react'
import { useContractsStore, type Contract } from '@/entities/contract'
import { useUserStore } from '@/entities/user'
import { api, type BackendDisputeAttachmentDto } from '@/shared/api/client'
import { formatActionError } from '@/shared/api/errors'

interface UseDisputeThreadResult {
  isLoading: boolean
  loadError: string | null
  isPosting: boolean
  postError: string | null
  isUploading: boolean
  uploadError: string | null
  reload: () => Promise<void>
  postMessage: (body: string, attachmentIds?: string[]) => Promise<void>
  uploadAttachment: (file: File) => Promise<BackendDisputeAttachmentDto | null>
}

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result !== 'string') {
        reject(new Error('Could not read file'))
        return
      }
      // strip the `data:<mime>;base64,` prefix
      const comma = result.indexOf(',')
      resolve(comma >= 0 ? result.slice(comma + 1) : result)
    }
    reader.onerror = () => reject(reader.error ?? new Error('File read failed'))
    reader.readAsDataURL(file)
  })

// Backend-aware dispute thread state for a single contract.
// Loads `GET /contracts/:id/dispute` on mount, exposes mutators for posting
// messages and uploading attachments, and routes everything through the
// store so the rest of the SPA reflects the latest server view.
export function useDisputeThread(contract: Contract | null | undefined): UseDisputeThreadResult {
  const authToken = useUserStore((s) => s.authToken)
  const applyBackendContract = useContractsStore((s) => s.applyBackendContract)
  const setDisputeThread = useContractsStore((s) => s.setDisputeThread)
  const appendBackendDisputeMessage = useContractsStore((s) => s.appendBackendDisputeMessage)
  const appendBackendDisputeAttachment = useContractsStore((s) => s.appendBackendDisputeAttachment)

  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isPosting, setIsPosting] = useState(false)
  const [postError, setPostError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const localId = contract?.id
  const backendId = contract?.backendId
  const isDisputed = contract?.status === 'DISPUTED' || contract?.backendStatus === 'disputed'

  const reload = useCallback(async () => {
    if (!authToken || !backendId || !localId || !isDisputed) return
    setIsLoading(true)
    setLoadError(null)
    try {
      const bundle = await api.contracts.getDispute(authToken, backendId)
      applyBackendContract(localId, bundle.contract)
      setDisputeThread(localId, { messages: bundle.messages })
    } catch (err) {
      setLoadError(formatActionError(err))
    } finally {
      setIsLoading(false)
    }
  }, [authToken, backendId, localId, isDisputed, applyBackendContract, setDisputeThread])

  // Bootstrap the thread on mount / when the contract becomes disputed. We
  // keep the body identical to the manual `reload`, but inline it so the
  // `react-hooks/set-state-in-effect` rule sees the await boundary directly.
  useEffect(() => {
    if (!authToken || !backendId || !localId || !isDisputed) return
    let cancelled = false
    void (async () => {
      try {
        const bundle = await api.contracts.getDispute(authToken, backendId)
        if (cancelled) return
        applyBackendContract(localId, bundle.contract)
        setDisputeThread(localId, { messages: bundle.messages })
      } catch (err) {
        if (cancelled) return
        setLoadError(formatActionError(err))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [authToken, backendId, localId, isDisputed, applyBackendContract, setDisputeThread])

  const uploadAttachment = useCallback(
    async (file: File): Promise<BackendDisputeAttachmentDto | null> => {
      if (!authToken || !backendId || !localId) return null
      setIsUploading(true)
      setUploadError(null)
      try {
        const dataBase64 = await fileToBase64(file)
        const dto = await api.contracts.uploadDisputeAttachment(authToken, backendId, {
          fileName: file.name,
          mimeType: file.type || 'application/octet-stream',
          dataBase64,
        })
        appendBackendDisputeAttachment(localId, dto)
        return dto
      } catch (err) {
        setUploadError(formatActionError(err))
        return null
      } finally {
        setIsUploading(false)
      }
    },
    [authToken, backendId, localId, appendBackendDisputeAttachment],
  )

  const postMessage = useCallback(
    async (body: string, attachmentIds?: string[]) => {
      if (!authToken || !backendId || !localId) return
      const trimmed = body.trim()
      if (!trimmed) return
      setIsPosting(true)
      setPostError(null)
      try {
        const message = await api.contracts.postDisputeMessage(authToken, backendId, {
          body: trimmed,
          attachmentIds,
        })
        appendBackendDisputeMessage(localId, message)
      } catch (err) {
        setPostError(formatActionError(err))
      } finally {
        setIsPosting(false)
      }
    },
    [authToken, backendId, localId, appendBackendDisputeMessage],
  )

  return {
    isLoading,
    loadError,
    isPosting,
    postError,
    isUploading,
    uploadError,
    reload,
    postMessage,
    uploadAttachment,
  }
}

// Fetches a dispute attachment as a Blob and opens it in a new tab using
// `URL.createObjectURL`. The temporary object URL is revoked on next macrotask.
export async function openDisputeAttachment(
  authToken: string,
  contractBackendId: string,
  attachment: { id: string; mimeType: string },
): Promise<void> {
  const blob = await api.contracts.fetchDisputeAttachment(
    authToken,
    contractBackendId,
    attachment.id,
  )
  const typed = blob.type ? blob : new Blob([blob], { type: attachment.mimeType })
  const url = URL.createObjectURL(typed)
  window.open(url, '_blank', 'noopener,noreferrer')
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
