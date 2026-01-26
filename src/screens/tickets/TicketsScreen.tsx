import { useMemo, useState } from 'react'
import { CircleAlert, Plus, Search, Ticket as TicketIcon } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { PageHeader } from '@/components/form/page-header'
import { AppDialog } from '@/components/form/app-dialog'

import { useAppSelector } from '@/store/hooks'
import {
  useCreateTicketMutation,
  useGetTicketsQuery,
  type CreateTicketData,
  type Ticket,
} from '@/services/ticketsApi'
import { showErrorAlert, showSuccessAlert } from '@/utils/toast'

type ErrorLike = {
  data?: {
    message?: string
  }
  message?: string
}

export function TicketsScreen() {
  const selectedPGLocationId = useAppSelector((s) => (s as any).pgLocations?.selectedPGLocationId) as number | null

  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const limit = 20

  const [dialogOpen, setDialogOpen] = useState(false)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<CreateTicketData['category']>('BUG')
  const [priority, setPriority] = useState<CreateTicketData['priority']>('MEDIUM')

  const {
    data: ticketsResponse,
    isLoading,
    error,
    refetch,
  } = useGetTicketsQuery({
    page,
    limit,
    search: query.trim() ? query.trim() : undefined,
    pg_id: selectedPGLocationId ?? undefined,
    my_tickets: true,
  } as any)

  const [createTicket, { isLoading: creating }] = useCreateTicketMutation()

  const tickets: Ticket[] = useMemo(() => (Array.isArray((ticketsResponse as any)?.data) ? ((ticketsResponse as any).data as Ticket[]) : []), [ticketsResponse])

  const pagination = (ticketsResponse as any)?.pagination as
    | {
        total?: number
        page?: number
        limit?: number
        totalPages?: number
        hasMore?: boolean
      }
    | undefined

  const total = Number(pagination?.total ?? tickets.length)
  const totalPages = Number(pagination?.totalPages ?? (pagination?.hasMore ? page + 1 : 1))

  const fetchErrorMessage = (error as ErrorLike | undefined)?.data?.message || (error as ErrorLike | undefined)?.message

  const canPrev = page > 1
  const canNext = Boolean(pagination?.hasMore) || (Number.isFinite(totalPages) && page < totalPages)

  const openCreate = () => {
    setTitle('')
    setDescription('')
    setCategory('BUG')
    setPriority('MEDIUM')
    setDialogOpen(true)
  }

  const submitCreate = async () => {
    if (!title.trim()) {
      showErrorAlert('Title is required', 'Validation')
      return
    }
    if (!description.trim()) {
      showErrorAlert('Description is required', 'Validation')
      return
    }

    try {
      await createTicket({
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
        pg_id: selectedPGLocationId ?? undefined,
      }).unwrap()
      showSuccessAlert('Ticket created')
      setDialogOpen(false)
      void refetch()
    } catch (e: unknown) {
      showErrorAlert(e, 'Create Ticket Error')
    }
  }

  const countLabel = useMemo(() => {
    if (Number.isFinite(total) && total > 0) return `${total} Tickets`
    return `${tickets.length} Tickets`
  }, [tickets.length, total])

  return (
    <div className='container mx-auto max-w-6xl px-3 py-6'>
      <PageHeader
        title='Tickets'
        subtitle='Report issues and track status'
        right={
          <>
            <Button type='button' size='icon' onClick={openCreate} aria-label='Create ticket' title='Create ticket'>
              <Plus className='size-4' />
            </Button>
            <Button variant='outline' size='sm' onClick={() => refetch()}>
              Refresh
            </Button>
          </>
        }
      />

      {fetchErrorMessage ? (
        <div className='mt-6'>
          <Alert variant='destructive'>
            <CircleAlert />
            <AlertTitle>Failed to load tickets</AlertTitle>
            <AlertDescription>{fetchErrorMessage}</AlertDescription>
          </Alert>
        </div>
      ) : null}

      <div className='mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
        <div className='relative w-full sm:max-w-xs'>
          <Search className='pointer-events-none absolute left-2.5 top-2 size-4 text-muted-foreground' />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setPage(1)
            }}
            placeholder='Search tickets'
            className='h-8 pl-8 text-sm'
          />
        </div>

        <Badge variant='secondary' className='h-7 px-2 text-xs'>
          {countLabel}
        </Badge>
      </div>

      <div className='mt-4'>
        {isLoading ? (
          <div className='rounded-md border bg-card px-3 py-4 text-sm text-muted-foreground'>Loading...</div>
        ) : tickets.length === 0 ? (
          <div className='rounded-md border bg-card px-3 py-8 text-center'>
            <div className='mx-auto flex size-12 items-center justify-center rounded-full bg-muted'>
              <TicketIcon className='size-6 text-muted-foreground' />
            </div>
            <div className='mt-3 text-base font-semibold'>No Tickets</div>
            <div className='mt-1 text-xs text-muted-foreground'>Create a ticket to report an issue.</div>
            <div className='mt-4'>
              <Button onClick={openCreate}>Create Ticket</Button>
            </div>
          </div>
        ) : (
          <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
            {tickets.map((t) => (
              <Card key={t.s_no} className='h-full'>
                <CardContent className='flex h-full flex-col gap-2 p-3'>
                  <div className='flex items-start justify-between gap-3'>
                    <div className='min-w-0'>
                      <div className='truncate text-sm font-semibold'>{t.title}</div>
                      <div className='mt-0.5 line-clamp-3 text-xs text-muted-foreground'>{t.description}</div>
                    </div>
                    <Badge variant='outline' className='shrink-0 px-2 text-xs'>
                      #{t.ticket_number || t.s_no}
                    </Badge>
                  </div>

                  <div className='flex flex-wrap items-center gap-2'>
                    <Badge variant='secondary' className='h-6 px-2 text-[10px]'>
                      {String(t.status || 'OPEN')}
                    </Badge>
                    <Badge variant='outline' className='h-6 px-2 text-[10px]'>
                      {String(t.priority || '')}
                    </Badge>
                    <Badge variant='outline' className='h-6 px-2 text-[10px]'>
                      {String(t.category || '')}
                    </Badge>
                  </div>

                  <div className='mt-auto pt-2 text-xs text-muted-foreground'>
                    {t.created_at ? String(t.created_at).split('T')[0] : ''}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className='mt-5 flex items-center justify-between gap-2'>
          <Button variant='outline' size='sm' disabled={!canPrev} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            Prev
          </Button>
          <div className='text-xs text-muted-foreground'>
            Page {page}
            {Number.isFinite(totalPages) && totalPages > 0 ? ` / ${totalPages}` : ''}
          </div>
          <Button variant='outline' size='sm' disabled={!canNext} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      </div>

      <AppDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title='Create Ticket'
        description='Report an issue or request help'
        size='md'
        footer={
          <div className='flex w-full justify-end gap-2 px-3 pb-3'>
            <Button type='button' variant='outline' onClick={() => setDialogOpen(false)} disabled={creating}>
              Cancel
            </Button>
            <Button type='button' onClick={() => void submitCreate()} disabled={creating}>
              {creating ? 'Creating...' : 'Create'}
            </Button>
          </div>
        }
      >
        <div className='grid gap-3'>
          <div className='grid gap-2'>
            <div className='text-sm font-medium'>Title</div>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder='Short summary' />
          </div>

          <div className='grid gap-2'>
            <div className='text-sm font-medium'>Description</div>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder='Describe the issue...' />
          </div>

          <div className='grid gap-3 sm:grid-cols-2'>
            <div className='grid gap-2'>
              <div className='text-sm font-medium'>Category</div>
              <Select value={category} onValueChange={(v) => setCategory(v as any)} disabled={creating}>
                <SelectTrigger>
                  <SelectValue placeholder='Select category' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='BUG'>Bug</SelectItem>
                  <SelectItem value='FEATURE_REQUEST'>Feature Request</SelectItem>
                  <SelectItem value='SUPPORT'>Support</SelectItem>
                  <SelectItem value='OTHER'>Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='grid gap-2'>
              <div className='text-sm font-medium'>Priority</div>
              <Select value={priority} onValueChange={(v) => setPriority(v as any)} disabled={creating}>
                <SelectTrigger>
                  <SelectValue placeholder='Select priority' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='LOW'>Low</SelectItem>
                  <SelectItem value='MEDIUM'>Medium</SelectItem>
                  <SelectItem value='HIGH'>High</SelectItem>
                  <SelectItem value='CRITICAL'>Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </AppDialog>
    </div>
  )
}
