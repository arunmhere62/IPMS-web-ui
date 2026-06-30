import { useEffect, useMemo, useReducer, useState } from 'react'
import {
  type Expense,
  PaymentMethod,
  useDeleteExpenseMutation,
  useLazyGetExpensesQuery,
} from '@/services/expensesApi'
import { useAppSelector } from '@/store/hooks'
import type { RootState } from '@/store/store'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar,
  CircleAlert,
  FilterX,
  Plus,
  Receipt,
  SlidersHorizontal,
} from 'lucide-react'
import { showErrorAlert, showSuccessAlert } from '@/utils/toast'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ActionButtons } from '@/components/form/action-buttons'
import { PageHeader } from '@/components/form/page-header'
import { AddEditExpenseDialog } from './AddEditExpenseDialog'

type ErrorLike = {
  data?: { message?: string }
  message?: string
}

type ExpensesState = {
  page: number
  allExpenses: Expense[]
  hasMore: boolean
  hasLoadedOnce: boolean
}

type ExpensesAction =
  | { type: 'RESET' }
  | { type: 'SET_PAGE'; page: number }
  | { type: 'ADD_EXPENSES'; page: number; data: Expense[]; hasMore: boolean }

function expensesReducer(
  state: ExpensesState,
  action: ExpensesAction
): ExpensesState {
  switch (action.type) {
    case 'RESET':
      return { page: 1, allExpenses: [], hasMore: true, hasLoadedOnce: false }
    case 'SET_PAGE':
      return { ...state, page: action.page }
    case 'ADD_EXPENSES': {
      const existingIds = new Set(state.allExpenses.map((e) => e.s_no))
      const newExpenses = action.data.filter((e) => !existingIds.has(e.s_no))
      return {
        ...state,
        allExpenses:
          action.page === 1
            ? action.data
            : [...state.allExpenses, ...newExpenses],
        hasMore: action.hasMore,
        hasLoadedOnce: true,
      }
    }
    default:
      return state
  }
}

const MONTHS = [
  { label: 'January', value: 1 },
  { label: 'February', value: 2 },
  { label: 'March', value: 3 },
  { label: 'April', value: 4 },
  { label: 'May', value: 5 },
  { label: 'June', value: 6 },
  { label: 'July', value: 7 },
  { label: 'August', value: 8 },
  { label: 'September', value: 9 },
  { label: 'October', value: 10 },
  { label: 'November', value: 11 },
  { label: 'December', value: 12 },
]

const formatDate = (value?: string) => {
  const s = String(value ?? '')
  if (!s) return '—'
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return s.includes('T') ? s.split('T')[0] : s
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const formatAmount = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)

const paymentMethodBadgeColor = (method: PaymentMethod) => {
  switch (method) {
    case PaymentMethod.GPAY:
      return 'bg-blue-100 text-blue-700'
    case PaymentMethod.PHONEPE:
      return 'bg-purple-100 text-purple-700'
    case PaymentMethod.CASH:
      return 'bg-green-100 text-green-700'
    case PaymentMethod.BANK_TRANSFER:
      return 'bg-amber-100 text-amber-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

const paymentMethodLabel = (method: PaymentMethod) => {
  switch (method) {
    case PaymentMethod.GPAY:
      return 'GPay'
    case PaymentMethod.PHONEPE:
      return 'PhonePe'
    case PaymentMethod.CASH:
      return 'Cash'
    case PaymentMethod.BANK_TRANSFER:
      return 'Bank Transfer'
    default:
      return method
  }
}

export function ExpensesScreen() {
  const selectedPGLocationId = useAppSelector(
    (s: RootState) => s.pgLocations?.selectedPGLocationId
  )

  const limit = 20
  const [state, dispatch] = useReducer(expensesReducer, {
    page: 1,
    allExpenses: [],
    hasMore: true,
    hasLoadedOnce: false,
  })

  const [appliedMonth, setAppliedMonth] = useState<number | null>(null)
  const [appliedYear, setAppliedYear] = useState<number | null>(null)
  const [draftMonth, setDraftMonth] = useState<number | null>(null)
  const [draftYear, setDraftYear] = useState<number | null>(null)
  const [filterOpen, setFilterOpen] = useState(false)

  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editExpense, setEditExpense] = useState<Expense | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null)

  const currentYear = new Date().getFullYear()
  const years = useMemo(
    () => [currentYear, currentYear - 1, currentYear - 2],
    [currentYear]
  )

  const queryArgs = useMemo(() => {
    if (!selectedPGLocationId) return undefined
    return {
      page: state.page,
      limit,
      month: appliedMonth ?? undefined,
      year: appliedYear ?? undefined,
    }
  }, [state.page, limit, selectedPGLocationId, appliedMonth, appliedYear])

  const [trigger, { data: expensesResponse, isLoading, isFetching, error }] =
    useLazyGetExpensesQuery()

  const [deleteExpense, { isLoading: deleting }] = useDeleteExpenseMutation()

  useEffect(() => {
    dispatch({ type: 'RESET' })
  }, [selectedPGLocationId, appliedMonth, appliedYear])

  useEffect(() => {
    if (selectedPGLocationId && queryArgs) {
      void trigger(queryArgs)
    }
  }, [trigger, selectedPGLocationId, queryArgs])

  const { isFetching: isInfiniteFetching, checkScroll } = useInfiniteScroll({
    hasMore: state.hasMore,
    isLoading: isFetching,
  })

  useEffect(() => {
    if (expensesResponse?.data) {
      dispatch({
        type: 'ADD_EXPENSES',
        page: state.page,
        data: expensesResponse.data,
        hasMore:
          (expensesResponse.pagination as { hasMore?: boolean } | undefined)
            ?.hasMore ?? false,
      })
      setTimeout(() => checkScroll(), 100)
    }
  }, [expensesResponse, state.page, checkScroll])

  useEffect(() => {
    if (
      isInfiniteFetching &&
      state.hasMore &&
      !isFetching &&
      selectedPGLocationId
    ) {
      const nextPage = state.page + 1
      dispatch({ type: 'SET_PAGE', page: nextPage })
      void trigger({ ...queryArgs!, page: nextPage })
    }
  }, [
    isInfiniteFetching,
    state.hasMore,
    isFetching,
    state.page,
    trigger,
    selectedPGLocationId,
    queryArgs,
  ])

  const expenses = state.allExpenses

  const refetch = () => {
    dispatch({ type: 'RESET' })
    if (selectedPGLocationId && queryArgs) {
      void trigger(queryArgs)
    }
  }

  const fetchErrorMessage =
    (error as ErrorLike | undefined)?.data?.message ||
    (error as ErrorLike | undefined)?.message

  const applyFilters = () => {
    setAppliedMonth(draftMonth)
    setAppliedYear(draftYear)
    setFilterOpen(false)
  }

  const clearFilters = () => {
    setDraftMonth(null)
    setDraftYear(null)
    setAppliedMonth(null)
    setAppliedYear(null)
    setFilterOpen(false)
  }

  const openFilters = () => {
    setDraftMonth(appliedMonth)
    setDraftYear(appliedYear)
    setFilterOpen(true)
  }

  const hasActiveFilters = appliedMonth !== null || appliedYear !== null

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteExpense(deleteTarget.s_no).unwrap()
      showSuccessAlert('Expense deleted successfully')
      setDeleteTarget(null)
      refetch()
    } catch (e) {
      showErrorAlert(e, 'Delete Error')
    }
  }

  const activeFilterLabel = [
    appliedMonth ? MONTHS.find((m) => m.value === appliedMonth)?.label : null,
    appliedYear ? String(appliedYear) : null,
  ]
    .filter(Boolean)
    .join(', ')

  return (
    <div className='container mx-auto max-w-6xl px-4 py-4'>
      <PageHeader
        title='Expenses'
        showBack={true}
        subtitle={
          state.hasLoadedOnce
            ? `${expensesResponse?.pagination?.total ?? expenses.length} expenses`
            : undefined
        }
        right={
          <div className='flex items-center gap-2'>
            <Popover open={filterOpen} onOpenChange={setFilterOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={openFilters}
                  className={
                    hasActiveFilters ? 'border-primary text-primary' : ''
                  }
                >
                  <SlidersHorizontal className='mr-1.5 size-4' />
                  Filters
                  {hasActiveFilters && (
                    <Badge
                      variant='secondary'
                      className='ml-1.5 px-1.5 text-xs'
                    >
                      {activeFilterLabel}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className='w-80 p-4' align='end'>
                <div className='mb-3 text-sm font-semibold'>
                  Filter Expenses
                </div>

                <div className='mb-4'>
                  <div className='mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase'>
                    Month
                  </div>
                  <div className='flex flex-wrap gap-1.5'>
                    <button
                      type='button'
                      onClick={() => setDraftMonth(null)}
                      className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                        draftMonth === null
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-input text-foreground hover:bg-muted/40'
                      }`}
                    >
                      All
                    </button>
                    {MONTHS.map((m) => (
                      <button
                        key={m.value}
                        type='button'
                        onClick={() => setDraftMonth(m.value)}
                        className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                          draftMonth === m.value
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-input text-foreground hover:bg-muted/40'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className='mb-4'>
                  <div className='mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase'>
                    Year
                  </div>
                  <div className='flex flex-wrap gap-1.5'>
                    <button
                      type='button'
                      onClick={() => setDraftYear(null)}
                      className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                        draftYear === null
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-input text-foreground hover:bg-muted/40'
                      }`}
                    >
                      All
                    </button>
                    {years.map((y) => (
                      <button
                        key={y}
                        type='button'
                        onClick={() => setDraftYear(y)}
                        className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                          draftYear === y
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-input text-foreground hover:bg-muted/40'
                        }`}
                      >
                        {y}
                      </button>
                    ))}
                  </div>
                </div>

                <div className='flex gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    className='flex-1'
                    onClick={clearFilters}
                  >
                    <FilterX className='mr-1.5 size-3.5' />
                    Clear
                  </Button>
                  <Button size='sm' className='flex-1' onClick={applyFilters}>
                    Apply
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            <Button size='sm' onClick={() => setShowAddDialog(true)}>
              <Plus className='mr-1.5 size-4' />
              Add Expense
            </Button>
          </div>
        }
      />

      {!selectedPGLocationId ? (
        <div className='mt-4 rounded-md border bg-card px-3 py-4 text-sm text-muted-foreground'>
          Select a PG location to view expenses.
        </div>
      ) : null}

      {fetchErrorMessage ? (
        <div className='mt-4'>
          <Alert variant='destructive'>
            <CircleAlert />
            <AlertTitle>Error Loading Expenses</AlertTitle>
            <AlertDescription>{fetchErrorMessage}</AlertDescription>
          </Alert>
        </div>
      ) : null}

      <div className='mt-4 pb-16'>
        {isLoading ? (
          <div className='space-y-3'>
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={`skeleton-${index}`}
                className='rounded-lg border bg-card p-4'
              >
                <div className='flex items-start justify-between gap-3'>
                  <div className='flex-1 space-y-2'>
                    <div className='h-5 w-36 animate-pulse rounded bg-gray-200' />
                    <div className='h-3.5 w-24 animate-pulse rounded bg-gray-200' />
                    <div className='h-3.5 w-32 animate-pulse rounded bg-gray-200' />
                  </div>
                  <div className='h-6 w-20 animate-pulse rounded bg-gray-200' />
                </div>
              </div>
            ))}
          </div>
        ) : expenses.length === 0 && state.hasLoadedOnce ? (
          <div className='rounded-lg border bg-card px-6 py-16 text-center'>
            <Receipt className='mx-auto mb-4 size-12 text-muted-foreground/40' />
            <div className='text-lg font-semibold'>No Expenses Found</div>
            <div className='mt-2 text-sm text-muted-foreground'>
              {hasActiveFilters
                ? 'No expenses match the selected filters.'
                : 'Click "Add Expense" to record your first expense.'}
            </div>
          </div>
        ) : (
          <div className='space-y-4'>
            <AnimatePresence>
              {expenses.map((expense, index) => (
                <motion.div
                  key={`expense-${expense.s_no}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{
                    duration: 0.25,
                    delay: index * 0.04,
                    ease: 'easeOut',
                  }}
                >
                  <Card className='border bg-card'>
                    <CardContent className='p-4'>
                      <div className='flex items-start justify-between gap-3'>
                        <div className='min-w-0 flex-1'>
                          <div className='flex items-center gap-2'>
                            <p className='truncate text-sm font-semibold text-foreground'>
                              {expense.expense_type}
                            </p>
                            <span
                              className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium ${paymentMethodBadgeColor(expense.payment_method)}`}
                            >
                              {paymentMethodLabel(expense.payment_method)}
                            </span>
                          </div>

                          <p className='mt-1 text-xs text-muted-foreground'>
                            Paid to:{' '}
                            <span className='font-medium text-foreground'>
                              {expense.paid_to}
                            </span>
                          </p>

                          <div className='mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground'>
                            <Calendar className='size-3 shrink-0' />
                            <span>{formatDate(expense.paid_date)}</span>
                          </div>

                          {expense.remarks ? (
                            <p className='mt-1.5 text-xs text-muted-foreground italic'>
                              {expense.remarks}
                            </p>
                          ) : null}
                        </div>

                        <div className='flex shrink-0 flex-col items-end gap-2'>
                          <p className='text-base font-bold text-destructive'>
                            {formatAmount(Number(expense.amount))}
                          </p>
                          <ActionButtons
                            onEdit={() => setEditExpense(expense)}
                            onDelete={() => setDeleteTarget(expense)}
                            mode='icon'
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>

            {isFetching && state.hasLoadedOnce ? (
              <div className='flex justify-center py-4'>
                <div className='h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent' />
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <AddEditExpenseDialog
        open={showAddDialog || editExpense !== null}
        expense={editExpense}
        onClose={() => {
          setShowAddDialog(false)
          setEditExpense(null)
        }}
        onSave={() => {
          setShowAddDialog(false)
          setEditExpense(null)
          refetch()
        }}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Expense</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this expense of{' '}
              <strong>
                {deleteTarget ? formatAmount(Number(deleteTarget.amount)) : ''}
              </strong>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              className='text-destructive-foreground bg-destructive hover:bg-destructive/90'
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
