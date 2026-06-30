import { useState } from 'react'
import {
  type Expense,
  PaymentMethod,
  useCreateExpenseMutation,
  useUpdateExpenseMutation,
  type CreateExpenseDto,
} from '@/services/expensesApi'
import { showErrorAlert, showSuccessAlert } from '@/utils/toast'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DatePicker } from '@/components/form/date-picker'
import { OptionSelector } from '@/components/form/option-selector'

const EXPENSE_TYPES = [
  'Electricity Bill',
  'Water Bill',
  'Internet Bill',
  'Maintenance',
  'Repairs',
  'Groceries',
  'Cleaning',
  'Security',
  'Salary',
]

const PAYMENT_METHODS: { label: string; value: string; icon: string }[] = [
  { label: 'GPay', value: PaymentMethod.GPAY, icon: '💰' },
  { label: 'PhonePe', value: PaymentMethod.PHONEPE, icon: '📱' },
  { label: 'Cash', value: PaymentMethod.CASH, icon: '💵' },
  { label: 'Bank Transfer', value: PaymentMethod.BANK_TRANSFER, icon: '🏦' },
]

interface AddEditExpenseDialogProps {
  open: boolean
  expense: Expense | null
  onClose: () => void
  onSave: () => void
}

// Inner form is mounted fresh each open via key, so useState initializers run on every open
function ExpenseForm({
  expense,
  onClose,
  onSave,
}: Omit<AddEditExpenseDialogProps, 'open'>) {
  const [createExpense, { isLoading: creating }] = useCreateExpenseMutation()
  const [updateExpense, { isLoading: updating }] = useUpdateExpenseMutation()

  const isLoading = creating || updating

  const isCustomType = expense
    ? !EXPENSE_TYPES.includes(expense.expense_type)
    : false

  const [expenseType, setExpenseType] = useState(
    isCustomType ? '' : (expense?.expense_type ?? '')
  )
  const [customExpenseType, setCustomExpenseType] = useState(
    isCustomType ? (expense?.expense_type ?? '') : ''
  )
  const [showCustomType, setShowCustomType] = useState(isCustomType)
  const [amount, setAmount] = useState(expense ? String(expense.amount) : '')
  const [paidTo, setPaidTo] = useState(expense?.paid_to ?? '')
  const [paidDate, setPaidDate] = useState<Date | undefined>(
    expense ? new Date(expense.paid_date.split('T')[0]) : new Date()
  )
  const [paymentMethod, setPaymentMethod] = useState<string>(
    expense?.payment_method ?? PaymentMethod.CASH
  )
  const [remarks, setRemarks] = useState(expense?.remarks ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const newErrors: Record<string, string> = {}
    const finalExpenseType = showCustomType ? customExpenseType : expenseType
    if (!finalExpenseType.trim())
      newErrors.expenseType = 'Expense type is required'
    if (!amount.trim()) newErrors.amount = 'Amount is required'
    else if (isNaN(Number(amount)) || Number(amount) <= 0)
      newErrors.amount = 'Amount must be a positive number'
    if (!paidTo.trim()) newErrors.paidTo = 'Paid to is required'
    if (!paidDate) newErrors.paidDate = 'Date is required'
    if (!paymentMethod) newErrors.paymentMethod = 'Payment method is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return

    try {
      const finalExpenseType = showCustomType ? customExpenseType : expenseType
      const data: CreateExpenseDto = {
        expense_type: finalExpenseType.trim(),
        amount: Number(amount),
        paid_to: paidTo.trim(),
        paid_date: paidDate!.toISOString().split('T')[0],
        payment_method: paymentMethod as PaymentMethod,
        remarks: remarks.trim() || undefined,
      }

      if (expense) {
        await updateExpense({ id: expense.s_no, data }).unwrap()
        showSuccessAlert('Expense updated successfully')
      } else {
        await createExpense(data).unwrap()
        showSuccessAlert('Expense added successfully')
      }

      onSave()
      onClose()
    } catch (error) {
      showErrorAlert(error, 'Expense Error')
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{expense ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
        <DialogDescription>
          {expense ? 'Update expense details' : 'Record a new expense'}
        </DialogDescription>
      </DialogHeader>

      <div className='flex flex-col gap-5 py-2'>
        {/* Expense Type */}
        <div className='flex flex-col gap-2'>
          <Label>
            Expense Type <span className='text-destructive'>*</span>
          </Label>

          {/* Toggle predefined / custom */}
          <div className='flex gap-2'>
            <button
              type='button'
              onClick={() => {
                setShowCustomType(false)
                setCustomExpenseType('')
              }}
              className={`flex-1 rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
                !showCustomType
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-input text-muted-foreground hover:bg-muted/40'
              }`}
            >
              Predefined Types
            </button>
            <button
              type='button'
              onClick={() => {
                setShowCustomType(true)
                setExpenseType('')
              }}
              className={`flex-1 rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
                showCustomType
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-input text-muted-foreground hover:bg-muted/40'
              }`}
            >
              Custom Type
            </button>
          </div>

          {!showCustomType ? (
            <div className='flex flex-wrap gap-2'>
              {EXPENSE_TYPES.map((type) => (
                <button
                  key={type}
                  type='button'
                  onClick={() => setExpenseType(type)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    expenseType === type
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-input text-foreground hover:bg-muted/40'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          ) : (
            <Input
              placeholder='Enter custom expense type (e.g., Gas Bill, Pest Control)'
              value={customExpenseType}
              onChange={(e) => setCustomExpenseType(e.target.value)}
              autoFocus
            />
          )}
          {errors.expenseType && (
            <p className='text-xs text-destructive'>{errors.expenseType}</p>
          )}
        </div>

        {/* Amount */}
        <div className='flex flex-col gap-2'>
          <Label htmlFor='amount'>
            Amount <span className='text-destructive'>*</span>
          </Label>
          <div className='relative'>
            <span className='absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground'>
              ₹
            </span>
            <Input
              id='amount'
              type='number'
              min='0'
              placeholder='0.00'
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className='pl-7'
            />
          </div>
          {errors.amount && (
            <p className='text-xs text-destructive'>{errors.amount}</p>
          )}
        </div>

        {/* Paid To */}
        <div className='flex flex-col gap-2'>
          <Label htmlFor='paidTo'>
            Paid To <span className='text-destructive'>*</span>
          </Label>
          <Input
            id='paidTo'
            placeholder='Enter person or company name'
            value={paidTo}
            onChange={(e) => setPaidTo(e.target.value)}
          />
          {errors.paidTo && (
            <p className='text-xs text-destructive'>{errors.paidTo}</p>
          )}
        </div>

        {/* Date */}
        <div className='flex flex-col gap-2'>
          <Label>
            Date <span className='text-destructive'>*</span>
          </Label>
          <DatePicker
            selected={paidDate}
            onSelect={setPaidDate}
            placeholder='Select expense date'
          />
          {errors.paidDate && (
            <p className='text-xs text-destructive'>{errors.paidDate}</p>
          )}
        </div>

        {/* Payment Method */}
        <OptionSelector
          label='Payment Method'
          description='Select how the expense was paid'
          options={PAYMENT_METHODS}
          selectedValue={paymentMethod}
          onSelect={(v) => v && setPaymentMethod(v)}
          required
          disabled={isLoading}
          error={errors.paymentMethod}
        />

        {/* Remarks */}
        <div className='flex flex-col gap-2'>
          <Label htmlFor='remarks'>Remarks (Optional)</Label>
          <Textarea
            id='remarks'
            placeholder='Add any additional notes'
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows={3}
          />
        </div>
      </div>

      <DialogFooter>
        <Button variant='outline' onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? 'Saving…' : expense ? 'Update Expense' : 'Add Expense'}
        </Button>
      </DialogFooter>
    </>
  )
}

export function AddEditExpenseDialog({
  open,
  expense,
  onClose,
  onSave,
}: AddEditExpenseDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className='max-h-[90vh] max-w-lg overflow-y-auto'>
        {open ? (
          <ExpenseForm
            key={`${expense?.s_no ?? 'new'}-${open}`}
            expense={expense}
            onClose={onClose}
            onSave={onSave}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
