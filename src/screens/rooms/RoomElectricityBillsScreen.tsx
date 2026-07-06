import { useMemo, useState } from 'react'
import {
  useDeleteElectricityBillMutation,
  useGetElectricityBillsQuery,
  type ElectricityBill,
  type ElectricityBillItem,
} from '@/services/electricityBillApi'
import { useAppSelector } from '@/store/hooks'
import { CircleAlert, Plus, Trash2, Zap } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { showErrorAlert, showSuccessAlert } from '@/utils/toast'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/form/page-header'
import { usePermissions } from '@/hooks/usePermissions'
import { Permission } from '@/config/rbac.config'
import { CreateElectricityBillDialog } from './electricity-bill/CreateElectricityBillDialog'
import { RecordElectricityBillPaymentDialog } from './electricity-bill/RecordElectricityBillPaymentDialog'

const formatCurrency = (value: number) => {
  return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

type ErrorLike = {
  data?: { message?: string }
  message?: string
}

const formatDate = (value?: string) => {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value.split('T')[0]
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function RoomElectricityBillsScreen() {
  const params = useParams()
  const roomId = Number(params.id)
  const selectedPGLocationId = useAppSelector((s) => s.pgLocations.selectedPGLocationId)
  const { can } = usePermissions()
  const canCreate = can(Permission.CREATE_ELECTRICITY_BILL)
  const canDelete = can(Permission.DELETE_ELECTRICITY_BILL)
  const canRecordPayment = can(Permission.EDIT_ELECTRICITY_BILL)

  const { data, isLoading, error, refetch } = useGetElectricityBillsQuery(
    { room_id: Number.isFinite(roomId) ? roomId : 0 },
    { skip: !Number.isFinite(roomId) || roomId <= 0 }
  )

  const [deleteBill] = useDeleteElectricityBillMutation()
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<ElectricityBillItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ElectricityBill | null>(null)

  const bills = useMemo(() => (data?.data ?? []) as ElectricityBill[], [data])

  const fetchErrorMessage =
    (error as ErrorLike | undefined)?.data?.message ||
    (error as ErrorLike | undefined)?.message

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteBill(deleteTarget.s_no).unwrap()
      showSuccessAlert('Bill deleted successfully')
      setDeleteTarget(null)
      refetch()
    } catch (e) {
      showErrorAlert(e, 'Delete Error')
    }
  }

  const handlePaymentSuccess = () => {
    setSelectedItem(null)
    refetch()
  }

  return (
    <div className='container mx-auto max-w-4xl px-4 py-4'>
      <PageHeader
        title='Electricity Bills'
        showBack={true}
        right={
          <Button
            size='sm'
            disabled={!selectedPGLocationId || !canCreate}
            onClick={() => setCreateOpen(true)}
            className='bg-black text-white hover:bg-black/90'
          >
            <Plus className='mr-1 size-4' />
            Add Bill
          </Button>
        }
      />

      {fetchErrorMessage ? (
        <div className='mt-4'>
          <Alert variant='destructive'>
            <CircleAlert />
            <AlertTitle>Error Loading Bills</AlertTitle>
            <AlertDescription>{fetchErrorMessage}</AlertDescription>
          </Alert>
        </div>
      ) : null}

      {!selectedPGLocationId ? (
        <div className='mt-4 rounded-md border bg-card px-3 py-4 text-sm text-muted-foreground'>
          Select a PG location.
        </div>
      ) : isLoading ? (
        <div className='mt-4 space-y-3'>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className='rounded-lg border bg-card p-5'>
              <div className='h-4 w-32 animate-pulse rounded bg-gray-200'></div>
              <div className='mt-2 h-3 w-24 animate-pulse rounded bg-gray-200'></div>
            </div>
          ))}
        </div>
      ) : bills.length === 0 ? (
        <div className='mt-4'>
          <EmptyState
            emoji='⚡'
            title='No Electricity Bills'
            description='No bills have been added for this room yet.'
          />
        </div>
      ) : (
        <div className='mt-4 space-y-3'>
          {bills.map((bill) => {
            const status = bill.status ?? 'PENDING'
            const statusColor =
              status === 'PAID'
                ? 'bg-green-600'
                : status === 'PARTIAL'
                  ? 'bg-orange-500'
                  : status === 'CANCELLED'
                    ? 'bg-gray-500'
                    : 'bg-amber-500'
            const items = bill.electricity_bill_items || []
            const totalPaid = items.reduce((sum, it) => sum + Number(it.paid_amount || 0), 0)
            const remaining = Number(bill.total_amount) - totalPaid

            return (
              <Card key={bill.s_no} className='py-0 shadow-sm'>
                <CardContent className='p-4'>
                  <div className='flex items-start justify-between gap-3'>
                    <div className='flex items-center gap-3'>
                      <div className='flex size-10 items-center justify-center rounded-xl bg-amber-500/10'>
                        <Zap className='size-5 text-amber-500' />
                      </div>
                      <div>
                        <h3 className='text-sm font-bold'>
                          {formatDate(bill.bill_period_start)} - {formatDate(bill.bill_period_end)}
                        </h3>
                        <p className='text-xs text-muted-foreground'>
                          Total: {formatCurrency(Number(bill.total_amount ?? 0))}
                          {bill.units_consumed ? ` · ${bill.units_consumed} units` : ''}
                        </p>
                      </div>
                    </div>
                    <div className='flex items-center gap-2'>
                      <Badge className={`${statusColor} text-white`}>{status}</Badge>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='size-8 text-destructive'
                        disabled={!canDelete}
                        onClick={() => setDeleteTarget(bill)}
                        aria-label='Delete bill'
                      >
                        <Trash2 className='size-4' />
                      </Button>
                    </div>
                  </div>

                  {bill.meter_reading_start !== undefined && bill.meter_reading_end !== undefined && (
                    <p className='mt-2 text-xs text-muted-foreground'>
                      Reading: {bill.meter_reading_start} → {bill.meter_reading_end}
                      {bill.rate_per_unit ? ` · Rate: ${formatCurrency(Number(bill.rate_per_unit))}/unit` : ''}
                    </p>
                  )}

                  <div className='mt-3 space-y-2'>
                    {items.map((item) => {
                      const isPaid = item.status === 'PAID'
                      const isPartial = item.status === 'PARTIAL'
                      return (
                        <div
                          key={item.s_no}
                          className='flex items-center justify-between rounded-lg border bg-muted/30 p-3'
                        >
                          <div className='min-w-0 flex-1'>
                            <div className='text-sm font-semibold'>{item.tenants?.name ?? 'Tenant'}</div>
                            <div className='text-xs text-muted-foreground'>
                              Share: {formatCurrency(Number(item.share_amount))}
                              {item.billing_days ? ` · ${item.billing_days} days` : ''}
                            </div>
                            {(isPaid || isPartial) && (
                              <div className='text-xs text-green-600'>
                                Paid: {formatCurrency(Number(item.paid_amount || 0))}
                              </div>
                            )}
                          </div>
                          <div>
                            {isPaid ? (
                              <span className='inline-flex rounded-md bg-green-100 px-2 py-1 text-xs font-semibold text-green-700'>
                                Paid
                              </span>
                            ) : (
                              <Button
                                size='sm'
                                disabled={!canRecordPayment}
                                onClick={() => setSelectedItem(item)}
                              >
                                Pay
                              </Button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {remaining > 0 && (
                    <p className='mt-2 text-right text-xs text-muted-foreground'>
                      Pending: {formatCurrency(remaining)}
                    </p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <CreateElectricityBillDialog
        open={createOpen}
        roomId={Number.isFinite(roomId) ? roomId : 0}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => {
          setCreateOpen(false)
          refetch()
        }}
      />

      <RecordElectricityBillPaymentDialog
        open={selectedItem !== null}
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onSuccess={handlePaymentSuccess}
      />

      <AlertDialog open={deleteTarget !== null} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Bill</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this electricity bill? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTarget(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className='bg-destructive text-white hover:bg-destructive/90'>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
