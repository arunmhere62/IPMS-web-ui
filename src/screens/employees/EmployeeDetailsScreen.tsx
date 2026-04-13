import { useState } from 'react'
import { useGetEmployeeByIdQuery, type Employee } from '@/services/employeesApi'
import { ChevronLeft, CircleAlert, Mail, Phone, User } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { EmployeeFormDialog } from './EmployeeFormDialog'

export function EmployeeDetailsScreen() {
  const params = useParams()
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

  const fetchErrorMessage =
    (error as { data?: { message?: string }; message?: string } | undefined)
      ?.data?.message || (error as { message?: string } | undefined)?.message

  return (
    <div className='container mx-auto max-w-4xl px-4 py-4'>
      <div className='mb-4 flex items-center justify-between border-b pb-3'>
        <div>
          <h1 className='text-2xl font-bold'>Employee Details</h1>
          <p className='text-xs text-muted-foreground'>
            View and manage employee information
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <Button asChild variant='outline' size='sm'>
            <Link to='/employees'>
              <ChevronLeft className='me-1 size-3.5' />
              Back
            </Link>
          </Button>
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
      </div>

      {fetchErrorMessage ? (
        <div className='mb-3'>
          <Alert variant='destructive'>
            <CircleAlert />
            <AlertTitle>Failed to load employee</AlertTitle>
            <AlertDescription>{fetchErrorMessage}</AlertDescription>
          </Alert>
        </div>
      ) : null}

      {isLoading ? (
        <div className='rounded-lg border bg-card px-4 py-8 text-center'>
          <div className='mx-auto size-6 animate-spin rounded-full border-2 border-primary border-t-transparent'></div>
          <p className='mt-2 text-xs text-muted-foreground'>Loading...</p>
        </div>
      ) : !employee ? (
        <div className='rounded-lg border border-dashed bg-muted/30 px-4 py-10 text-center'>
          <div className='mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10'>
            <User className='size-6 text-destructive' />
          </div>
          <div className='mt-3 text-sm font-semibold'>Employee not found</div>
          <div className='mt-1 text-xs text-muted-foreground'>
            Please check the employee ID.
          </div>
          <div className='mt-4'>
            <Button asChild variant='outline' size='sm'>
              <Link to='/employees'>
                <ChevronLeft className='me-1 size-3.5' />
                Back
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <Card className='border'>
          <CardContent className='p-4'>
            <div className='mb-3 flex items-center justify-between border-b pb-3'>
              <div className='flex items-center gap-3'>
                <div className='flex size-12 items-center justify-center rounded-lg bg-black text-white'>
                  <User className='size-6' />
                </div>
                <div>
                  <div className='text-lg font-bold'>{employee.name}</div>
                  <div className='text-xs text-muted-foreground'>
                    ID: {employee.s_no}
                  </div>
                </div>
              </div>
              <div className='flex items-center gap-2'>
                <Badge variant='outline' className='text-xs'>
                  {employee.roles?.role_name ?? 'N/A'}
                </Badge>
                <Badge
                  variant={
                    String(employee.status ?? 'ACTIVE') === 'ACTIVE'
                      ? 'default'
                      : 'secondary'
                  }
                  className='text-xs'
                >
                  {String(employee.status ?? 'ACTIVE')}
                </Badge>
              </div>
            </div>

            <div className='grid gap-3 sm:grid-cols-2'>
              <div className='space-y-2 rounded-lg border p-3'>
                <div className='border-b pb-2 text-sm font-semibold'>
                  Contact
                </div>
                {employee.email ? (
                  <div className='flex items-center gap-1.5 text-xs'>
                    <Mail className='size-3 text-muted-foreground' />
                    <span className='truncate'>{employee.email}</span>
                  </div>
                ) : (
                  <div className='text-xs text-muted-foreground'>No email</div>
                )}
                {employee.phone ? (
                  <div className='flex items-center gap-1.5 text-xs'>
                    <Phone className='size-3 text-muted-foreground' />
                    <span>{employee.phone}</span>
                  </div>
                ) : (
                  <div className='text-xs text-muted-foreground'>No phone</div>
                )}
              </div>

              <div className='space-y-2 rounded-lg border p-3'>
                <div className='border-b pb-2 text-sm font-semibold'>
                  Additional
                </div>
                <div className='text-xs'>
                  <span className='text-muted-foreground'>Gender: </span>
                  <span>{employee.gender ?? 'N/A'}</span>
                </div>
                <div className='text-xs'>
                  <span className='text-muted-foreground'>Role: </span>
                  <span className='font-medium'>
                    {employee.roles?.role_name ?? 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
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
    </div>
  )
}
