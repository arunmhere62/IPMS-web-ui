import { useEffect, useMemo, useRef, useState } from 'react'
import {
  useDeleteEmployeeMutation,
  useLazyGetEmployeesQuery,
  type Employee,
} from '@/services/employeesApi'
import { useAppSelector } from '@/store/hooks'
import {
  Briefcase,
  CircleAlert,
  Mail,
  Phone,
  Plus,
  Search,
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
import { ActionButtons } from '@/components/form/action-buttons'
import { PageHeader } from '@/components/form/page-header'
import { EmployeeFormDialog } from './EmployeeFormDialog'

type ErrorLike = {
  data?: { message?: string }
  message?: string
}

type PaginationState = {
  allEmployees: Employee[]
  page: number
  hasMore: boolean
  hasLoadedOnce: boolean
}

export function EmployeesScreen() {
  const selectedPGLocationId =
    useAppSelector((s) => s.pgLocations.selectedPGLocationId) ?? null

  const [query, setQuery] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const limit = 20

  const [paginationState, setPaginationState] = useState<PaginationState>({
    allEmployees: [],
    page: 1,
    hasMore: true,
    hasLoadedOnce: false,
  })

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Employee | null>(null)

  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const [trigger, { data: employeesResponse, isLoading, isFetching, error }] =
    useLazyGetEmployeesQuery()
  const [deleteEmployee, { isLoading: deleting }] = useDeleteEmployeeMutation()

  const sentinelRef = useRef<HTMLDivElement>(null)
  const isLoadingMore = useRef(false)

  const queryOptions = useMemo(() => {
    if (!selectedPGLocationId) return undefined
    return {
      page: paginationState.page,
      limit,
      pg_id: selectedPGLocationId,
      search: appliedSearch.trim() || undefined,
    }
  }, [selectedPGLocationId, paginationState.page, limit, appliedSearch])

  // Reset pagination when search or PG location changes
  useEffect(() => {
    setPaginationState({
      allEmployees: [],
      page: 1,
      hasMore: true,
      hasLoadedOnce: false,
    })
  }, [selectedPGLocationId, appliedSearch])

  // Trigger fetch when query options change
  useEffect(() => {
    if (selectedPGLocationId && queryOptions) {
      void trigger(queryOptions)
    }
  }, [trigger, queryOptions, selectedPGLocationId])

  // Update employees list when response data arrives
  useEffect(() => {
    if (employeesResponse?.data) {
      const newEmployees = employeesResponse.data as Employee[]
      const currentPage = queryOptions?.page ?? 1

      setTimeout(() => {
        setPaginationState((prev) => {
          if (currentPage === 1) {
            return {
              ...prev,
              allEmployees: newEmployees,
              hasMore: Boolean(employeesResponse.pagination?.hasMore),
              hasLoadedOnce: true,
            }
          } else {
            const existingIds = new Set(prev.allEmployees.map((e) => e.s_no))
            const uniqueNew = newEmployees.filter(
              (e) => !existingIds.has(e.s_no)
            )
            return {
              ...prev,
              allEmployees: [...prev.allEmployees, ...uniqueNew],
              hasMore: Boolean(employeesResponse.pagination?.hasMore),
              hasLoadedOnce: true,
            }
          }
        })
        isLoadingMore.current = false
      }, 0)
    }
  }, [employeesResponse, queryOptions])

  // Infinite scroll - IntersectionObserver
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          paginationState.hasMore &&
          !isFetching &&
          !isLoading &&
          paginationState.hasLoadedOnce &&
          !isLoadingMore.current
        ) {
          isLoadingMore.current = true
          setPaginationState((prev) => ({
            ...prev,
            page: prev.page + 1,
          }))
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [paginationState.hasMore, isFetching, isLoading, paginationState.hasLoadedOnce])

  const employees = paginationState.allEmployees

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
      setPaginationState({
        allEmployees: [],
        page: 1,
        hasMore: true,
        hasLoadedOnce: false,
      })
    } catch (e: unknown) {
      showErrorAlert(e, 'Delete Error')
    }
  }

  const totalCount =
    employeesResponse?.pagination?.total ?? employees.length

  return (
    <div className='container mx-auto max-w-6xl px-4 py-4'>
      <PageHeader
        title='Employees'
        subtitle={`${totalCount} total`}
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
        <div className='mt-4'>
          <Alert variant='destructive'>
            <CircleAlert />
            <AlertTitle>Failed to load employees</AlertTitle>
            <AlertDescription>{fetchErrorMessage}</AlertDescription>
          </Alert>
        </div>
      ) : null}

      {/* Search bar */}
      <div className='mt-4 flex items-center gap-2'>
        <div className='relative flex-1'>
          <Search className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
          <input
            type='text'
            placeholder='Search employees...'
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              if (e.target.value === '' && appliedSearch) {
                setAppliedSearch('')
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setAppliedSearch(query)
              }
            }}
            disabled={!selectedPGLocationId}
            className='h-10 w-full rounded-lg border border-border bg-muted pl-10 pr-4 text-sm outline-none focus:border-primary disabled:opacity-50'
          />
        </div>
        <Button
          size='sm'
          variant='outline'
          onClick={() => setAppliedSearch(query)}
          disabled={!selectedPGLocationId}
        >
          <Search className='size-4' />
        </Button>
      </div>

      {/* Count */}
      <div className='mt-4 mb-2 flex items-center gap-2 text-sm text-muted-foreground'>
        <Users className='size-4' />
        <span>{employees.length} of {totalCount} Employees</span>
      </div>

      {!selectedPGLocationId ? (
        <div className='mt-4'>
          <EmptyState
            emoji='📍'
            title='Select a PG Location'
            description='Choose a PG from the top bar.'
          />
        </div>
      ) : (
        <div className='mt-2'>
          {isLoading ? (
            <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
              {Array.from({ length: 6 }).map((_, index) => (
                <Card key={`skeleton-${index}`} className='py-0'>
                  <CardContent className='p-4'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-2'>
                        <div className='size-10 animate-pulse rounded-xl bg-muted' />
                        <div className='space-y-1.5'>
                          <div className='h-4 w-28 animate-pulse rounded bg-muted' />
                          <div className='h-3 w-16 animate-pulse rounded bg-muted' />
                        </div>
                      </div>
                      <div className='h-6 w-16 animate-pulse rounded bg-muted' />
                    </div>
                    <div className='mt-3 space-y-2'>
                      <div className='h-3 w-full animate-pulse rounded bg-muted' />
                      <div className='h-3 w-3/4 animate-pulse rounded bg-muted' />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : employees.length === 0 ? (
            <EmptyState
              icon={Users}
              title='No Employees Found'
              description={
                appliedSearch
                  ? 'Try adjusting your search.'
                  : 'Add your first employee.'
              }
            />
          ) : (
            <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
              {employees.map((e) => (
                <Card key={e.s_no} className='py-0 transition-colors hover:border-blue-500/50'>
                  <CardContent className='p-4'>
                    {/* Name + status badge */}
                    <div className='flex items-start justify-between gap-2'>
                      <h3 className='flex-1 text-base font-bold'>
                        {e.name}
                      </h3>
                      <span
                        className={`shrink-0 rounded-md px-2 py-1 text-xs font-semibold ${
                          e.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-600'
                            : 'bg-red-100 text-red-600'
                        }`}
                      >
                        {e.status}
                      </span>
                    </div>

                    {/* Role */}
                    <div className='mt-2.5 flex items-center gap-1.5'>
                      <Briefcase className='size-3.5 shrink-0 text-muted-foreground' />
                      <span className='text-sm text-muted-foreground'>
                        {e.roles?.role_name ?? 'N/A'}
                      </span>
                    </div>

                    {/* Email */}
                    {e.email && (
                      <div className='mt-1.5 flex items-center gap-1.5'>
                        <Mail className='size-3.5 shrink-0 text-muted-foreground' />
                        <span className='truncate text-sm text-muted-foreground'>
                          {e.email}
                        </span>
                      </div>
                    )}

                    {/* Phone */}
                    {e.phone && (
                      <div className='mt-1.5 flex items-center gap-1.5'>
                        <Phone className='size-3.5 shrink-0 text-muted-foreground' />
                        <span className='text-sm text-muted-foreground'>
                          {e.phone}
                        </span>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className='mt-3 border-t pt-2.5'>
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
              <div ref={sentinelRef} className='h-4' />

              {isFetching && paginationState.hasMore && (
                <div className='mt-3 flex items-center justify-center py-4'>
                  <div className='size-5 animate-spin rounded-full border-2 border-primary border-t-transparent'></div>
                  <span className='ml-2 text-xs text-muted-foreground'>
                    Loading more...
                  </span>
                </div>
              )}

              {!paginationState.hasMore && employees.length > 0 && (
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
          setPaginationState({
            allEmployees: [],
            page: 1,
            hasMore: true,
            hasLoadedOnce: false,
          })
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
