export interface ApiResponse<T = unknown> {
  success: boolean
  statusCode: number
  message: string
  data?: T
  error?: {
    code: string
    details?: unknown
  }
  timestamp: string
  path?: string
}

type AnyRecord = Record<string, unknown>

type WithMessage = { message?: unknown }

type MaybeApiResponse = AnyRecord & Partial<ApiResponse<unknown>>

export const extractResponseData = <T>(response: unknown): T => {
  if (response && typeof response === 'object') {
    const obj = response as MaybeApiResponse
    if ('success' in obj && 'statusCode' in obj) {
      return obj.data as T
    }
  }
  return response as T
}

export const isApiResponseSuccess = (response: unknown): boolean => {
  if (response && typeof response === 'object') {
    const obj = response as AnyRecord
    if ('success' in obj) {
      return obj.success === true
    }
  }
  return true
}

export const getApiErrorMessage = (response: unknown): string => {
  if (response && typeof response === 'object') {
    const obj = response as AnyRecord & WithMessage
    if (typeof obj.message === 'string') {
      return obj.message
    }
    const err = (obj as any).error
    if (err && typeof err === 'object') {
      const errObj = err as AnyRecord
      if (typeof errObj.message === 'string') return errObj.message
    }
  }
  return 'An error occurred'
}

export const extractPaginatedData = <T>(response: unknown): { data: T[]; pagination?: unknown } => {
  const data = extractResponseData<unknown>(response)

  if (data && typeof data === 'object') {
    const obj = data as AnyRecord
    if ('data' in obj && 'pagination' in obj) {
      return {
        data: Array.isArray(obj.data) ? (obj.data as T[]) : [],
        pagination: obj.pagination,
      }
    }
  }

  return {
    data: Array.isArray(data) ? (data as T[]) : [],
  }
}

export const transformApiResponse = <T>(response: ApiResponse<T>): T | null => {
  if (!response) return null

  if (!isApiResponseSuccess(response)) {
    const errorMessage = getApiErrorMessage(response)
    throw new Error(errorMessage)
  }

  return extractResponseData(response)
}
