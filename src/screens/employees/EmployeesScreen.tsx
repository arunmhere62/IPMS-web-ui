import { useEffect, useMemo, useReducer, useRef, useState } from 'react'
import {
  useDeleteEmployeeMutation,
  useGetEmployeesQuery,
  type Employee,
} from '@/services/employeesApi'
import { useAppSelector } from '@/store/hooks'
import {
  CircleAlert,
  Mail,
  Phone,
  Plus,
  Search,
  User,
  Users,
} from 'lucide-react'
import { showErrorAlert, showSuccessAlert } from '@/utils/toast'
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
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { ActionButtons } from '@/components/form/action-buttons'
import { PageHeader } from '@/components/form/page-header'
import { EmployeeFormDialog } from './EmployeeFormDialog'

type ErrorLike = {
  data?: { message?: string }
  message?: string
}

type EmployeesState = {
  page: number
  allEmployees: Employee[]
  hasMore: boolean
}

type EmployeesAction =
  | { type: 'RESET' }
  | { type: 'SET_PAGE'; page: number }
  | { type: 'ADD_EMPLOYEES'; page: number; data: Employee[]; hasMore: boolean }

function employeesReducer(
  state: EmployeesState,
  action: EmployeesAction
): EmployeesState {
  switch (action.type) {
    case 'RESET': {
      return {
        page: 1,
        allEmployees: [],
        hasMore: true,
      }
    }
    case 'SET_PAGE': {
      return {
        ...state,
        page: action.page,
      }
    }
    case 'ADD_EMPLOYEES': {
      return {
        ...state,
        allEmployees:
          action.page === 1
            ? action.data
            : [...state.allEmployees, ...action.data],
        hasMore: action.hasMore,
      }
    }
    default:
      return state
  }
}

export function EmployeesScreen() {
  const selectedPGLocationId =
    useAppSelector((s) => s.pgLocations.selectedPGLocationId) ?? null

  const [query, setQuery] = useState('')
  const limit = 20
  const [state, dispatch] = useReducer(employeesReducer, {
    page: 1,
    allEmployees: [],
    hasMore: true,
  })

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Employee | null>(null)

  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const {
    data: employeesResponse,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useGetEmployeesQuery(
    {
      page: state.page,
      limit,
      pg_id: selectedPGLocationId ?? undefined,
      search: query.trim() ? query.trim() : undefined,
    },
    { skip: !selectedPGLocationId }
  )

  const [deleteEmployee, { isLoading: deleting }] = useDeleteEmployeeMutation()

  const sentinelRef = useRef<HTMLDivElement>(null)

  // Update all employees when new data is fetched
  useEffect(() => {
    if (employeesResponse?.data) {
      const newEmployees = employeesResponse.data as Employee[]
      dispatch({
        type: 'ADD_EMPLOYEES',
        page: state.page,
        data: newEmployees,
        hasMore: Boolean(employeesResponse.pagination?.hasMore),
      })
    }
  }, [employeesResponse, state.page])

  // Reset when query or location changes
  useEffect(() => {
    dispatch({ type: 'RESET' })
  }, [query, selectedPGLocationId])

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          state.hasMore &&
          !isFetching &&
          !isLoading
        ) {
          dispatch({ type: 'SET_PAGE', page: state.page + 1 })
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [state.hasMore, isFetching, isLoading, state.page])

  const employees = state.allEmployees

  const fetchErrorMessage =
    (error as ErrorLike | undefined)?.data?.message ||
    (error as ErrorLike | undefined)?.message

  const openCreate = () => {
    setEditTarget(null)
    setDialogOpen(true)
  }

  const openEdit = (emp: Employee) => {
    setEditTarget(emp)
    setDialogOpen(true)
  }

  const askDelete = (emp: Employee) => {
    setDeleteTarget(emp)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteEmployee(deleteTarget.s_no).unwrap()
      showSuccessAlert('Employee deleted successfully')
      setDeleteDialogOpen(false)
      setDeleteTarget(null)
      dispatch({ type: 'RESET' })
      void refetch()
    } catch (e: unknown) {
      showErrorAlert(e, 'Delete Error')
    }
  }

  const countLabel = useMemo(() => {
    if (!selectedPGLocationId) return 'Select PG'
    return `${employees.length} Employees`
  }, [employees.length, selectedPGLocationId])

  return (
    <div className='container mx-auto max-w-7xl px-4 py-4'>
      <PageHeader
        title='Employees'
        showBack={true}
        right={
          <Button
            size='sm'
            onClick={openCreate}
            disabled={!selectedPGLocationId}
            className='bg-black text-white hover:bg-black/90'
          >
            <Plus className='mr-1 size-3.5' />
            Add Employee
          </Button>
        }
      />

      {fetchErrorMessage ? (
        <div className='mt-3 mb-3'>
          <Alert variant='destructive'>
            <CircleAlert />
            <AlertTitle>Failed to load employees</AlertTitle>
            <AlertDescription>{fetchErrorMessage}</AlertDescription>
          </Alert>
        </div>
      ) : null}

      <div className='mt-3 mb-3 flex items-center justify-between gap-3'>
        <div className='relative max-w-sm flex-1'>
          <Search className='pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground' />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              dispatch({ type: 'RESET' })
            }}
            placeholder='Search employees...'
            className='h-8 pl-8 text-sm'
            disabled={!selectedPGLocationId}
          />
        </div>
        <div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
          <Users className='size-3.5' />
          <span>{countLabel}</span>
        </div>
      </div>

      {!selectedPGLocationId ? (
        <EmptyState
          icon={Users}
          title='Select a PG Location'
          description='Choose a PG from the top bar.'
        />
      ) : (
        <div>
          {isLoading ? (
            <div className='rounded-lg border bg-card px-4 py-8 text-center'>
              <div className='mx-auto size-6 animate-spin rounded-full border-2 border-primary border-t-transparent'></div>
              <p className='mt-2 text-xs text-muted-foreground'>Loading...</p>
            </div>
          ) : employees.length === 0 ? (
            <EmptyState
              icon={Users}
              title='No Employees Found'
              description={
                query
                  ? 'Try adjusting your search.'
                  : 'Add your first employee.'
              }
            />
          ) : (
            <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
              {employees.map((e) => (
                <Card key={e.s_no} className='py-0 hover:border-primary/50'>
                  <CardContent className='p-3'>
                    <div className='mb-2 flex items-center gap-2'>
                      <div className='flex size-9 items-center justify-center rounded-lg bg-black text-white'>
                        <User className='size-4' />
                      </div>
                      <div className='min-w-0 flex-1'>
                        <div className='truncate text-sm font-semibold'>
                          {e.name}
                        </div>
                        <div className='text-xs text-muted-foreground'>
                          ID: {e.s_no}
                        </div>
                      </div>
                    </div>

                    <div className='mb-2 flex items-center justify-between border-t pt-2'>
                      <span className='text-xs text-muted-foreground'>
                        Role
                      </span>
                      <span className='text-xs font-medium'>
                        {e.roles?.role_name ?? 'N/A'}
                      </span>
                    </div>

                    {(e.email || e.phone) && (
                      <div className='mb-2 space-y-1 border-t pt-2'>
                        {e.email && (
                          <div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
                            <Mail className='size-3' />
                            <span className='truncate'>{e.email}</span>
                          </div>
                        )}
                        {e.phone && (
                          <div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
                            <Phone className='size-3' />
                            <span>{e.phone}</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className='flex items-center justify-between border-t pt-2'>
                      <div className='text-xs font-medium text-primary'>
                        {String(e.status ?? 'ACTIVE')}
                      </div>
                      <ActionButtons
                        mode='icon'
                        viewTo={`/employees/${e.s_no}`}
                        onEdit={() => openEdit(e)}
                        onDelete={() => askDelete(e)}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {employees.length > 0 && (
            <>
              {/* Sentinel element for infinite scroll */}
              <div ref={sentinelRef} className='h-4' />

              {/* Loading indicator at the bottom */}
              {isFetching && state.hasMore && (
                <div className='mt-3 flex items-center justify-center py-4'>
                  <div className='size-5 animate-spin rounded-full border-2 border-primary border-t-transparent'></div>
                  <span className='ml-2 text-xs text-muted-foreground'>
                    Loading more...
                  </span>
                </div>
              )}

              {/* End of list indicator */}
              {!state.hasMore && employees.length > 0 && (
                <div className='mt-3 py-4 text-center text-xs text-muted-foreground'>
                  No more employees to load
                </div>
              )}
            </>
          )}
        </div>
      )}

      <EmployeeFormDialog
        open={dialogOpen}
        onOpenChange={(open: boolean) => {
          setDialogOpen(open)
          if (!open) setEditTarget(null)
        }}
        editTarget={editTarget}
        onSaved={() => {
          setDialogOpen(false)
          setEditTarget(null)
          dispatch({ type: 'RESET' })
          void refetch()
        }}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Employee</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <span className='font-semibold'>{deleteTarget?.name}</span>? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setDeleteDialogOpen(false)
                setDeleteTarget(null)
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
