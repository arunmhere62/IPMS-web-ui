import { useMemo, useState } from 'react'
import { Phone, MessageCircle, TrendingUp } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  useGetDashboardMonthlyMetricsQuery,
  useGetDashboardSummaryQuery,
} from '@/services/dashboardApi'
import type { Tenant } from '@/services/tenantsApi'
import { useAppSelector } from '@/store/hooks'

type AttentionKey = 'pending_rent' | 'partial_rent' | 'without_advance'

type GapSnapshot = {
  gapCount: number
  gapDueAmount?: number
}

const getLast6Months = () => {
  const months: Array<{ label: string; monthStart: string; monthEnd: string; isCurrentMonth: boolean }> = []
  const now = new Date()

  for (let i = 0; i < 6; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const year = date.getFullYear()
    const month = date.getMonth()
    const label = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    const monthStart = new Date(year, month, 1).toISOString().split('T')[0]
    const monthEnd = new Date(year, month + 1, 1).toISOString().split('T')[0]
    months.push({ label, monthStart, monthEnd, isCurrentMonth: i === 0 })
  }

  return months
}

export function HomePage() {
  const selectedPGLocationId = useAppSelector((s) => (s as any).pgLocations?.selectedPGLocationId) as
    | number
    | null

  const [attentionTab, setAttentionTab] = useState<AttentionKey>('pending_rent')
  const months = useMemo(() => getLast6Months(), [])
  const [selectedMonthLabel, setSelectedMonthLabel] = useState(months[0]?.label ?? '')

  const activeMonth = months.find((m) => m.label === selectedMonthLabel) ?? months[0]

  const {
    data: summaryResponse,
    isFetching: summaryFetching,
    error: summaryError,
    refetch: refetchSummary,
  } = useGetDashboardSummaryQuery(undefined, {
    skip: !selectedPGLocationId,
  })

  const {
    data: monthlyResponse,
    isFetching: monthlyFetching,
    error: monthlyError,
    refetch: refetchMonthly,
  } = useGetDashboardMonthlyMetricsQuery(
    { monthStart: activeMonth?.monthStart, monthEnd: activeMonth?.monthEnd },
    { skip: !selectedPGLocationId }
  )

  const dashboardSummary = (summaryResponse as unknown as { data?: unknown })?.data as
    | {
        bed_metrics?: {
          total_beds?: number
          occupied_beds?: number
          occupancy_rate?: number
          total_pg_value?: number
        }
        tenant_status?: {
          pending_rent?: { count: number; tenants: Tenant[] }
          partial_rent?: { count: number; tenants: Tenant[] }
          without_advance?: { count: number; tenants: Tenant[] }
        }
      }
    | undefined

  const bedMetrics = dashboardSummary?.bed_metrics
  const tenantStatus = dashboardSummary?.tenant_status

  const monthlyMetrics = (monthlyResponse as unknown as { data?: unknown })?.data as
    | {
        monthly_metrics?: {
          cash_received?: number
          rent_earned?: number
          refunds_paid?: number
          advance_paid?: number
          expenses_paid?: number
          mrr_value?: number
        }
      }
    | undefined

  const formatCurrency = (amount?: number) => {
    const n = Number(amount ?? 0)
    try {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }).format(n)
    } catch {
      return `₹${Math.round(n)}`
    }
  }

  const getInitials = (name?: string) => {
    const n = String(name ?? '').trim()
    if (!n) return 'T'
    const parts = n.split(/\s+/).filter(Boolean)
    const a = parts[0]?.[0] ?? 'T'
    const b = parts.length > 1 ? parts[1]?.[0] ?? '' : ''
    return (a + b).toUpperCase()
  }

  const getGapSnapshotForTab = (tab: AttentionKey, tenant?: Tenant): GapSnapshot => {
    if (!tenant) return { gapCount: 0, gapDueAmount: undefined }

    const readNum = (v: unknown): number | undefined => {
      const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN
      return Number.isFinite(n) ? n : undefined
    }

    const readCount = (v: unknown): number => {
      const n = readNum(v)
      return typeof n === 'number' ? n : 0
    }

    if (tab === 'pending_rent') {
      const gapCount = readCount((tenant as unknown as { pending_gap_count?: unknown })?.pending_gap_count)
      const gapDueAmount = readNum((tenant as unknown as { pending_gap_due_amount?: unknown })?.pending_gap_due_amount)
      const fallbackDue =
        typeof tenant.pending_due_amount === 'number'
          ? tenant.pending_due_amount
          : typeof tenant.rent_due_amount === 'number'
            ? tenant.rent_due_amount
            : typeof tenant.pending_payment?.total_pending === 'number'
              ? tenant.pending_payment.total_pending
              : undefined
      return {
        gapCount,
        gapDueAmount: typeof gapDueAmount === 'number' ? gapDueAmount : fallbackDue,
      }
    }

    if (tab === 'partial_rent') {
      const gapCount = readCount((tenant as unknown as { partial_gap_count?: unknown })?.partial_gap_count)
      const gapDueAmount = readNum((tenant as unknown as { partial_gap_due_amount?: unknown })?.partial_gap_due_amount)
      const fallbackDue =
        typeof tenant.partial_due_amount === 'number'
          ? tenant.partial_due_amount
          : typeof tenant.pending_payment?.current_month_pending === 'number'
            ? tenant.pending_payment.current_month_pending
            : undefined
      return {
        gapCount,
        gapDueAmount: typeof gapDueAmount === 'number' ? gapDueAmount : fallbackDue,
      }
    }

    const gapCount = readCount((tenant as unknown as { gap_count?: unknown })?.gap_count)
    const gapDueAmount = readNum((tenant as unknown as { gap_due_amount?: unknown })?.gap_due_amount)
    return { gapCount, gapDueAmount }
  }

  const widgetItems = useMemo(() => {
    const pendingTenants = (tenantStatus?.pending_rent?.tenants ?? []) as Tenant[]
    const partialTenants = (tenantStatus?.partial_rent?.tenants ?? []) as Tenant[]
    const withoutAdvanceTenants = (tenantStatus?.without_advance?.tenants ?? []) as Tenant[]

    const pendingUnion = [...pendingTenants, ...partialTenants].filter((t) => {
      const snap = getGapSnapshotForTab('pending_rent', t)
      return snap.gapCount > 0 || (typeof snap.gapDueAmount === 'number' && snap.gapDueAmount > 0)
    })

    const uniqueById = (arr: Tenant[]) => {
      const seen = new Set<number>()
      return arr.filter((t) => {
        const id = typeof t?.s_no === 'number' ? t.s_no : NaN
        if (!Number.isFinite(id)) return false
        if (seen.has(id)) return false
        seen.add(id)
        return true
      })
    }

    const pendingUnique = uniqueById(pendingUnion)
    const partialFiltered = partialTenants.filter((t) => {
      const snap = getGapSnapshotForTab('partial_rent', t)
      return snap.gapCount > 0 || (typeof snap.gapDueAmount === 'number' && snap.gapDueAmount > 0)
    })

    return [
      {
        key: 'pending_rent' as const,
        title: 'Pending Rent',
        subtitle: 'Collect dues quickly',
        tintClass: 'text-red-600',
        badgeClass: 'bg-red-50 text-red-700 border-red-200',
        tenants: pendingUnique,
        count: pendingUnique.length,
      },
      {
        key: 'partial_rent' as const,
        title: 'Partial Rent',
        subtitle: 'Follow-up needed',
        tintClass: 'text-amber-600',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
        tenants: uniqueById(partialFiltered),
        count: uniqueById(partialFiltered).length,
      },
      {
        key: 'without_advance' as const,
        title: 'No Advance',
        subtitle: 'Request security deposit',
        tintClass: 'text-blue-600',
        badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
        tenants: withoutAdvanceTenants,
        count: tenantStatus?.without_advance?.count ?? withoutAdvanceTenants.length,
      },
    ] as const
  }, [tenantStatus, attentionTab])

  const selectedAttention = widgetItems.find((w) => w.key === attentionTab) ?? widgetItems[0]

  const canCall = (phone?: string) => Boolean(String(phone ?? '').trim())
  const normalizePhone = (raw?: string) => String(raw ?? '').replace(/[^0-9]/g, '')

  const openCall = (raw?: string) => {
    const digits = normalizePhone(raw)
    if (!digits) return
    window.open(`tel:${digits}`, '_self')
  }

  const openWhatsApp = (raw?: string) => {
    const digits = normalizePhone(raw)
    if (!digits) return
    window.open(`https://wa.me/${digits}`, '_blank', 'noopener,noreferrer')
  }

  const mm = monthlyMetrics?.monthly_metrics
  const hasMonthly = Boolean(mm)
  const cashReceived = mm?.cash_received ?? 0
  const rentEarned = mm?.rent_earned ?? 0
  const computedRate = hasMonthly && rentEarned > 0 ? cashReceived / rentEarned : 0
  const collectionRateText = hasMonthly ? `${(computedRate * 100).toFixed(1)}%` : monthlyFetching ? '—' : '0%'

  const dashboardErrorMessage = (summaryError as any)?.data?.message || (summaryError as any)?.message
  const monthlyErrorMessage = (monthlyError as any)?.data?.message || (monthlyError as any)?.message

  return (
    <div className='container mx-auto max-w-6xl px-3 py-6'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <div className='text-xl font-semibold'>Dashboard</div>
          <div className='mt-1 text-sm text-muted-foreground'>Owner dashboard and monthly metrics</div>
        </div>
        <div className='flex items-center gap-2'>
          <Button variant='outline' size='sm' onClick={() => { void refetchSummary(); void refetchMonthly(); }}>
            Refresh
          </Button>
        </div>
      </div>

      <div className='mt-5 grid gap-4 lg:grid-cols-3'>
        <Card className='lg:col-span-2'>
          <CardHeader className='pb-2'>
            <CardTitle className='flex items-center gap-2 text-base'>
              <TrendingUp className='size-4 text-primary' />
              Owner Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid gap-3 sm:grid-cols-2'>
              <div className='rounded-lg border bg-muted/30 p-4'>
                <div className='text-xs font-semibold text-muted-foreground'>OCCUPANCY</div>
                <div className='mt-1 text-2xl font-bold'>
                  {typeof bedMetrics?.occupancy_rate === 'number'
                    ? `${bedMetrics.occupancy_rate.toFixed(0)}%`
                    : summaryFetching
                      ? '—'
                      : '0%'}
                </div>
              </div>
              <div className='rounded-lg border bg-muted/30 p-4'>
                <div className='text-xs font-semibold text-muted-foreground'>PG VALUE</div>
                <div className='mt-1 text-xl font-bold'>
                  {bedMetrics ? formatCurrency(bedMetrics.total_pg_value) : summaryFetching ? '—' : formatCurrency(0)}
                </div>
              </div>
            </div>

            <div className='grid gap-3 sm:grid-cols-2'>
              <div className='rounded-lg border bg-primary/5 p-4'>
                <div className='flex items-center justify-between'>
                  <div className='text-sm font-semibold'>Total Beds</div>
                  <Badge variant='secondary'>Beds</Badge>
                </div>
                <div className='mt-2 text-3xl font-bold'>
                  {typeof bedMetrics?.total_beds === 'number' ? bedMetrics.total_beds : summaryFetching ? '—' : 0}
                </div>
              </div>
              <div className='rounded-lg border bg-secondary/10 p-4'>
                <div className='flex items-center justify-between'>
                  <div className='text-sm font-semibold'>Occupied</div>
                  <Badge variant='secondary'>Active</Badge>
                </div>
                <div className='mt-2 text-3xl font-bold'>
                  {typeof bedMetrics?.occupied_beds === 'number' ? bedMetrics.occupied_beds : summaryFetching ? '—' : 0}
                </div>
              </div>
            </div>

            {dashboardErrorMessage ? (
              <div className='rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive'>
                {dashboardErrorMessage}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-base'>Monthly Metrics</CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            <Select
              value={selectedMonthLabel}
              onValueChange={(v) => {
                setSelectedMonthLabel(v)
              }}
            >
              <SelectTrigger className='h-9'>
                <SelectValue placeholder='Select month' />
              </SelectTrigger>
              <SelectContent>
                {months.map((m) => (
                  <SelectItem key={m.label} value={m.label}>
                    {m.label}{m.isCurrentMonth ? ' (Current)' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className='grid gap-2'>
              <div className='flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2'>
                <div className='text-sm text-muted-foreground'>Cash received</div>
                <div className='text-sm font-semibold'>{monthlyFetching ? '—' : formatCurrency(mm?.cash_received ?? 0)}</div>
              </div>
              <div className='flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2'>
                <div className='text-sm text-muted-foreground'>Rent earned</div>
                <div className='text-sm font-semibold'>{monthlyFetching ? '—' : formatCurrency(mm?.rent_earned ?? 0)}</div>
              </div>
              <div className='flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2'>
                <div className='text-sm text-muted-foreground'>Collection rate</div>
                <div className='text-sm font-semibold'>{collectionRateText}</div>
              </div>
            </div>

            {monthlyErrorMessage ? (
              <div className='rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive'>
                {monthlyErrorMessage}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <div className='mt-6'>
        <div className='text-base font-semibold'>Attention Required</div>
        <div className='mt-1 text-sm text-muted-foreground'>Quick follow-ups for pending rent and advance</div>
      </div>

      <Card className='mt-3'>
        <CardContent className='space-y-4'>
          <ScrollArea orientation='horizontal' className='w-full'>
            <Tabs value={attentionTab} onValueChange={(v) => setAttentionTab(v as AttentionKey)}>
              <TabsList className='h-10'>
                {widgetItems.map((w) => (
                  <TabsTrigger key={w.key} value={w.key} className='gap-2'>
                    <span className='text-sm font-medium'>{w.title}</span>
                    <span
                      className={
                        'inline-flex h-5 min-w-5 items-center justify-center rounded-full border px-1 text-xs font-semibold ' +
                        w.badgeClass
                      }
                    >
                      {w.count}
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </ScrollArea>

          <div className='flex items-center justify-between'>
            <div>
              <div className='text-sm font-semibold'>{selectedAttention?.title ?? 'Attention'}</div>
              <div className='text-xs text-muted-foreground'>{selectedAttention?.subtitle ?? ''}</div>
            </div>
          </div>

          <div className='rounded-lg border bg-muted/20 p-2'>
            {selectedAttention?.tenants?.length ? (
              <div className='max-h-[340px] overflow-auto'>
                {selectedAttention.tenants.map((t) => {
                  const roomNo = t.rooms?.room_no
                  const bedNo = t.beds?.bed_no
                  const phone = t.phone_no
                  const whatsapp = t.whatsapp_number ?? t.phone_no
                  const { gapCount, gapDueAmount } = getGapSnapshotForTab(attentionTab, t)

                  return (
                    <div
                      key={String(t.s_no)}
                      className='flex items-center justify-between gap-3 border-b px-2 py-2 last:border-b-0'
                    >
                      <div className='flex min-w-0 items-center gap-3'>
                        <div className='flex size-9 items-center justify-center rounded-full border bg-background text-xs font-bold'>
                          {getInitials(t.name)}
                        </div>
                        <div className='min-w-0'>
                          <div className='truncate text-sm font-semibold'>{t.name || 'Tenant'}</div>
                          <div className='mt-0.5 text-xs text-muted-foreground'>
                            {roomNo ? `Room ${roomNo}` : 'Room —'}
                            {bedNo ? ` • Bed ${bedNo}` : ''}
                          </div>
                          {gapCount > 0 || typeof gapDueAmount === 'number' ? (
                            <div className='mt-0.5 text-xs text-muted-foreground'>
                              {typeof gapDueAmount === 'number' ? `Due ${formatCurrency(gapDueAmount)}` : ''}
                              {gapCount > 0 ? `${typeof gapDueAmount === 'number' ? ' • ' : ''}Gaps ${gapCount}` : ''}
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <div className='flex items-center gap-2'>
                        <Button
                          type='button'
                          variant='outline'
                          size='icon'
                          onClick={() => openCall(phone)}
                          disabled={!canCall(phone)}
                          aria-label='Call'
                        >
                          <Phone className='size-4' />
                        </Button>
                        <Button
                          type='button'
                          variant='outline'
                          size='icon'
                          onClick={() => openWhatsApp(whatsapp)}
                          disabled={!canCall(whatsapp)}
                          aria-label='WhatsApp'
                        >
                          <MessageCircle className='size-4' />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className='flex flex-col items-center justify-center gap-1 py-8 text-center'>
                <div className='text-sm font-semibold'>All good</div>
                <div className='text-xs text-muted-foreground'>No tenants need attention in this section right now.</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
