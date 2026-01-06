import * as React from 'react'
import { ImagePlus, Trash2, UploadCloud } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useUploadToS3Mutation } from '@/services/storageApi'
import { showErrorToast } from '@/utils/toast'

export type ImageUploadS3Props = {
  images: string[]
  onImagesChange: (images: string[]) => void
  maxImages?: number
  label?: string
  disabled?: boolean
  folder?: string
  useS3?: boolean
  entityId?: string
  autoSave?: boolean
  onAutoSave?: (images: string[]) => Promise<void>
  className?: string
}

const cleanImages = (imageArray: string[]) => {
  return imageArray.filter((uri) => uri && uri.trim() !== '' && uri !== 'undefined' && uri !== 'null')
}

const generateUniqueFileName = (baseName: string, prefix: string) => {
  const timestamp = Date.now()
  const random = Math.random().toString(36).slice(2, 10)
  const safePrefix = (prefix || 'file').replace(/[^a-zA-Z0-9_-]/g, '_')
  const safeName = (baseName || 'file').replace(/[^a-zA-Z0-9._-]/g, '_')
  return `${safePrefix}_${timestamp}_${random}_${safeName}`
}

const base64SizeBytes = (dataUriOrBase64: string) => {
  const base64 = dataUriOrBase64.includes('base64,') ? dataUriOrBase64.split('base64,')[1] : dataUriOrBase64
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0
  return Math.floor((base64.length * 3) / 4) - padding
}

const validateBase64FileSize = (dataUriOrBase64: string, maxSizeMB: number) => {
  try {
    const bytes = base64SizeBytes(dataUriOrBase64)
    return bytes <= maxSizeMB * 1024 * 1024
  } catch {
    return false
  }
}

const fileToDataUrl = (file: File) => {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Failed to read image'))
    reader.onload = () => resolve(String(reader.result))
    reader.readAsDataURL(file)
  })
}

const loadImage = (src: string) => {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = src
  })
}

const canvasToDataUrl = (canvas: HTMLCanvasElement, quality: number) => {
  return canvas.toDataURL('image/jpeg', quality)
}

const compressImageToTarget = async (file: File, targetBytes: number) => {
  const dataUrl = await fileToDataUrl(file)
  const img = await loadImage(dataUrl)

  let width = Math.min(1280, img.naturalWidth || 1280)
  let height = Math.round((width / (img.naturalWidth || width)) * (img.naturalHeight || width))
  let quality = 0.8
  const minQuality = 0.2

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported')

  for (let attempt = 0; attempt < 8; attempt++) {
    canvas.width = width
    canvas.height = height
    ctx.clearRect(0, 0, width, height)
    ctx.drawImage(img, 0, 0, width, height)

    const out = canvasToDataUrl(canvas, quality)
    const bytes = base64SizeBytes(out)

    if (bytes <= targetBytes) return out

    if (quality > minQuality) {
      quality = Math.max(minQuality, quality - 0.15)
    } else {
      width = Math.max(640, Math.round(width * 0.85))
      height = Math.round((width / (img.naturalWidth || width)) * (img.naturalHeight || width))
    }
  }

  canvas.width = 640
  canvas.height = Math.round((640 / (img.naturalWidth || 640)) * (img.naturalHeight || 640))
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  return canvasToDataUrl(canvas, 0.2)
}

export function ImageUploadS3({
  images,
  onImagesChange,
  maxImages = 5,
  label = 'Images',
  disabled = false,
  folder = 'rooms/images',
  useS3 = true,
  entityId,
  autoSave = false,
  onAutoSave,
  className,
}: ImageUploadS3Props) {
  const [uploading, setUploading] = React.useState(false)
  const [uploadProgress, setUploadProgress] = React.useState<Record<number, number>>({})
  const [uploadToS3Mutation] = useUploadToS3Mutation()
  const inputRef = React.useRef<HTMLInputElement | null>(null)

  const safeImages = React.useMemo(() => cleanImages(images || []), [images])

  React.useEffect(() => {
    if (safeImages.length !== (images || []).length) {
      onImagesChange(safeImages)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeImages.length])

  const canAddMore = !disabled && safeImages.length < maxImages

  const uploadToS3 = async (dataUrl: string, index: number) => {
    setUploadProgress((prev) => ({ ...prev, [index]: 0 }))

    const fileName = generateUniqueFileName(`image_${Date.now()}.jpg`, entityId ? `entity_${entityId}` : 'image')

    const result = await uploadToS3Mutation({
      file: dataUrl,
      options: { folder, fileName, isPublic: true },
    }).unwrap()

    setUploadProgress((prev) => ({ ...prev, [index]: 100 }))

    window.setTimeout(() => {
      setUploadProgress((prev) => {
        const next = { ...prev }
        delete next[index]
        return next
      })
    }, 1000)

    if (result.success && result.url) return result.url
    throw new Error(result.error || 'Upload failed')
  }

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || disabled) return
    if (!useS3) {
      showErrorToast('S3 uploads are disabled')
      return
    }

    const remainingSlots = maxImages - safeImages.length
    if (remainingSlots <= 0) return

    const files = Array.from(fileList)
      .filter((f) => f.type.startsWith('image/'))
      .slice(0, remainingSlots)

    if (files.length === 0) return

    setUploading(true)
    try {
      const baseIndex = safeImages.length

      const uploadedUrls = await Promise.all(
        files.map(async (file, i) => {
          const slotIndex = baseIndex + i
          const compressed = await compressImageToTarget(file, 110 * 1024)
          if (!validateBase64FileSize(compressed, 0.25)) {
            throw new Error('Image is too large even after compression. Please choose a smaller image.')
          }
          return await uploadToS3(compressed, slotIndex)
        })
      )

      const nextImages = cleanImages([...safeImages, ...uploadedUrls])
      onImagesChange(nextImages)

      if (autoSave && onAutoSave) {
        await onAutoSave(nextImages)
      }
    } catch (err) {
      showErrorToast(err, 'Upload failed')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const removeImage = async (index: number) => {
    if (disabled) return
    const nextImages = cleanImages(safeImages.filter((_, i) => i !== index))
    onImagesChange(nextImages)

    if (autoSave && onAutoSave) {
      try {
        await onAutoSave(nextImages)
      } catch (err) {
        showErrorToast(err, 'Failed to save image changes')
      }
    }
  }

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className='flex items-center justify-between gap-2'>
        <div className='text-sm font-medium'>{label}</div>
        <div className='text-xs text-muted-foreground'>
          {safeImages.length} / {maxImages}
        </div>
      </div>

      <input
        ref={inputRef}
        type='file'
        accept='image/*'
        multiple={maxImages > 1}
        className='hidden'
        disabled={disabled}
        onChange={(e) => void handleFiles(e.target.files)}
      />

      <div className='flex flex-wrap gap-3'>
        {safeImages.map((url, index) => {
          const progress = uploadProgress[index]
          return (
            <div
              key={`${index}-${url.substring(0, 24)}`}
              className='relative h-24 w-24 overflow-hidden rounded-md border bg-muted'
            >
              <img src={url} alt='' className='h-full w-full object-cover' />

              {progress !== undefined && progress < 100 ? (
                <div className='absolute inset-0 grid place-items-center bg-black/50 text-xs text-white'>
                  {progress}%
                </div>
              ) : null}

              {!disabled ? (
                <Button
                  type='button'
                  size='icon'
                  variant='destructive'
                  className='absolute right-1 top-1 h-7 w-7'
                  onClick={() => void removeImage(index)}
                  aria-label='Remove image'
                  title='Remove image'
                >
                  <Trash2 className='size-4' />
                </Button>
              ) : null}
            </div>
          )
        })}

        {canAddMore ? (
          <button
            type='button'
            className={cn(
              'flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-md border bg-background text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
              uploading && 'pointer-events-none opacity-60'
            )}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? <UploadCloud className='size-5' /> : <ImagePlus className='size-5' />}
            <span>{uploading ? 'Uploading' : 'Add'}</span>
          </button>
        ) : null}
      </div>

      {!disabled && safeImages.length === 0 ? (
        <div className='text-xs text-muted-foreground'>Tap “Add” to upload {label.toLowerCase()}.</div>
      ) : null}
    </div>
  )
}
