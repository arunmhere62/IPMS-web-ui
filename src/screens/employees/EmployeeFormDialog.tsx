import { useEffect, useMemo, useState, useCallback } from 'react'
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
import { useUpdatePgUserSalaryMutation } from '@/services/pgUsersApi'
import {
  useGetStatesQuery,
  useLazyGetCitiesQuery,
} from '@/services/locationApi'
import { useGetRolesQuery } from '@/services/rolesApi'
import { useAppSelector } from '@/store/hooks'
import { showErrorAlert, showSuccessAlert } from '@/utils/toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Form } from '@/components/ui/form'
import { FormDialog } from '@/components/form/form-dialog'
import { FormSelectField } from '@/components/form/form-select-field'
import { FormTextInput } from '@/components/form/form-text-input'
import { FormTextarea } from '@/components/form/form-textarea'
import { PhoneInput } from '@/components/form/phone-input'
import { ImageUploadS3 } from '@/components/form/image-upload-s3'
import { OptionSelector } from '@/components/form/option-selector'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  password: z.string().optional().or(z.literal('')),
  confirmPassword: z.string().optional().or(z.literal('')),
  phone: z.string().min(1, 'Phone is required'),
  roleId: z.number().min(1, 'Role is required'),
  gender: z
    .nativeEnum(UserGender)
    .optional()
    .refine((val) => val !== undefined, {
      message: 'Gender is required',
    }),
  address: z.string().optional(),
  cityId: z.number().optional().nullable(),
  stateId: z.number().optional().nullable(),
  pincode: z.string().optional(),
  country: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.password || data.confirmPassword) {
    if (data.password && data.password.length < 6) {
      ctx.addIssue({
        path: ['password'],
        message: 'Password must be at least 6 characters',
        code: 'custom',
      })
    }
    if (!data.confirmPassword) {
      ctx.addIssue({
        path: ['confirmPassword'],
        message: 'Please confirm your password',
        code: 'custom',
      })
    } else if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        path: ['confirmPassword'],
        message: 'Passwords do not match',
        code: 'custom',
      })
    }
  }
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
  const selectedPGLocationId = useAppSelector(
    (s) => s.pgLocations.selectedPGLocationId
  )

  const [createEmployee, { isLoading: creating }] = useCreateEmployeeMutation()
  const [updateEmployee, { isLoading: updating }] = useUpdateEmployeeMutation()
  const [updatePgUserSalary] = useUpdatePgUserSalaryMutation()
  const [profileImages, setProfileImages] = useState<string[]>([])
  const [proofDocuments, setProofDocuments] = useState<string[]>([])
  const [monthlySalary, setMonthlySalary] = useState('')
  const [loadingCities, setLoadingCities] = useState(false)
  const [getCities] = useLazyGetCitiesQuery()

  const { data: rolesResponse } = useGetRolesQuery()
  const { data: statesResponse } = useGetStatesQuery({ countryCode: 'IN' })

  const states = useMemo(
    () => (Array.isArray(statesResponse?.data) ? statesResponse.data : []),
    [statesResponse]
  )

  const roleOptions = useMemo(() => {
    const roleList = Array.isArray(rolesResponse?.data)
      ? rolesResponse.data
      : []
    return roleList.map((r) => ({
      label: String(r.role_name ?? `Role ${r.s_no}`),
      value: String(r.s_no),
      searchText: String(r.role_name ?? r.s_no),
    }))
  }, [rolesResponse])

  const stateOptions = useMemo(() => {
    const stateList = Array.isArray(statesResponse?.data)
      ? statesResponse.data
      : []
    return stateList.map((s) => ({
      label: String(s.name ?? `State ${s.s_no}`),
      value: String(s.s_no),
      searchText: String(s.name ?? s.s_no),
    }))
  }, [statesResponse])

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
      roleId: 0,
      gender: undefined,
      address: '',
      cityId: null,
      stateId: null,
      pincode: '',
      country: 'India',
    },
  })

  const [cityOptions, setCityOptions] = useState<
    Array<{ label: string; value: string; searchText: string }>
  >([])

  const loadCitiesForState = useCallback(
    async (stateId: string, keepSelectedCity = false) => {
      if (!stateId) {
        setCityOptions([])
        if (!keepSelectedCity) {
          form.setValue('cityId', null)
        }
        return
      }

      const selectedState = states.find(
        (state) => String(state.s_no) === String(stateId)
      )
      const stateCode = selectedState?.iso_code

      if (!stateCode) {
        setCityOptions([])
        if (!keepSelectedCity) {
          form.setValue('cityId', null)
        }
        return
      }

      setLoadingCities(true)
      try {
        const result = await getCities({ stateCode })
        const cities = result.data?.data || []
        const options = cities.map((c: { s_no: number; name: string }) => ({
          label: String(c.name ?? `City ${c.s_no}`),
          value: String(c.s_no),
          searchText: String(c.name ?? c.s_no),
        }))
        setCityOptions(options)
      } catch (_error) {
        // Handle error silently
      } finally {
        setLoadingCities(false)
      }
    },
    [getCities, states, form]
  )

  useEffect(() => {
    if (!open) return

    if (editTarget) {
      form.reset({
        name: String(editTarget.name ?? ''),
        email: String(editTarget.email ?? ''),
        password: '',
        confirmPassword: '',
        phone: String(editTarget.phone ?? ''),
        roleId: Number(editTarget.role_id ?? 0),
        gender: editTarget.gender || undefined,
        address: String(editTarget.address ?? ''),
        cityId: editTarget.city_id || null,
        stateId: editTarget.state_id || null,
        pincode: String(editTarget.pincode ?? ''),
        country: String(editTarget.country ?? 'India'),
      })

      if (editTarget.state_id) {
        void loadCitiesForState(String(editTarget.state_id), true)
      }

      const profileImagesRaw = editTarget.profile_images
      if (profileImagesRaw) {
        let images: string[] = []
        if (typeof profileImagesRaw === 'string') {
          try {
            const parsed = JSON.parse(profileImagesRaw)
            images = Array.isArray(parsed) ? parsed : [profileImagesRaw]
          } catch {
            images = [profileImagesRaw]
          }
        } else if (Array.isArray(profileImagesRaw)) {
          images = profileImagesRaw
        }
        setProfileImages(images)
      } else {
        setProfileImages([])
      }

      const proofDocsRaw = editTarget.proof_documents
      if (proofDocsRaw) {
        let docs: string[] = []
        if (typeof proofDocsRaw === 'string') {
          try {
            const parsed = JSON.parse(proofDocsRaw)
            docs = Array.isArray(parsed) ? parsed : [proofDocsRaw]
          } catch {
            docs = [proofDocsRaw]
          }
        } else if (Array.isArray(proofDocsRaw)) {
          docs = proofDocsRaw
        }
        setProofDocuments(docs)
      } else {
        setProofDocuments([])
      }

      setMonthlySalary('')
      return
    }

    form.reset({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
      roleId: 0,
      gender: undefined,
      address: '',
      cityId: null,
      stateId: null,
      pincode: '',
      country: 'India',
    })
    setProfileImages([])
    setProofDocuments([])
    setMonthlySalary('')
    setCityOptions([])
  }, [open, editTarget, form, loadCitiesForState])

  useEffect(() => {
    if (!open || !editTarget?.state_id || states.length === 0) return
    void loadCitiesForState(String(editTarget.state_id), true)
  }, [open, editTarget?.state_id, states, loadCitiesForState])

  const onSubmit = async (values: FormValues) => {
    try {
      const base: Partial<CreateEmployeeDto & UpdateEmployeeDto> = {
        name: values.name.trim(),
        role_id: values.roleId,
        gender: values.gender,
      }

      if (!editTarget) {
        const email = values.email?.trim()
        if (email) base.email = email
      }

      const phone = values.phone?.trim()
      if (phone) base.phone = phone

      const password = values.password?.trim()
      const confirmPassword = values.confirmPassword?.trim()
      if (password && password === confirmPassword) {
        base.password = password
      }

      const address = values.address?.trim()
      if (address) base.address = address

      const pincode = values.pincode?.trim()
      if (pincode) base.pincode = pincode

      const country = values.country?.trim()
      if (country) base.country = country

      if (values.cityId) base.city_id = values.cityId
      if (values.stateId) base.state_id = values.stateId

      if (profileImages.length > 0) {
        base.profile_images = profileImages
      }
      if (proofDocuments.length > 0) {
        base.proof_documents = proofDocuments
      }

      if (editTarget) {
        await updateEmployee({
          id: editTarget.s_no,
          data: base as UpdateEmployeeDto,
        }).unwrap()

        if (selectedPGLocationId && monthlySalary) {
          const amt = Number(monthlySalary)
          if (Number.isFinite(amt) && amt >= 0) {
            await updatePgUserSalary({
              userId: editTarget.s_no,
              monthly_salary_amount: amt,
            }).unwrap()
          }
        }

        showSuccessAlert('Employee updated successfully')
      } else {
        const created = await createEmployee(base as CreateEmployeeDto).unwrap()
        const createdId = (created as any)?.s_no

        if (selectedPGLocationId && createdId && monthlySalary) {
          const amt = Number(monthlySalary)
          if (Number.isFinite(amt) && amt >= 0) {
            await updatePgUserSalary({
              userId: createdId,
              monthly_salary_amount: amt,
            }).unwrap()
          }
        }

        showSuccessAlert('Employee created successfully')
      }

      onOpenChange(false)
      onSaved()
    } catch (e) {
      showErrorAlert(e, 'Save Error')
    }
  }

  const saving = creating || updating
  const isEditMode = !!editTarget

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditMode ? 'Edit Employee' : 'Add New Employee'}
      size='lg'
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
            {saving ? 'Saving...' : isEditMode ? 'Update Employee' : 'Create Employee'}
          </Button>
        </>
      }
    >
      <Form {...form}>
        <form
          id='employee-form'
          onSubmit={form.handleSubmit(onSubmit)}
          className='space-y-4'
        >
          {/* Personal Information */}
          <Card className='py-0'>
            <CardContent className='p-4'>
              <h3 className='mb-4 text-base font-bold'>
                👤 Personal Information
              </h3>

              <div className='grid gap-4 sm:grid-cols-2'>
                <FormTextInput
                  control={form.control}
                  name='name'
                  label='Full Name'
                  placeholder='Enter full name'
                  required
                />

                {!isEditMode && (
                  <FormTextInput
                    control={form.control}
                    name='email'
                    label='Email Address'
                    placeholder='Enter email address'
                  />
                )}
              </div>

              <div className='mt-4 grid gap-4 sm:grid-cols-2'>
                <FormTextInput
                  control={form.control}
                  name='password'
                  label={isEditMode ? 'New Password' : 'Password'}
                  placeholder={
                    isEditMode
                      ? 'Enter new password (optional)'
                      : 'Enter password (optional)'
                  }
                  type='password'
                />

                <FormTextInput
                  control={form.control}
                  name='confirmPassword'
                  label='Confirm Password'
                  placeholder='Re-enter password'
                  type='password'
                />
              </div>

              <div className='mt-4'>
                <PhoneInput
                  control={form.control}
                  name='phone'
                  label='Phone Number'
                  placeholder='Enter phone number'
                  required
                  defaultCountryCode='+91'
                />
              </div>

              <div className='mt-4'>
                <OptionSelector
                  label='Gender'
                  options={[
                    { label: 'Male', value: UserGender.MALE, icon: '👨' },
                    { label: 'Female', value: UserGender.FEMALE, icon: '👩' },
                  ]}
                  selectedValue={form.watch('gender') ?? null}
                  onSelect={(value) =>
                    form.setValue(
                      'gender',
                      (value as UserGender) || undefined,
                      { shouldValidate: true }
                    )
                  }
                  required
                  error={form.formState.errors.gender?.message}
                />
              </div>
            </CardContent>
          </Card>

          {/* Work Information */}
          <Card className='py-0'>
            <CardContent className='p-4'>
              <h3 className='mb-4 text-base font-bold'>
                💼 Work Information
              </h3>

              <FormSelectField
                control={form.control}
                name='roleId'
                label='Role'
                required
                placeholder='Select a role'
                options={roleOptions}
                parse={(v) => Number(v)}
                searchable
              />

              {selectedPGLocationId && (
                <div className='mt-4'>
                  <label className='mb-1.5 block text-sm font-medium'>
                    Monthly Salary (this PG)
                  </label>
                  <input
                    type='number'
                    value={monthlySalary}
                    onChange={(e) => setMonthlySalary(e.target.value)}
                    placeholder='Enter monthly salary'
                    disabled={saving}
                    className='h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary disabled:opacity-50'
                  />
                  <p className='mt-1.5 text-xs text-muted-foreground'>
                    This is saved per employee per selected PG.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card className='py-0'>
            <CardContent className='p-4'>
              <h3 className='mb-4 text-base font-bold'>
                📍 Address Information
              </h3>

              <FormTextarea
                control={form.control}
                name='address'
                label='Address'
                placeholder='Enter full address (optional)'
              />

              <div className='mt-4 grid gap-4 sm:grid-cols-2'>
                <FormSelectField
                  control={form.control}
                  name='stateId'
                  label='State'
                  placeholder='Select a state'
                  options={stateOptions}
                  parse={(v) => Number(v)}
                  onValueChange={(value) => {
                    if (value) {
                      form.setValue('cityId', null)
                      void loadCitiesForState(value)
                    } else {
                      setCityOptions([])
                      form.setValue('cityId', null)
                    }
                  }}
                  searchable
                />

                <FormSelectField
                  control={form.control}
                  name='cityId'
                  label='City'
                  placeholder='Select a city'
                  options={cityOptions}
                  parse={(v) => Number(v)}
                  disabled={loadingCities || !form.watch('stateId')}
                  searchable
                />
              </div>

              <div className='mt-4 grid gap-4 sm:grid-cols-2'>
                <FormTextInput
                  control={form.control}
                  name='pincode'
                  label='Pincode'
                  placeholder='Enter pincode (optional)'
                />

                <FormTextInput
                  control={form.control}
                  name='country'
                  label='Country'
                  placeholder='Country'
                />
              </div>
            </CardContent>
          </Card>

          {/* Profile Image */}
          <Card className='py-0'>
            <CardContent className='p-4'>
              <h3 className='mb-4 text-base font-bold'>
                📷 Profile Image
              </h3>

              <ImageUploadS3
                images={profileImages}
                onImagesChange={setProfileImages}
                maxImages={1}
                label='Profile Photo'
                disabled={saving}
                useS3={true}
                entityId={editTarget?.s_no?.toString()}
                autoSave={false}
              />
            </CardContent>
          </Card>

          {/* Proof Documents */}
          <Card className='py-0'>
            <CardContent className='p-4'>
              <h3 className='mb-4 text-base font-bold'>
                📄 Proof Documents
              </h3>

              <ImageUploadS3
                images={proofDocuments}
                onImagesChange={setProofDocuments}
                maxImages={3}
                label='ID Proof / Documents'
                disabled={saving}
                useS3={true}
                entityId={editTarget?.s_no?.toString()}
                autoSave={false}
              />
              <p className='mt-2 text-xs text-muted-foreground'>
                Upload Aadhaar, PAN, Driving License, or other ID proofs (max 3 documents)
              </p>
            </CardContent>
          </Card>
        </form>
      </Form>
    </FormDialog>
  )
}
