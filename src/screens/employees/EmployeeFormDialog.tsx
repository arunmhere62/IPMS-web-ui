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
import {
  useGetStatesQuery,
  useLazyGetCitiesQuery,
} from '@/services/locationApi'
import { useGetRolesQuery } from '@/services/rolesApi'
import { showErrorAlert, showSuccessAlert } from '@/utils/toast'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { FormDialog } from '@/components/form/form-dialog'
import { FormSelectField } from '@/components/form/form-select-field'
import { FormTextInput } from '@/components/form/form-text-input'
import { FormTextarea } from '@/components/form/form-textarea'
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
  address: z.string().optional(),
  cityId: z.number().optional().nullable(),
  stateId: z.number().optional().nullable(),
  pincode: z.string().optional(),
  country: z.string().optional(),
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
  const [profileImages, setProfileImages] = useState<string[]>([])
  const [proofDocuments, setProofDocuments] = useState<string[]>([])
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
        // Handle error silently for now
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
        phone: String(editTarget.phone ?? ''),
        roleId: Number(editTarget.role_id ?? 0),
        gender: editTarget.gender || undefined,
        address: String(editTarget.address ?? ''),
        cityId: editTarget.city_id || null,
        stateId: editTarget.state_id || null,
        pincode: String(editTarget.pincode ?? ''),
        country: String(editTarget.country ?? 'India'),
      })

      // Load cities if state is selected
      if (editTarget.state_id) {
        void loadCitiesForState(String(editTarget.state_id), true)
      }

      // Load existing images and documents
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
      }

      return
    }

    form.reset({
      name: '',
      email: '',
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

      const email = values.email?.trim()
      if (email) base.email = email

      // Phone is already formatted with country code from PhoneInput component
      const phone = values.phone?.trim()
      if (phone) base.phone = phone

      const address = values.address?.trim()
      if (address) base.address = address

      const pincode = values.pincode?.trim()
      if (pincode) base.pincode = pincode

      const country = values.country?.trim()
      if (country) base.country = country

      if (values.cityId) base.city_id = values.cityId
      if (values.stateId) base.state_id = values.stateId

      // Add images and documents if they exist
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
          className='space-y-6'
        >
          {/* Basic Information */}
          <div className='space-y-4'>
            <h3 className='text-sm font-semibold tracking-wide text-muted-foreground uppercase'>
              Basic Information
            </h3>

            <div className='grid gap-4 sm:grid-cols-2'>
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
            </div>

            <PhoneInput
              control={form.control}
              name='phone'
              label='Phone'
              placeholder='Enter phone number'
              required
              defaultCountryCode='+91'
            />

            <div className='grid gap-4 sm:grid-cols-3'>
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
            </div>
          </div>

          {/* Address Information */}
          <div className='space-y-4'>
            <h3 className='text-sm font-semibold tracking-wide text-muted-foreground uppercase'>
              Address Information
            </h3>

            <FormTextarea
              control={form.control}
              name='address'
              label='Address'
              placeholder='Enter complete address'
            />

            <div className='grid gap-4 sm:grid-cols-2'>
              <FormSelectField
                control={form.control}
                name='stateId'
                label='State'
                placeholder='Select state'
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
                placeholder='Select city'
                options={cityOptions}
                parse={(v) => Number(v)}
                disabled={loadingCities}
                searchable
              />
            </div>

            <div className='grid gap-4 sm:grid-cols-2'>
              <FormTextInput
                control={form.control}
                name='pincode'
                label='Pincode'
                placeholder='Enter pincode'
              />

              <FormTextInput
                control={form.control}
                name='country'
                label='Country'
                placeholder='Country'
              />
            </div>
          </div>

          {/* Documents */}
          <div className='space-y-4'>
            <h3 className='text-sm font-semibold tracking-wide text-muted-foreground uppercase'>
              Documents
            </h3>

            <div className='text-sm text-muted-foreground'>
              <p>
                Profile images and document uploads will be available in the
                next update.
              </p>
              <p className='mt-1'>
                For now, you can manage employee information through the basic
                fields above.
              </p>
            </div>
          </div>
        </form>
      </Form>
    </FormDialog>
  )
}
