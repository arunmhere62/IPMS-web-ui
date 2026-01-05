import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { TopNav } from '@/components/layout/top-nav'
import { ThemeSwitch } from '@/components/theme-switch'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useAddTicketCommentMutation,
  useGetTicketByIdQuery,
  useUpdateTicketMutation,
} from '@/store/tickets.api'

const STATUS_VARIANT: Record<string, any> = {
  OPEN: 'default',
  IN_PROGRESS: 'secondary',
  RESOLVED: 'outline',
  CLOSED: 'outline',
}

export function TicketDetailsScreen() {
  const navigate = useNavigate()
  const params = useParams()
  const id = useMemo(() => Number(params.id), [params.id])

  const { data, isLoading, isError } = useGetTicketByIdQuery(id, { skip: !id })
  const ticket = data?.data

  const [updateTicket, { isLoading: updating }] = useUpdateTicketMutation()
  const [addComment, { isLoading: commenting }] = useAddTicketCommentMutation()

  const [status, setStatus] = useState('')
  const [resolution, setResolution] = useState('')
  const [comment, setComment] = useState('')

  const statusValue = status || ticket?.status || ''

  const handleUpdate = async () => {
    if (!id) return
    await updateTicket({
      id,
      body: {
        status: statusValue as any,
        resolution: resolution || undefined,
      },
    }).unwrap()
  }

  const handleAddComment = async () => {
    if (!id) return
    const trimmed = comment.trim()
    if (!trimmed) return
    await addComment({ id, body: { comment: trimmed } }).unwrap()
    setComment('')
  }

  return (
    <>
      <Header>
        <TopNav links={topNav} />
        <div className='ms-auto flex items-center gap-2'>
          <Button variant='outline' onClick={() => navigate('/tickets')}>
            Back
          </Button>
          <ThemeSwitch />
        </div>
      </Header>

      <Main>
        {isLoading ? (
          <div className='grid gap-4'>
            <Skeleton className='h-10 w-80' />
            <Skeleton className='h-44 w-full' />
          </div>
        ) : isError || !ticket ? (
          <div className='text-sm text-destructive'>Ticket not found</div>
        ) : (
          <div className='grid gap-4'>
            <div className='flex flex-wrap items-start justify-between gap-3'>
              <div>
                <h1 className='text-2xl font-bold'>{ticket.title}</h1>
                <div className='mt-1 text-sm text-muted-foreground'>#{ticket.ticket_number}</div>
              </div>
              <Badge variant={STATUS_VARIANT[ticket.status] ?? 'secondary'}>{ticket.status}</Badge>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                <div className='text-sm text-muted-foreground whitespace-pre-wrap'>
                  {ticket.description}
                </div>

                <div className='grid gap-3 md:grid-cols-2'>
                  <div>
                    <div className='text-xs text-muted-foreground'>Category</div>
                    <div className='text-sm font-medium'>{ticket.category}</div>
                  </div>
                  <div>
                    <div className='text-xs text-muted-foreground'>Priority</div>
                    <div className='text-sm font-medium'>{ticket.priority}</div>
                  </div>
                </div>

                <div className='grid gap-3 md:grid-cols-2'>
                  <div>
                    <div className='text-xs text-muted-foreground'>Created</div>
                    <div className='text-sm font-medium'>
                      {new Date(ticket.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className='text-xs text-muted-foreground'>Updated</div>
                    <div className='text-sm font-medium'>
                      {new Date(ticket.updated_at).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className='grid gap-3 md:grid-cols-2'>
                  <Input
                    value={statusValue}
                    onChange={(e) => setStatus(e.target.value)}
                    placeholder='Status (OPEN / IN_PROGRESS / RESOLVED / CLOSED)'
                  />
                  <Input
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    placeholder='Resolution (optional)'
                  />
                </div>

                <div className='flex justify-end'>
                  <Button onClick={handleUpdate} disabled={updating}>
                    {updating ? 'Saving…' : 'Save'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Comments</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                {ticket.issue_ticket_comments?.length ? (
                  <div className='space-y-3'>
                    {ticket.issue_ticket_comments.map((c) => (
                      <div key={c.s_no} className='rounded-lg border bg-background p-3'>
                        <div className='flex items-center justify-between gap-2'>
                          <div className='text-sm font-medium'>
                            {c.author_source === 'MANAGEMENT'
                              ? c.management_user_name ?? c.management_user_email ?? `Product Team #${c.management_user_id ?? ''}`
                              : c.users?.name ?? (c.user_id ? `User #${c.user_id}` : 'User')}
                          </div>
                          <div className='text-xs text-muted-foreground'>
                            {new Date(c.created_at).toLocaleString()}
                          </div>
                        </div>
                        <div className='mt-2 text-sm text-muted-foreground whitespace-pre-wrap'>
                          {c.comment}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className='text-sm text-muted-foreground'>No comments yet</div>
                )}

                <div className='space-y-2'>
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder='Write a reply…'
                  />
                  <div className='flex justify-end'>
                    <Button onClick={handleAddComment} disabled={commenting || !comment.trim()}>
                      {commenting ? 'Posting…' : 'Post comment'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </Main>
    </>
  )
}

const topNav = [
  {
    title: 'Tickets',
    href: '/tickets',
    isActive: true,
    disabled: false,
  },
]
