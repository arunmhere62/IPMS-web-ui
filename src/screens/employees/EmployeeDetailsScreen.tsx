import { useState, useMemo } from 'react'
import {
  useGetEmployeeByIdQuery,
  useDeleteEmployeeMutation,
  type Employee,
} from '@/services/employeesApi'
import {
  CircleAlert,
  Mail,
  User,
  MapPin,
  Calendar,
  FileText,
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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ActionButtons } from '@/components/form/action-buttons'
import { PageHeader } from '@/components/form/page-header'
import { EmployeeFormDialog } from './EmployeeFormDialog'

export function EmployeeDetailsScreen() {
  const params = useParams()
  const navigate = useNavigate()
  const id = Number(params.id)
  const validId = Number.isFinite(id) && id > 0 ? id : 0

  const {
    data: employee,
    isLoading,
    error,
    refetch,
  } = useGetEmployeeByIdQuery(validId, {
    skip: !validId,
  })

  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteEmployee] = useDeleteEmployeeMutation()

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

      // Some APIs store arrays as JSON strings
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

  const handleDelete = async () => {
    try {
      await deleteEmployee(validId).unwrap()
      showSuccessAlert('Employee deleted successfully')
      navigate('/employees')
    } catch (error: unknown) {
      showErrorAlert(error, 'Delete Error')
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

  return (
    <div className='container mx-auto max-w-4xl px-4 py-4'>
      <PageHeader
        title='Employee Details'
        showBack={true}
        subtitle='View and manage employee information'
        right={
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => refetch()}
              disabled={!validId}
            >
              Refresh
            </Button>
            <Button
              size='sm'
              onClick={() => setDialogOpen(true)}
              disabled={!employee}
              className='bg-black text-white hover:bg-black/90'
            >
              Edit
            </Button>
          </div>
        }
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
        <div className='mt-4 space-y-4'>
          {/* Employee Profile Card */}
          <Card className='border shadow-sm'>
            <CardContent className='p-6'>
              <div className='flex items-start justify-between gap-4'>
                <div className='flex flex-1 items-center gap-4'>
                  {profileImageUri ? (
                    <div className='relative'>
                      <img
                        src={profileImageUri}
                        alt={employee.name}
                        className='size-16 rounded-xl border-2 border-border object-cover'
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                          e.currentTarget.nextElementSibling?.classList.remove(
                            'hidden'
                          )
                        }}
                      />
                      <div className='flex hidden size-16 items-center justify-center rounded-xl border-2 border-border bg-primary/10'>
                        <User className='size-8 text-primary' />
                      </div>
                    </div>
                  ) : (
                    <div className='flex size-16 items-center justify-center rounded-xl border-2 border-border bg-primary/10'>
                      <User className='size-8 text-primary' />
                    </div>
                  )}
                  <div className='min-w-0 flex-1'>
                    <h1 className='truncate text-2xl font-bold text-foreground'>
                      {employee.name}
                    </h1>
                    <p className='mt-1 text-sm text-muted-foreground'>
                      {employee.phone || 'No phone'}
                    </p>
                    {employee.roles && (
                      <p className='mt-1 text-sm font-medium text-primary'>
                        Role: {employee.roles.role_name}
                      </p>
                    )}
                  </div>
                </div>
                <div className='flex flex-col items-end gap-3'>
                  <Badge
                    variant={
                      employee.status === 'ACTIVE' ? 'default' : 'secondary'
                    }
                    className='px-3 py-1 text-xs font-medium'
                  >
                    {employee.status}
                  </Badge>
                  <ActionButtons
                    onEdit={() => setDialogOpen(true)}
                    onDelete={() => setDeleteDialogOpen(true)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className='border shadow-sm'>
            <CardContent className='p-6'>
              <h2 className='mb-4 flex items-center gap-2 text-lg font-semibold'>
                <Mail className='size-5 text-muted-foreground' />
                Contact Information
              </h2>
              <div className='grid gap-4 sm:grid-cols-2'>
                <div className='space-y-1'>
                  <p className='text-sm font-medium text-muted-foreground'>
                    Email
                  </p>
                  <p className='text-sm'>{employee.email || 'Not provided'}</p>
                </div>
                <div className='space-y-1'>
                  <p className='text-sm font-medium text-muted-foreground'>
                    Phone
                  </p>
                  <p className='text-sm'>{employee.phone || 'Not provided'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card className='border shadow-sm'>
            <CardContent className='p-6'>
              <h2 className='mb-4 flex items-center gap-2 text-lg font-semibold'>
                <MapPin className='size-5 text-muted-foreground' />
                Address Information
              </h2>
              <div className='grid gap-4 sm:grid-cols-2'>
                <div className='space-y-1'>
                  <p className='text-sm font-medium text-muted-foreground'>
                    Address
                  </p>
                  <p className='text-sm'>
                    {employee.address || 'Not provided'}
                  </p>
                </div>
                <div className='space-y-1'>
                  <p className='text-sm font-medium text-muted-foreground'>
                    City
                  </p>
                  <p className='text-sm'>
                    {employee.city?.name || 'Not provided'}
                  </p>
                </div>
                <div className='space-y-1'>
                  <p className='text-sm font-medium text-muted-foreground'>
                    State
                  </p>
                  <p className='text-sm'>
                    {employee.state?.name || 'Not provided'}
                  </p>
                </div>
                <div className='space-y-1'>
                  <p className='text-sm font-medium text-muted-foreground'>
                    Pincode
                  </p>
                  <p className='text-sm'>
                    {employee.pincode || 'Not provided'}
                  </p>
                </div>
                <div className='space-y-1 sm:col-span-2'>
                  <p className='text-sm font-medium text-muted-foreground'>
                    Country
                  </p>
                  <p className='text-sm'>
                    {employee.country || 'Not provided'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card className='border shadow-sm'>
            <CardContent className='p-6'>
              <h2 className='mb-4 flex items-center gap-2 text-lg font-semibold'>
                <FileText className='size-5 text-muted-foreground' />
                Additional Information
              </h2>
              <div className='grid gap-4 sm:grid-cols-2'>
                <div className='space-y-1'>
                  <p className='text-sm font-medium text-muted-foreground'>
                    Employee ID
                  </p>
                  <p className='font-mono text-sm'>{employee.s_no}</p>
                </div>
                <div className='space-y-1'>
                  <p className='text-sm font-medium text-muted-foreground'>
                    Gender
                  </p>
                  <p className='text-sm'>
                    {employee.gender || 'Not specified'}
                  </p>
                </div>
                <div className='space-y-1'>
                  <p className='text-sm font-medium text-muted-foreground'>
                    Proof Documents
                  </p>
                  <p className='text-sm'>
                    {employee.proof_documents ? 'Available' : 'Not uploaded'}
                  </p>
                </div>
                <div className='space-y-1'>
                  <p className='text-sm font-medium text-muted-foreground'>
                    Profile Images
                  </p>
                  <p className='text-sm'>
                    {profileImageUri ? 'Available' : 'Not uploaded'}
                  </p>
                </div>
                <div className='space-y-1'>
                  <p className='flex items-center gap-1 text-sm font-medium text-muted-foreground'>
                    <Calendar className='size-4' />
                    Created At
                  </p>
                  <p className='text-sm'>{formatDate(employee.created_at)}</p>
                </div>
                <div className='space-y-1'>
                  <p className='flex items-center gap-1 text-sm font-medium text-muted-foreground'>
                    <Calendar className='size-4' />
                    Updated At
                  </p>
                  <p className='text-sm'>{formatDate(employee.updated_at)}</p>
                </div>
              </div>
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
    </div>
  )
}
