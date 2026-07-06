import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useGetTenantTicketsQuery, useGetTenantTicketStatsQuery, useCreateTenantTicketMutation } from '../api/tenantPortalApi'
import { getCookie } from '@/lib/cookies'
import { Ticket, Plus, Wrench, AlertTriangle, Hand, HelpCircle, Flag, Calendar } from 'lucide-react'
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import type { TenantTicketCategory, TenantTicketPriority, TenantTicket } from '../api/tenantPortalApi'

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  OPEN: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  IN_PROGRESS: { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
  RESOLVED: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  CLOSED: { bg: 'bg-slate-50', text: 'text-slate-700', dot: 'bg-slate-500' },
}

const CATEGORY_ICONS: Record<string, any> = {
  MAINTENANCE: Wrench,
  COMPLAINT: AlertTriangle,
  REQUEST: Hand,
  OTHER: HelpCircle,
}

export function TenantTicketsScreen() {
  const accessToken = getCookie('access_token')
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [newTicket, setNewTicket] = useState({
    category: 'OTHER' as TenantTicketCategory,
    title: '',
    description: '',
    priority: 'MEDIUM' as TenantTicketPriority,
  })

  const { data: ticketsData, isLoading: ticketsLoading, refetch: refetchTickets } = useGetTenantTicketsQuery(
    {},
    { skip: !accessToken }
  )

  const { data: ticketStatsData } = useGetTenantTicketStatsQuery(undefined, {
    skip: !accessToken,
  })

  const [createTenantTicket] = useCreateTenantTicketMutation()

  const tickets = ticketsData?.tickets || []
  const ticketStats = ticketStatsData?.data

  const handleCreateTicket = async () => {
    if (!newTicket.title.trim()) {
      toast.error('Please enter a ticket title')
      return
    }
    try {
      await createTenantTicket(newTicket).unwrap()
      toast.success('Ticket created successfully')
      setCreateModalOpen(false)
      setNewTicket({
        category: 'OTHER',
        title: '',
        description: '',
        priority: 'MEDIUM',
      })
      refetchTickets()
    } catch (error) {
      toast.error('Failed to create ticket')
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
  }

  if (ticketsLoading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-slate-500'>Loading...</div>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-slate-900'>Tickets</h1>
          <p className='text-slate-500'>View and manage your support tickets</p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)} className='gap-2'>
          <Plus className='w-4 h-4' />
          New Ticket
        </Button>
      </div>

      {/* Stats Overview */}
      {ticketStats?.overview && (
        <div className='grid grid-cols-4 gap-4'>
          <Card>
            <CardContent className='p-4 text-center'>
              <p className='text-2xl font-bold text-slate-900'>{ticketStats.overview.total}</p>
              <p className='text-xs text-slate-500 mt-1'>Total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className='p-4 text-center'>
              <p className='text-2xl font-bold text-amber-600'>{ticketStats.overview.open}</p>
              <p className='text-xs text-slate-500 mt-1'>Open</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className='p-4 text-center'>
              <p className='text-2xl font-bold text-blue-600'>{ticketStats.overview.inProgress}</p>
              <p className='text-xs text-slate-500 mt-1'>In Progress</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className='p-4 text-center'>
              <p className='text-2xl font-bold text-green-600'>{ticketStats.overview.resolved}</p>
              <p className='text-xs text-slate-500 mt-1'>Resolved</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tickets List */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Ticket className='w-5 h-5 text-indigo-600' />
            My Tickets
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tickets.length === 0 ? (
            <div className='text-center py-8'>
              <Ticket className='w-10 h-10 text-slate-300 mx-auto mb-2' />
              <p className='text-sm text-slate-500 mb-4'>No tickets raised yet</p>
              <Button onClick={() => setCreateModalOpen(true)} variant='outline' size='sm'>
                Raise a Ticket
              </Button>
            </div>
          ) : (
            <div className='space-y-3'>
              {tickets.map((ticket: TenantTicket) => {
                const sc = STATUS_COLORS[ticket.status] || STATUS_COLORS.OPEN
                const Icon = CATEGORY_ICONS[ticket.category] || HelpCircle
                return (
                  <div key={ticket.s_no} className='bg-slate-50 rounded-lg p-4 border border-slate-200 hover:border-slate-300 transition-colors'>
                    <div className='flex items-center gap-3 mb-3'>
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${sc.bg}`}>
                        <Icon className={`w-4 h-4 ${sc.text}`} />
                      </div>
                      <div className='flex-1'>
                        <p className='text-sm font-semibold text-slate-900'>{ticket.title}</p>
                        <p className='text-xs text-slate-500'>{ticket.category}</p>
                      </div>
                      <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${sc.bg}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                        <span className={`text-xs font-semibold ${sc.text}`}>
                          {ticket.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    <div className='flex items-center gap-4 text-xs text-slate-500'>
                      <div className='flex items-center gap-1'>
                        <Flag className='w-3 h-3' />
                        <span>{ticket.priority}</span>
                      </div>
                      <div className='flex items-center gap-1 ml-auto'>
                        <Calendar className='w-3 h-3' />
                        <span>{formatDate(ticket.created_at)}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Ticket Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Ticket</DialogTitle>
          </DialogHeader>
          <div className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='category'>Category</Label>
              <Select value={newTicket.category} onValueChange={(value: TenantTicketCategory) => setNewTicket({ ...newTicket, category: value })}>
                <SelectTrigger id='category'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='MAINTENANCE'>Maintenance</SelectItem>
                  <SelectItem value='COMPLAINT'>Complaint</SelectItem>
                  <SelectItem value='REQUEST'>Request</SelectItem>
                  <SelectItem value='OTHER'>Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='title'>Title *</Label>
              <Input
                id='title'
                value={newTicket.title}
                onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                placeholder='Brief description of the issue'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='description'>Description</Label>
              <Textarea
                id='description'
                value={newTicket.description}
                onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                placeholder='Provide more details about the issue'
                rows={3}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='priority'>Priority</Label>
              <Select value={newTicket.priority} onValueChange={(value: TenantTicketPriority) => setNewTicket({ ...newTicket, priority: value })}>
                <SelectTrigger id='priority'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='LOW'>Low</SelectItem>
                  <SelectItem value='MEDIUM'>Medium</SelectItem>
                  <SelectItem value='HIGH'>High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTicket}>Create Ticket</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
