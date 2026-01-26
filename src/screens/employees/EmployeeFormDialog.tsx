import { useEffect, useMemo } from 'react'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { AppDialog } from '@/components/form/app-dialog'
import { FormSelectField } from '@/components/form/form-select-field'
import { FormTextInput } from '@/components/form/form-text-input'
import { Form } from '@/components/ui/form'
import { Button } from '@/components/ui/button'

import {
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  type CreateEmployeeDto,
  type Employee,
  type UpdateEmployeeDto,
} from '@/services/employeesApi'
import { useGetRolesQuery } from '@/services/rolesApi'
import { showErrorAlert, showSuccessAlert } from '@/utils/toast'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  password: z.string().optional().or(z.literal('')),
  roleId: z.number().min(1, 'Role is required'),
})

type FormValues = z.infer<typeof schema>

export type EmployeeFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  editTarget: Employee | null
  onSaved: () => void
}

export function EmployeeFormDialog({ open, onOpenChange, editTarget, onSaved }: EmployeeFormDialogProps) {
  const [createEmployee, { isLoading: creating }] = useCreateEmployeeMutation()
  const [updateEmployee, { isLoading: updating }] = useUpdateEmployeeMutation()

  const { data: rolesResponse } = useGetRolesQuery()
  const roles = (rolesResponse as any)?.data || []

  const roleOptions = useMemo(
    () =>
      (Array.isArray(roles) ? roles : []).map((r: any) => ({
        label: String(r.role_name ?? r.name ?? `Role ${r.s_no}`),
        value: String(r.s_no),
        searchText: String(r.role_name ?? r.name ?? r.s_no),
      })),
    [roles]
  )

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      roleId: 0,
    },
  })

  useEffect(() => {
    if (!open) return

    if (editTarget) {
      form.reset({
        name: String(editTarget.name ?? ''),
        email: String((editTarget as any)?.email ?? ''),
        phone: String((editTarget as any)?.phone ?? ''),
        password: '',
        roleId: Number((editTarget as any)?.role_id ?? 0),
      })
      return
    }

    form.reset({
      name: '',
      email: '',
      phone: '',
      password: '',
      roleId: 0,
    })
  }, [open, editTarget, form])

  const onSubmit = async (values: FormValues) => {
    try {
      const base: Partial<CreateEmployeeDto & UpdateEmployeeDto> = {
        name: values.name.trim(),
        role_id: values.roleId,
      }

      const email = values.email?.trim()
      if (email) base.email = email

      const phone = values.phone?.trim()
      if (phone) base.phone = phone

      const password = values.password?.trim()
      if (password) base.password = password

      if (editTarget) {
        await updateEmployee({ id: editTarget.s_no, data: base as UpdateEmployeeDto }).unwrap()
        showSuccessAlert('Employee updated successfully')
      } else {
        await createEmployee(base as CreateEmployeeDto).unwrap()
        showSuccessAlert('Employee created successfully')
      }

      onOpenChange(false)
      onSaved()
    } catch (e: any) {
      showErrorAlert(e, 'Save Error')
    }
  }

  const saving = creating || updating

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      title={editTarget ? 'Edit Employee' : 'Add Employee'}
      description='Enter employee details.'
      size='md'
      footer={
        <div className='flex w-full justify-end gap-2 px-3 pb-3'>
          <Button type='button' variant='outline' onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button type='submit' form='employee-form' disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      }
    >
      <Form {...form}>
        <form id='employee-form' onSubmit={form.handleSubmit(onSubmit)} className='grid gap-4'>
          <FormTextInput control={form.control} name='name' label='Name' placeholder='Employee name' required />

          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
            <FormTextInput control={form.control} name='email' label='Email' placeholder='name@example.com' />
            <FormTextInput control={form.control} name='phone' label='Phone' placeholder='Phone number' />
          </div>

          <FormSelectField
            control={form.control}
            name='roleId'
            label='Role'
            required
            placeholder='Select role'
            options={roleOptions}
            parse={(v) => Number(v)}
            searchable
          />

          <FormTextInput
            control={form.control}
            name='password'
            label={editTarget ? 'New Password (optional)' : 'Password (optional)'}
            placeholder='Enter password'
          />
        </form>
      </Form>
    </AppDialog>
  )
}
