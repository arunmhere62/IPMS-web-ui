import { useEffect, useMemo, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  useCreateElectricityBillMutation,
  useLazyGetEligibleTenantsForPeriodQuery,
  type CustomAllocationItem,
  type CreateElectricityBillDto,
  type EligibleTenant,
} from '@/services/electricityBillApi'
import { useAppSelector } from '@/store/hooks'
import { AlertCircle, ChevronDown, ChevronUp, IndianRupee } from 'lucide-react'
import { showErrorAlert, showSuccessAlert } from '@/utils/toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Form } from '@/components/ui/form'
import { FormDialog } from '@/components/form/form-dialog'
import { FormSelectField } from '@/components/form/form-select-field'
import { FormTextInput } from '@/components/form/form-text-input'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const schema = z.object({
  selectedMonth: z.string().min(1, 'Month is required'),
  selectedYear: z.string().min(1, 'Year is required'),
  totalAmount: z.number().min(0.01, 'Total amount is required'),
  allocationBasis: z.enum(['EQUAL', 'RENT_CYCLE_DAYS', 'CUSTOM'], {
    message: 'Split method is required',
  }),
  prevReading: z.string().optional(),
  currReading: z.string().optional(),
  ratePerUnit: z.string().optional(),
  dueDate: z.string().optional(),
}).refine(
  (data) => {
    if (data.prevReading && data.currReading) {
      return Number(data.currReading) > Number(data.prevReading)
    }
    return true
  },
  {
    message: 'Current reading must be greater than previous reading',
    path: ['currReading'],
  }
)

type FormValues = z.infer<typeof schema>

interface CreateElectricityBillDialogProps {
  open: boolean
  roomId: number
  onClose: () => void
  onSuccess: () => void
}

const MONTHS = [
  { label: 'January', value: '0' },
  { label: 'February', value: '1' },
  { label: 'March', value: '2' },
  { label: 'April', value: '3' },
  { label: 'May', value: '4' },
  { label: 'June', value: '5' },
  { label: 'July', value: '6' },
  { label: 'August', value: '7' },
  { label: 'September', value: '8' },
  { label: 'October', value: '9' },
  { label: 'November', value: '10' },
  { label: 'December', value: '11' },
]

const ALLOCATION_OPTIONS = [
  { label: 'Equal', value: 'EQUAL' },
  { label: 'Rent Cycle Days', value: 'RENT_CYCLE_DAYS' },
  { label: 'Custom', value: 'CUSTOM' },
]

const formatDate = (d: Date) => {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const formatDisplayDate = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

const sanitizeNumeric = (text: string): string => {
  return text.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1')
}

export function CreateElectricityBillDialog({
  open,
  roomId,
  onClose,
  onSuccess,
}: CreateElectricityBillDialogProps) {
  const selectedPGLocationId = useAppSelector((s) => s.pgLocations.selectedPGLocationId)
  const today = new Date()

  const [customAllocations, setCustomAllocations] = useState<Record<number, string>>({})
  const [optionalExpanded, setOptionalExpanded] = useState(false)
  const [eligibleTenants, setEligibleTenants] = useState<EligibleTenant[]>([])
  const [fetchingTenants, setFetchingTenants] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  const [createBill, { isLoading }] = useCreateElectricityBillMutation()
  const [getEligibleTenants] = useLazyGetEligibleTenantsForPeriodQuery()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      selectedMonth: String(today.getMonth()),
      selectedYear: String(today.getFullYear()),
      totalAmount: 0,
      allocationBasis: undefined,
      prevReading: '',
      currReading: '',
      ratePerUnit: '',
      dueDate: '',
    },
  })

  const currentYear = today.getFullYear()
  const yearOptions = Array.from({ length: 5 }, (_, i) => {
    const year = currentYear - 2 + i
    return { label: String(year), value: String(year) }
  })

  const { periodStart, periodEnd } = useMemo(() => {
    const year = Number(form.watch('selectedYear'))
    const month = Number(form.watch('selectedMonth'))
    const start = new Date(year, month, 1)
    const end = new Date(year, month + 1, 0)
    return { periodStart: formatDate(start), periodEnd: formatDate(end) }
  }, [form])

  useEffect(() => {
    if (selectedPGLocationId && roomId && periodStart && periodEnd) {
      setFetchingTenants(true)
      getEligibleTenants({
        room_id: roomId,
        bill_period_start: periodStart,
        bill_period_end: periodEnd,
      })
        .unwrap()
        .then((response) => {
          if (response.success) {
            setEligibleTenants(response.data)
          }
        })
        .catch(() => {
          setEligibleTenants([])
        })
        .finally(() => {
          setFetchingTenants(false)
        })
    }
  }, [selectedPGLocationId, roomId, periodStart, periodEnd, getEligibleTenants])

  useEffect(() => {
    const prev = Number(form.watch('prevReading') || 0)
    const curr = Number(form.watch('currReading') || 0)
    const rate = Number(form.watch('ratePerUnit') || 0)
    if (curr > prev && rate > 0) {
      const units = curr - prev
      form.setValue('totalAmount', Number((units * rate).toFixed(2)))
    }
  }, [form])

  useEffect(() => {
    const allocationBasis = form.watch('allocationBasis')
    const totalAmount = form.watch('totalAmount')
    if (allocationBasis === 'CUSTOM') {
      const perTenant =
        eligibleTenants.length > 0 ? (Number(totalAmount || 0) / eligibleTenants.length).toFixed(2) : '0'
      const initial: Record<number, string> = {}
      eligibleTenants.forEach((t) => {
        initial[t.tenant_id] = perTenant
      })
      setCustomAllocations(initial)
    }
  }, [form, eligibleTenants])

  const reset = () => {
    form.reset({
      selectedMonth: String(today.getMonth()),
      selectedYear: String(today.getFullYear()),
      totalAmount: 0,
      allocationBasis: undefined,
      prevReading: '',
      currReading: '',
      ratePerUnit: '',
      dueDate: '',
    })
    setCustomAllocations({})
    setEligibleTenants([])
    setFetchingTenants(false)
    setValidationError(null)
    setOptionalExpanded(false)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const validate = () => {
    if (!selectedPGLocationId) {
      return 'PG location is required. Please select a PG location first.'
    }
    const selectedMonth = form.watch('selectedMonth')
    const selectedYear = form.watch('selectedYear')
    if (!selectedMonth || !selectedYear) return 'Billing month and year are required'
    const amount = form.watch('totalAmount')
    if (!amount || amount <= 0) return 'Total amount is required and must be greater than 0'
    if (eligibleTenants.length === 0) return 'No tenants were active in this room during the selected period'
    const allocationBasis = form.watch('allocationBasis')
    if (!allocationBasis) return 'Please select a split method'
    if (allocationBasis === 'CUSTOM') {
      const total = Object.values(customAllocations).reduce((sum, v) => sum + (Number(v) || 0), 0)
      if (Math.abs(total - amount) > 0.01) {
        return `Custom allocations total (₹${total.toFixed(2)}) must equal bill total (₹${amount.toFixed(2)})`
      }
      const missingTenant = eligibleTenants.find(
        (t) => !customAllocations[t.tenant_id] || Number(customAllocations[t.tenant_id]) <= 0
      )
      if (missingTenant) {
        return `Please enter a valid share amount for ${missingTenant.name}`
      }
    }
    return null
  }

  const onSubmit = async (values: FormValues) => {
    const error = validate()
    if (error) {
      setValidationError(error)
      return
    }
    setValidationError(null)

    const payload: CreateElectricityBillDto = {
      pg_id: selectedPGLocationId!,
      room_id: roomId,
      bill_period_start: periodStart,
      bill_period_end: periodEnd,
      total_amount: values.totalAmount,
      units_consumed:
        values.currReading && values.prevReading
          ? Number(values.currReading) - Number(values.prevReading)
          : undefined,
      rate_per_unit: values.ratePerUnit ? Number(values.ratePerUnit) : undefined,
      meter_reading_start: values.prevReading ? Number(values.prevReading) : undefined,
      meter_reading_end: values.currReading ? Number(values.currReading) : undefined,
      due_date: values.dueDate || undefined,
      allocation_basis: values.allocationBasis,
    }

    if (values.allocationBasis === 'CUSTOM') {
      const customItems: CustomAllocationItem[] = eligibleTenants.map((t) => {
        const share = Number(customAllocations[t.tenant_id] || 0)
        const percentage = values.totalAmount > 0 ? (share / values.totalAmount) * 100 : 0
        return {
          tenant_id: t.tenant_id,
          share_amount: share,
          share_percentage: Number(percentage.toFixed(2)),
        }
      })
      payload.custom_allocations = customItems
    }

    try {
      await createBill(payload).unwrap()
      showSuccessAlert('Electricity bill created successfully')
      handleClose()
      onSuccess()
    } catch (error: any) {
      showErrorAlert(error, 'Create Bill Error')
    }
  }

  const getTenantShare = (tenant: EligibleTenant): string => {
    const total = form.watch('totalAmount') || 0
    const allocationBasis = form.watch('allocationBasis')
    if (total <= 0 || eligibleTenants.length === 0) return '0.00'

    if (allocationBasis === 'CUSTOM') {
      return Number(customAllocations[tenant.tenant_id] || 0).toFixed(2)
    }

    if (allocationBasis === 'RENT_CYCLE_DAYS') {
      const totalDays = eligibleTenants.reduce((sum, t) => sum + t.occupancy_days, 0)
      if (totalDays === 0) return '0.00'
      return ((tenant.occupancy_days / totalDays) * total).toFixed(2)
    }

    return (total / eligibleTenants.length).toFixed(2)
  }


  return (
    <FormDialog
      open={open}
      onOpenChange={(v) => !v && handleClose()}
      title='Add Electricity Bill'
      description='Create a room bill and split it among tenants'
      size='xl'
      footer={
        <>
          <Button variant='outline' onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type='submit' form='electricity-bill-form' disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Bill'}
          </Button>
        </>
      }
    >
      <Form {...form}>
        <form
          id='electricity-bill-form'
          onSubmit={form.handleSubmit(onSubmit)}
          className='space-y-4 overflow-y-auto p-1'
        >
        {validationError ? (
          <div className='flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700'>
            <AlertCircle className='mt-0.5 size-4 shrink-0' />
            <span>{validationError}</span>
          </div>
        ) : null}

        <div className='grid grid-cols-2 gap-3'>
          <FormSelectField
            control={form.control}
            name='selectedMonth'
            label='Billing Month'
            disabled={fetchingTenants}
            options={MONTHS}
          />
          <FormSelectField
            control={form.control}
            name='selectedYear'
            label='Year'
            disabled={fetchingTenants}
            options={yearOptions}
          />
        </div>

        <div className='rounded-lg border-l-4 border-blue-500 bg-blue-50 p-3'>
          <div className='text-xs text-blue-600'>Bill Period</div>
          <div className='text-sm font-semibold text-blue-700'>
            {formatDisplayDate(periodStart)} - {formatDisplayDate(periodEnd)}
          </div>
        </div>

        <div className='space-y-1.5'>
          <Label>
            Total Amount <span className='text-red-500'>*</span>
          </Label>
          <div className='flex'>
            <div className='flex items-center justify-center rounded-l-md border border-r-0 border-input bg-primary/10 px-3'>
              <IndianRupee className='size-4 text-primary' />
            </div>
            <Input
              type='number'
              min='0'
              step='0.01'
              placeholder='Enter total bill amount'
              value={form.watch('totalAmount') || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => form.setValue('totalAmount', Number(e.target.value))}
              className='rounded-l-none'
              disabled={isLoading}
            />
          </div>
        </div>

        <FormSelectField
          control={form.control}
          name='allocationBasis'
          label='Split Method'
          placeholder='Select split method'
          required
          disabled={isLoading}
          options={ALLOCATION_OPTIONS}
          onValueChange={() => {
            form.clearErrors('allocationBasis')
          }}
        />
        {form.watch('allocationBasis') ? (
          <p className='text-xs text-muted-foreground'>
            {form.watch('allocationBasis') === 'EQUAL' && 'The bill total is divided equally among all active tenants in this room.'}
            {form.watch('allocationBasis') === 'RENT_CYCLE_DAYS' &&
              'Each tenant is charged based on their actual stay days during the selected bill period.'}
            {form.watch('allocationBasis') === 'CUSTOM' &&
              'Enter a custom share amount for each active tenant. The total of all shares must equal the bill total.'}
          </p>
        ) : null}

        <Card>
          <CardContent className='p-4'>
            <div className='mb-3 flex items-center justify-between'>
              <h4 className='text-sm font-semibold'>Eligible Tenants ({eligibleTenants.length})</h4>
              {Number(form.watch('totalAmount') || 0) > 0 && !form.watch('allocationBasis') && eligibleTenants.length > 0 ? (
                <span className='text-xs text-muted-foreground'>Equal split preview</span>
              ) : null}
            </div>
            {fetchingTenants ? (
              <div className='py-6 text-center text-sm text-muted-foreground'>Fetching eligible tenants...</div>
            ) : eligibleTenants.length === 0 ? (
              <div className='rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700'>
                No tenants were active in this room during the selected period.
              </div>
            ) : (
              <div className='space-y-2'>
                {eligibleTenants.map((t) => (
                  <div
                    key={t.tenant_id}
                    className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border bg-muted/30 p-3'
                  >
                    <div className='min-w-0 flex-1'>
                      <div className='text-sm font-semibold'>{t.name}</div>
                      {t.phone_no ? <div className='text-xs text-muted-foreground'>{t.phone_no}</div> : null}
                      <div className='text-xs text-muted-foreground'>
                        {formatDisplayDate(t.check_in_date.split('T')[0])}
                        {t.check_out_date ? ` → ${formatDisplayDate(t.check_out_date.split('T')[0])}` : ' → Present'}
                      </div>
                    </div>
                    <div className='flex items-center justify-between sm:justify-end gap-3 sm:gap-4'>
                      <div
                        className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${
                          t.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {t.status === 'ACTIVE' ? 'Active' : 'Checked Out'}
                      </div>
                      <div className='text-xs text-muted-foreground'>{t.occupancy_days} days</div>
                      {form.watch('totalAmount') > 0 && (
                        <div className='text-sm font-bold text-primary'>₹{getTenantShare(t)}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {form.watch('allocationBasis') === 'CUSTOM' && eligibleTenants.length > 0 && (
          <Card>
            <CardContent className='p-4'>
              <h4 className='mb-3 text-sm font-semibold'>Custom Share Amounts</h4>
              <div className='space-y-3'>
                {eligibleTenants.map((t) => (
                  <div key={t.tenant_id}>
                    <Label className='mb-1.5 text-xs'>
                      {t.name} <span className='text-red-500'>*</span>
                    </Label>
                    <div className='flex'>
                      <div className='flex items-center justify-center rounded-l-md border border-r-0 border-input bg-primary/10 px-3'>
                        <IndianRupee className='size-4 text-primary' />
                      </div>
                      <Input
                        value={customAllocations[t.tenant_id] || ''}
                        onChange={(e) =>
                          setCustomAllocations((prev) => ({
                            ...prev,
                            [t.tenant_id]: sanitizeNumeric(e.target.value),
                          }))
                        }
                        placeholder='Share amount'
                        className='rounded-l-none'
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <button
          type='button'
          onClick={() => setOptionalExpanded((v) => !v)}
          className='flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors hover:bg-muted/40'
        >
          <div>
            <div className='text-sm font-semibold'>Optional Details</div>
            <div className='text-xs text-muted-foreground'>Meter reading, due date</div>
          </div>
          {optionalExpanded ? <ChevronUp className='size-4' /> : <ChevronDown className='size-4' />}
        </button>

        {optionalExpanded && (
          <div className='space-y-4 rounded-lg border p-4'>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
              <FormTextInput
                control={form.control}
                name='prevReading'
                label='Previous Reading'
                placeholder='0'
                disabled={isLoading}
              />
              <FormTextInput
                control={form.control}
                name='currReading'
                label='Current Reading'
                placeholder='0'
                disabled={isLoading}
              />
            </div>
            <div className='space-y-1.5'>
              <Label>Rate per Unit</Label>
              <div className='flex'>
                <div className='flex items-center justify-center rounded-l-md border border-r-0 border-input bg-primary/10 px-3'>
                  <IndianRupee className='size-4 text-primary' />
                </div>
                <Input
                  type='number'
                  step='0.01'
                  placeholder='0.00'
                  value={form.watch('ratePerUnit') || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => form.setValue('ratePerUnit', e.target.value)}
                  className='rounded-l-none'
                  disabled={isLoading}
                />
              </div>
            </div>
            {form.watch('prevReading') && form.watch('currReading') && form.watch('ratePerUnit') && Number(form.watch('currReading')) > Number(form.watch('prevReading')) && (
              <div className='rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700'>
                <div>Units consumed: {Number(form.watch('currReading')) - Number(form.watch('prevReading'))}</div>
                <div className='font-semibold'>Auto-calculated total: ₹{form.watch('totalAmount')}</div>
              </div>
            )}
            <div className='space-y-1.5'>
              <Label>Due Date</Label>
              <div className='relative'>
                <Input
                  type='date'
                  value={form.watch('dueDate')}
                  onChange={(e) => form.setValue('dueDate', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}
        </form>
      </Form>
    </FormDialog>
  )
}
