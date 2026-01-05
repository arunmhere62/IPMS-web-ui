import { toast } from 'sonner'

type AnyRecord = Record<string, any>

const coerceString = (v: unknown): string | undefined => {
  if (typeof v === 'string') return v
  if (v == null) return undefined
  try {
    return String(v)
  } catch {
    return undefined
  }
}

const tryParseJson = (v: unknown): AnyRecord | undefined => {
  if (typeof v !== 'string') return undefined
  const s = v.trim()
  if (!s) return undefined
  if (!(s.startsWith('{') || s.startsWith('['))) return undefined
  try {
    const parsed = JSON.parse(s)
    return (parsed && typeof parsed === 'object') ? (parsed as AnyRecord) : undefined
  } catch {
    return undefined
  }
}

const extractMessageFromUnknown = (value: unknown): string | undefined => {
  if (value == null) return undefined

  if (typeof value === 'string') {
    const parsed = tryParseJson(value)
    if (parsed) return extractMessageFromUnknown(parsed)
    return value
  }

  if (value instanceof Error) return coerceString(value.message)

  if (typeof value !== 'object') return coerceString(value)

  const v = value as AnyRecord

  const direct =
    coerceString(v.message) ||
    coerceString(v.error_description) ||
    coerceString(v.detail) ||
    coerceString(v.title)

  if (direct) return direct

  const data = v.data
  const fromData =
    coerceString((data as any)?.message) ||
    coerceString((data as any)?.error) ||
    coerceString((data as any)?.detail)
  if (fromData) return fromData

  const nested = v.error
  const fromNested = extractMessageFromUnknown(nested)
  if (fromNested) return fromNested

  const resp = v.response
  const fromResponse = extractMessageFromUnknown(resp)
  if (fromResponse) return fromResponse

  return undefined
}

export const extractErrorMessage = (err: unknown, fallback = 'Something went wrong') => {
  return extractMessageFromUnknown(err) || fallback
}

export const showErrorToast = (err: unknown, fallback?: string) => {
  toast.error(extractErrorMessage(err, fallback))
}

export const showSuccessToast = (message: unknown, fallback = 'Success') => {
  toast.success(coerceString(message) || fallback)
}

/**
 * Mobile-compatible API: showSuccessAlert
 * Accepts either a string message or an API response-like object with `message`/`data.message`.
 */
export const showSuccessAlert = (
  messageOrResponse: string | unknown,
  options?: {
    title?: string
    okText?: string
    onOk?: () => void
  }
): void => {
  const title = options?.title || 'Success'

  let message: string
  if (typeof messageOrResponse === 'string') {
    message = messageOrResponse
  } else if (messageOrResponse && typeof messageOrResponse === 'object') {
    const obj = messageOrResponse as AnyRecord
    message =
      coerceString(obj.message) ||
      (obj.data && typeof obj.data === 'object' ? coerceString((obj.data as AnyRecord).message) : undefined) ||
      'Operation completed successfully'
  } else {
    message = 'Operation completed successfully'
  }

  if (options?.onOk) {
    options.onOk()
  }

  toast.success(title, { description: message })
}

/**
 * Mobile-compatible API: showErrorAlert
 * Usage: showErrorAlert(error, 'Delete Error')
 */
export const showErrorAlert = (error: unknown, title: string = 'Error'): void => {
  if (typeof error === 'string') {
    toast.error(title, { description: error })
    return
  }

  const message = extractErrorMessage(error, 'An error occurred. Please try again.')
  toast.error(title, { description: message })
}
