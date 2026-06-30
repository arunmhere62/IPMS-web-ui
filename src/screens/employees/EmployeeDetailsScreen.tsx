import { useState, useMemo } from 'react'
import {
  useGetEmployeeByIdQuery,
  useDeleteEmployeeMutation,
  useToggleUserStatusMutation,
  type Employee,
} from '@/services/employeesApi'
import {
  useGetPgUserAssignmentQuery,
  useUpdatePgUserSalaryMutation,
} from '@/services/pgUsersApi'
import { useGetUserPermissionsQuery } from '@/services/rbacApi'
import { useAppSelector } from '@/store/hooks'
import type { RootState } from '@/store/store'
import type { AuthUser } from '@/store/slices/authSlice'
import {
  CircleAlert,
  User,
  MapPin,
  FileText,
  Shield,
  Wallet,
} from 'lucide-react'
import { useParams, useNavigate } from 'react-router-dom'
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
import { AppDialog } from '@/components/form/app-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ActionButtons } from '@/components/form/action-buttons'
import { PageHeader } from '@/components/form/page-header'
import { EmployeeFormDialog } from './EmployeeFormDialog'

const isSuperAdminUser = (user: AuthUser): boolean => {
  const roleNameRaw = (user as any)?.role_name ?? (user as any)?.roles?.role_name
  const roleName = String(roleNameRaw ?? '').toLowerCase()
  return (
    roleName === 'super_admin' ||
    roleName === 'superadmin' ||
    roleName === 'super admin'
  )
}

function DetailRow({
  label,
  value,
  isLast,
}: {
  label: string
  value?: string | number | null
  isLast?: boolean
}) {
  return (
    <div
      className={`flex items-start justify-between gap-3 py-2.5 ${
        isLast ? '' : 'border-b border-border/40'
      }`}
    >
      <span className='flex-1 text-[13px] text-muted-foreground'>{label}</span>
      <span className='flex-1 text-right text-[13px] font-semibold text-foreground'>
        {value === null || value === undefined || value === ''
          ? 'N/A'
          : String(value)}
      </span>
    </div>
  )
}

export function EmployeeDetailsScreen() {
  const params = useParams()
  const navigate = useNavigate()
  const id = Number(params.id)
  const validId = Number.isFinite(id) && id > 0 ? id : 0

  const user = useAppSelector((s: RootState) => s.auth.user)
  const isSuperAdmin = useMemo(() => isSuperAdminUser(user), [user])
  const selectedPGLocationId = useAppSelector(
    (s: RootState) => s.pgLocations?.selectedPGLocationId
  )

  const {
    data: employee,
    isLoading,
    error,
    refetch,
  } = useGetEmployeeByIdQuery(validId, {
    skip: !validId,
  })

  const { data: employeePerms } = useGetUserPermissionsQuery(validId, {
    skip: !validId,
  })

  const {
    data: assignmentResp,
    refetch: refetchAssignment,
  } = useGetPgUserAssignmentQuery(
    { userId: validId },
    { skip: !validId || !selectedPGLocationId }
  )
  const assignment = (assignmentResp as any)?.data ?? assignmentResp

  const [updateSalary, { isLoading: isUpdatingSalary }] =
    useUpdatePgUserSalaryMutation()
  const [salaryModalOpen, setSalaryModalOpen] = useState(false)
  const [salaryValue, setSalaryValue] = useState('')
  const [salaryError, setSalaryError] = useState<string | null>(null)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [toggleDialogOpen, setToggleDialogOpen] = useState(false)
  const [deleteEmployee] = useDeleteEmployeeMutation()
  const [toggleUserStatus, { isLoading: isTogglingStatus }] =
    useToggleUserStatusMutation()

  const fetchErrorMessage =
    (error as { data?: { message?: string }; message?: string } | undefined)
      ?.data?.message || (error as { message?: string } | undefined)?.message

  const profileImageUri = useMemo(() => {
    const raw = employee?.profile_images
    if (!raw) return null

    let candidate: unknown = raw

    if (typeof candidate === 'string') {
      const trimmed = candidate.trim()
      if (!trimmed) return null

      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        try {
          const parsed = JSON.parse(trimmed)
          candidate = parsed
        } catch {
          candidate = trimmed
        }
      } else {
        candidate = trimmed
      }
    }

    const uri = Array.isArray(candidate) ? candidate[0] : candidate
    if (typeof uri !== 'string') return null

    return uri.trim()
  }, [employee])

  const formatAmount = useMemo(() => {
    return (amount: number) =>
      new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }).format(amount)
  }, [])

  const openSalaryModal = () => {
    const existing = assignment?.monthly_salary_amount
    setSalaryValue(
      existing !== null && existing !== undefined ? String(existing) : ''
    )
    setSalaryError(null)
    setSalaryModalOpen(true)
  }

  const submitSalary = async () => {
    const amt = Number(salaryValue)
    if (!salaryValue || !Number.isFinite(amt) || amt < 0) {
      setSalaryError('Enter a valid salary amount')
      return
    }

    try {
      await updateSalary({
        userId: validId,
        monthly_salary_amount: amt,
      }).unwrap()
      showSuccessAlert('Salary updated successfully')
      setSalaryModalOpen(false)
      void refetchAssignment()
    } catch (err: unknown) {
      showErrorAlert(err, 'Salary Update Error')
    }
  }

  const handleDelete = async () => {
    try {
      await deleteEmployee(validId).unwrap()
      showSuccessAlert('Employee deleted successfully')
      navigate('/employees')
    } catch (err: unknown) {
      showErrorAlert(err, 'Delete Error')
    }
  }

  const handleToggleStatus = async () => {
    try {
      await toggleUserStatus(validId).unwrap()
      const isActive = employee?.status === 'ACTIVE'
      showSuccessAlert(
        isActive
          ? 'Account deactivated. User has been logged out.'
          : 'Account activated successfully.'
      )
      setToggleDialogOpen(false)
      void refetch()
    } catch (err: unknown) {
      showErrorAlert(err, 'Status Update Error')
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    } catch {
      return 'N/A'
    }
  }

  const isActive = employee?.status === 'ACTIVE'

  return (
    <div className='container mx-auto max-w-4xl px-4 py-4'>
      <PageHeader
        title='Employee Details'
        showBack={true}
        subtitle='View and manage employee information'
      />

      {fetchErrorMessage ? (
        <div className='mt-4'>
          <Alert variant='destructive'>
            <CircleAlert />
            <AlertTitle>Failed to load employee</AlertTitle>
            <AlertDescription>{fetchErrorMessage}</AlertDescription>
          </Alert>
        </div>
      ) : null}

      {isLoading ? (
        <div className='mt-4 rounded-lg border bg-card px-6 py-12 text-center'>
          <div className='mx-auto size-8 animate-spin rounded-full border-2 border-primary border-t-transparent'></div>
          <p className='mt-4 text-sm text-muted-foreground'>
            Loading employee details...
          </p>
        </div>
      ) : !employee ? (
        <div className='mt-4 rounded-lg border border-dashed bg-muted/30 px-6 py-16 text-center'>
          <div className='mx-auto flex size-16 items-center justify-center rounded-full bg-destructive/10'>
            <User className='size-8 text-destructive' />
          </div>
          <div className='mt-4 text-lg font-semibold'>Employee not found</div>
          <div className='mt-2 text-sm text-muted-foreground'>
            Please check the employee ID.
          </div>
        </div>
      ) : (
        <div className='mt-4 space-y-3'>
          {/* Profile Card */}
          <Card className='py-0 shadow-sm'>
            <CardContent className='p-4'>
              <div className='flex items-center gap-3'>
                {profileImageUri ? (
                  <img
                    src={profileImageUri}
                    alt={employee.name}
                    className='size-12 rounded-xl border border-border object-cover'
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                ) : (
                  <div className='flex size-12 items-center justify-center rounded-xl bg-primary/10'>
                    <span className='text-xl'>👤</span>
                  </div>
                )}
                <div className='min-w-0 flex-1'>
                  <h1 className='truncate text-lg font-bold text-foreground'>
                    {employee.name || 'N/A'}
                  </h1>
                  <p className='mt-0.5 text-xs text-muted-foreground'>
                    {employee.phone || 'N/A'}
                  </p>
                  {employee.roles && (
                    <p className='mt-0.5 text-xs font-medium text-primary'>
                      Role: {employee.roles.role_name}
                    </p>
                  )}
                </div>
                <span
                  className={`shrink-0 rounded-md px-2.5 py-1 text-[11px] font-bold ${
                    isActive
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {employee.status}
                </span>
              </div>

              <div className='mt-3.5 flex items-center justify-between border-t border-border/30 pt-3.5'>
                <button
                  onClick={() => setToggleDialogOpen(true)}
                  disabled={isTogglingStatus}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-[13px] font-bold transition-colors disabled:opacity-50 ${
                    isActive
                      ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                      : 'border-green-200 bg-green-50 text-green-600 hover:bg-green-100'
                  }`}
                >
                  {isTogglingStatus
                    ? 'Updating...'
                    : isActive
                      ? 'Deactivate'
                      : 'Activate'}
                </button>

                <ActionButtons
                  onEdit={() => setDialogOpen(true)}
                  onDelete={() => setDeleteDialogOpen(true)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Operations / Permissions */}
          <Card className='py-0 shadow-sm'>
            <CardContent className='p-4'>
              <div className='flex items-center gap-2'>
                <Shield className='size-4 text-muted-foreground' />
                <h2 className='text-sm font-bold text-foreground'>Operations</h2>
              </div>
              <p className='mt-1.5 text-xs text-muted-foreground'>
                Employee Permissions
              </p>

              {(employeePerms?.permissions ?? []).length ? (
                <div className='mt-2.5 flex flex-wrap gap-1.5'>
                  {(employeePerms?.permissions ?? []).map((perm: string) => (
                    <span
                      key={perm}
                      className='rounded-md bg-muted px-2 py-1 text-[11px] font-medium text-foreground'
                    >
                      {perm}
                    </span>
                  ))}
                </div>
              ) : (
                <p className='mt-2.5 text-xs text-muted-foreground/60'>
                  No permissions found
                </p>
              )}
            </CardContent>
          </Card>

          {/* Access Settings - Super Admin only */}
          {isSuperAdmin && (
            <Card className='py-0 shadow-sm'>
              <CardContent className='p-4'>
                <h2 className='text-sm font-extrabold text-foreground'>
                  Access Settings
                </h2>
                <p className='mt-1.5 text-xs text-muted-foreground leading-relaxed'>
                  Customize this employee's access for this organization.
                </p>
                <p className='mt-1 text-xs text-muted-foreground leading-relaxed'>
                  Use Allow / Deny to override role defaults, or Clear to go back
                  to role-based access.
                </p>

                <div className='mt-3 flex justify-end'>
                  <Button
                    size='sm'
                    onClick={() =>
                      navigate(`/employees/${validId}/permissions`)
                    }
                  >
                    Manage Access
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Monthly Salary - Super Admin only */}
          {isSuperAdmin && (
            <Card className='py-0 shadow-sm'>
              <CardContent className='p-4'>
                <div className='flex items-center justify-between gap-3'>
                  <div className='min-w-0 flex-1'>
                    <div className='flex items-center gap-2'>
                      <Wallet className='size-4 text-muted-foreground' />
                      <h2 className='text-sm font-bold text-foreground'>
                        Monthly Salary
                      </h2>
                    </div>
                    <p className='mt-1.5 text-xs text-muted-foreground'>
                      {assignment?.monthly_salary_amount !== null &&
                      assignment?.monthly_salary_amount !== undefined
                        ? formatAmount(Number(assignment.monthly_salary_amount))
                        : 'Not set'}
                    </p>
                  </div>
                  <Button size='sm' onClick={openSalaryModal}>
                    Update Salary
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Address Information */}
          <Card className='py-0 shadow-sm'>
            <CardContent className='p-4'>
              <div className='mb-2 flex items-center gap-2'>
                <MapPin className='size-4 text-muted-foreground' />
                <h2 className='text-sm font-bold text-foreground'>
                  Address Information
                </h2>
              </div>
              <DetailRow label='Address' value={employee.address} />
              <DetailRow label='City' value={employee.city?.name} />
              <DetailRow label='State' value={employee.state?.name} />
              <DetailRow label='Pincode' value={employee.pincode} />
              <DetailRow
                label='Country'
                value={employee.country}
                isLast={true}
              />
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card className='py-0 shadow-sm'>
            <CardContent className='p-4'>
              <div className='mb-2 flex items-center gap-2'>
                <FileText className='size-4 text-muted-foreground' />
                <h2 className='text-sm font-bold text-foreground'>
                  Additional Information
                </h2>
              </div>
              <DetailRow label='Employee ID' value={employee.s_no} />
              <DetailRow
                label='Gender'
                value={employee.gender || 'N/A'}
              />
              <DetailRow
                label='Proof Documents'
                value={
                  employee.proof_documents ? 'Available' : 'Not uploaded'
                }
              />
              <DetailRow
                label='Created At'
                value={formatDate(employee.created_at)}
              />
              <DetailRow
                label='Updated At'
                value={formatDate(employee.updated_at)}
                isLast={true}
              />
            </CardContent>
          </Card>
        </div>
      )}

      <EmployeeFormDialog
        open={dialogOpen}
        onOpenChange={(open: boolean) => setDialogOpen(open)}
        editTarget={employee as Employee | null}
        onSaved={() => {
          setDialogOpen(false)
          void refetch()
        }}
      />

      {/* Toggle Status Confirmation */}
      <AlertDialog
        open={toggleDialogOpen}
        onOpenChange={setToggleDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isActive ? 'Deactivate Account' : 'Activate Account'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isActive
                ? `Deactivating ${employee?.name || 'this employee'} will immediately log them out and block access. Continue?`
                : `Activate ${employee?.name || 'this employee'}'s account to restore their access?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggleStatus}
              disabled={isTogglingStatus}
              className={
                isActive
                  ? 'text-destructive-foreground bg-destructive hover:bg-destructive/90'
                  : ''
              }
            >
              {isTogglingStatus
                ? 'Updating...'
                : isActive
                  ? 'Deactivate'
                  : 'Activate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Employee</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <strong>{employee?.name || 'this employee'}</strong>? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className='text-destructive-foreground bg-destructive hover:bg-destructive/90'
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Salary Modal */}
      <AppDialog
        open={salaryModalOpen}
        onOpenChange={setSalaryModalOpen}
        title='Set Monthly Salary'
        description={employee?.name}
        size='sm'
        footer={
          <>
            <Button
              variant='outline'
              onClick={() => setSalaryModalOpen(false)}
              disabled={isUpdatingSalary}
            >
              Cancel
            </Button>
            <Button onClick={submitSalary} disabled={isUpdatingSalary}>
              {isUpdatingSalary ? 'Saving...' : 'Save'}
            </Button>
          </>
        }
      >
        <div className='space-y-3 py-2'>
          <div>
            <label className='mb-1.5 block text-sm font-medium'>
              Monthly Salary <span className='text-destructive'>*</span>
            </label>
            <Input
              type='number'
              value={salaryValue}
              onChange={(e) => {
                setSalaryValue(e.target.value)
                setSalaryError(null)
              }}
              placeholder='Enter monthly salary'
              disabled={isUpdatingSalary}
            />
            {salaryError && (
              <p className='mt-1 text-xs text-destructive'>{salaryError}</p>
            )}
          </div>

          <p className='text-xs text-muted-foreground'>
            This salary is saved per employee per PG.
          </p>
        </div>
      </AppDialog>
    </div>
  )
}
