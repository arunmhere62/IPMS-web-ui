import { useEffect, useMemo } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  type CreateEmployeeDto,
  type Employee,
  type UpdateEmployeeDto,
  UserGender,
} from '@/services/employeesApi'
import { useGetRolesQuery } from '@/services/rolesApi'
import { showErrorAlert, showSuccessAlert } from '@/utils/toast'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { FormDialog } from '@/components/form/form-dialog'
import { FormSelectField } from '@/components/form/form-select-field'
import { FormTextInput } from '@/components/form/form-text-input'
import { PhoneInput } from '@/components/form/phone-input'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().min(1, 'Phone is required'),
  roleId: z.number().min(1, 'Role is required'),
  gender: z
    .nativeEnum(UserGender)
    .optional()
    .refine((val) => val !== undefined, {
      message: 'Gender is required',
    }),
})

type FormValues = z.infer<typeof schema>

export type EmployeeFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  editTarget: Employee | null
  onSaved: () => void
}

export function EmployeeFormDialog({
  open,
  onOpenChange,
  editTarget,
  onSaved,
}: EmployeeFormDialogProps) {
  const [createEmployee, { isLoading: creating }] = useCreateEmployeeMutation()
  const [updateEmployee, { isLoading: updating }] = useUpdateEmployeeMutation()

  const { data: rolesResponse } = useGetRolesQuery()
  const roles = rolesResponse?.data || []

  const roleOptions = useMemo(() => {
    const roleList = Array.isArray(roles) ? roles : []
    return roleList.map((r) => ({
      label: String(r.role_name ?? `Role ${r.s_no}`),
      value: String(r.s_no),
      searchText: String(r.role_name ?? r.s_no),
    }))
  }, [roles])

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      roleId: 0,
      gender: undefined,
    },
  })

  useEffect(() => {
    if (!open) return

    if (editTarget) {
      form.reset({
        name: String(editTarget.name ?? ''),
        email: String(editTarget.email ?? ''),
        phone: String(editTarget.phone ?? ''),
        roleId: Number(editTarget.role_id ?? 0),
        gender: editTarget.gender || undefined,
      })
      return
    }

    form.reset({
      name: '',
      email: '',
      phone: '',
      roleId: 0,
      gender: undefined,
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

      // Phone is already formatted with country code from PhoneInput component
      const phone = values.phone?.trim()
      if (phone) base.phone = phone

      base.gender = values.gender

      if (editTarget) {
        await updateEmployee({
          id: editTarget.s_no,
          data: base as UpdateEmployeeDto,
        }).unwrap()
        showSuccessAlert('Employee updated successfully')
      } else {
        await createEmployee(base as CreateEmployeeDto).unwrap()
        showSuccessAlert('Employee created successfully')
      }

      onOpenChange(false)
      onSaved()
    } catch (e) {
      showErrorAlert(e, 'Save Error')
    }
  }

  const saving = creating || updating

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={editTarget ? 'Edit Employee' : 'Add Employee'}
      description='Enter employee details.'
      size='md'
      footer={
        <>
          <Button
            type='button'
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button type='submit' form='employee-form' disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </>
      }
    >
      <Form {...form}>
        <form
          id='employee-form'
          onSubmit={form.handleSubmit(onSubmit)}
          className='space-y-5'
        >
          <FormTextInput
            control={form.control}
            name='name'
            label='Name'
            placeholder='Employee name'
            required
          />

          <FormTextInput
            control={form.control}
            name='email'
            label='Email'
            placeholder='name@example.com'
          />

          <PhoneInput
            control={form.control}
            name='phone'
            label='Phone'
            placeholder='Enter phone number'
            required
            defaultCountryCode='+91'
          />

          <FormSelectField
            control={form.control}
            name='gender'
            label='Gender'
            required
            placeholder='Select gender'
            options={[
              { label: 'Male', value: UserGender.MALE },
              { label: 'Female', value: UserGender.FEMALE },
            ]}
          />

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
        </form>
      </Form>
    </FormDialog>
  )
}
