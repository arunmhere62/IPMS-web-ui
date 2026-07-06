import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Layers,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  Flag,
  MessageSquare,
  ArrowRight,
} from 'lucide-react'
import type {
  TicketOverview,
  DashboardTicket,
  UnreadTickets,
} from '@/services/dashboardApi'

interface TicketStatsCardProps {
  overview: TicketOverview
  recentTickets: DashboardTicket[]
  unreadTickets: UnreadTickets
  isLoading?: boolean
  className?: string
}

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  OPEN: { color: 'bg-red-100 text-red-700 border-red-200', label: 'Open' },
  IN_PROGRESS: {
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    label: 'In Progress',
  },
  RESOLVED: {
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    label: 'Resolved',
  },
  CLOSED: {
    color: 'bg-slate-100 text-slate-700 border-slate-200',
    label: 'Closed',
  },
}

const PRIORITY_CONFIG: Record<string, { color: string }> = {
  HIGH: { color: 'bg-red-100 text-red-700 border-red-200' },
  MEDIUM: { color: 'bg-amber-100 text-amber-700 border-amber-200' },
  LOW: { color: 'bg-slate-100 text-slate-700 border-slate-200' },
}

function StatItem({
  label,
  value,
  color,
  icon: Icon,
}: {
  label: string
  value: number
  color: string
  icon: React.ElementType
}) {
  return (
    <div
      className={cn(
        'flex flex-1 min-w-[60px] flex-col items-center gap-0.5 rounded-md p-2',
        color
      )}
    >
      <Icon className='size-3' />
      <span className='text-sm font-bold'>{value}</span>
      <span className='text-[9px] font-semibold uppercase tracking-wide opacity-80'>
        {label}
      </span>
    </div>
  )
}

function TicketItem({
  ticket,
  showTenant,
}: {
  ticket: DashboardTicket
  showTenant?: boolean
}) {
  const navigate = useNavigate()
  const statusConfig = STATUS_CONFIG[ticket.status] ?? STATUS_CONFIG.OPEN
  const priorityConfig = PRIORITY_CONFIG[ticket.priority] ?? PRIORITY_CONFIG.LOW

  return (
    <button
      onClick={() => navigate(`/tickets/${ticket.s_no}`)}
      className={cn(
        'w-full text-left rounded-md border p-2 transition-colors hover:bg-accent',
        statusConfig.color.replace('bg-', 'bg-opacity-5 bg-').replace('text-', 'border-')
      )}
    >
      <div className='flex items-start justify-between gap-2'>
        <div className='min-w-0 flex-1'>
          <div className='truncate text-xs font-semibold'>{ticket.title}</div>
          {showTenant && ticket.tenants ? (
            <div className='text-[10px] text-muted-foreground'>
              {ticket.tenants.name}
            </div>
          ) : null}
          <div className='mt-1 flex flex-wrap items-center gap-1'>
            <Badge variant='outline' className={cn('text-[9px] px-1 py-0', statusConfig.color)}>
              {ticket.status}
            </Badge>
            <Badge variant='outline' className={cn('text-[9px] px-1 py-0', priorityConfig.color)}>
              {ticket.priority}
            </Badge>
          </div>
        </div>
        <div className='flex items-center gap-0.5 text-[10px] text-muted-foreground'>
          <MessageSquare className='size-3' />
          <span className='font-semibold'>
            {ticket._count.tenant_ticket_comments}
          </span>
        </div>
      </div>
    </button>
  )
}

export function TicketStatsCard({
  overview,
  recentTickets,
  unreadTickets,
  isLoading = false,
  className,
}: TicketStatsCardProps) {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'recent' | 'unread'>('recent')

  if (isLoading) {
    return (
      <Card className={cn('py-3', className)}>
        <CardContent className='space-y-3'>
          <Skeleton className='h-5 w-32' />
          <div className='grid grid-cols-3 gap-1.5 sm:grid-cols-6'>
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className='h-14 rounded-md' />
            ))}
          </div>
          <Skeleton className='h-8 w-40 rounded-md' />
          <div className='grid gap-1.5'>
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className='h-12 rounded-md' />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const statItems = [
    { label: 'Total', value: overview.total, color: 'bg-slate-100 text-slate-700', icon: Layers },
    { label: 'Open', value: overview.open, color: 'bg-red-100 text-red-700', icon: AlertCircle },
    { label: 'In Progress', value: overview.inProgress, color: 'bg-amber-100 text-amber-700', icon: Clock },
    { label: 'Resolved', value: overview.resolved, color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
    { label: 'Closed', value: overview.closed, color: 'bg-slate-100 text-slate-700', icon: XCircle },
    { label: 'High', value: overview.highPriority, color: 'bg-red-100 text-red-700', icon: Flag },
  ]

  const hasUnread = unreadTickets.count > 0
  const ticketsToShow = activeTab === 'recent' ? recentTickets : unreadTickets.tickets

  return (
    <Card className={cn('py-3', className)}>
      <CardHeader className='flex flex-row items-start justify-between pb-2'>
        <div>
          <CardTitle className='text-sm'>Tickets</CardTitle>
          <p className='text-[10px] text-muted-foreground'>
            Track and manage support tickets
          </p>
        </div>
        <Button
          variant='ghost'
          size='sm'
          className='h-7 gap-1 text-primary px-2'
          onClick={() => navigate('/tickets')}
        >
          View All
          <ArrowRight className='size-3' />
        </Button>
      </CardHeader>
      <CardContent className='space-y-3'>
        <div className='flex flex-wrap gap-1.5'>
          {statItems.map((item) => (
            <StatItem key={item.label} {...item} />
          ))}
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as 'recent' | 'unread')}
        >
          <TabsList className='h-8'>
            <TabsTrigger value='recent' className='gap-1.5 text-xs'>
              Recent
            </TabsTrigger>
            {hasUnread && (
              <TabsTrigger value='unread' className='gap-1.5 text-xs'>
                Unread
                <Badge variant='secondary' className='h-4 px-1 text-[9px]'>
                  {unreadTickets.count}
                </Badge>
              </TabsTrigger>
            )}
          </TabsList>
        </Tabs>

        <ScrollArea className='h-[180px]'>
          <div className='space-y-1.5 pr-2'>
            {ticketsToShow.length > 0 ? (
              ticketsToShow.map((ticket) => (
                <TicketItem key={ticket.s_no} ticket={ticket} showTenant />
              ))
            ) : (
              <div className='flex flex-col items-center justify-center py-6 text-center'>
                <div className='text-xs font-semibold'>No tickets yet</div>
                <div className='text-[10px] text-muted-foreground'>
                  {activeTab === 'recent'
                    ? 'No recent tickets to display.'
                    : 'No unread tickets.'}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
