import { useMemo, useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { TopNav } from '@/components/layout/top-nav'
import { ThemeSwitch } from '@/components/theme-switch'
import { FilterPopup } from '@/components/filter-popup'
import { PageHeader } from '@/components/page-header'
import { SlideOver } from '@/components/slide-over'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import {
  useDeactivateSubscriptionPlanMutation,
  useCreateSubscriptionPlanMutation,
  useGetSubscriptionPlansQuery,
  useUpdateSubscriptionPlanMutation,
} from '@/store/subscription-plans.api'
import { SubscriptionPlanForm } from './subscription-plan-form'
import { SubscriptionPlanFormValues } from './subscription-plan.schema'

export function SubscriptionPlansListScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'all'>(
    'all'
  )
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)

  // If navigated from details screen with editPlanId, open edit slide-over
  useEffect(() => {
    const state = location.state as { editPlanId?: number }
    if (state?.editPlanId != null) {
      setEditingId(state.editPlanId)
      setIsEditOpen(true)
      // Clear the state so it doesn't re-open on refresh
      window.history.replaceState({}, '', location.pathname)
    }
  }, [location])

  const queryArgs = useMemo(
    () => ({
      page: 1,
      limit: 50,
      is_active:
        statusFilter === 'all' ? undefined : statusFilter === 'active' ? true : false,
    }),
    [statusFilter]
  )

  const { data, isLoading, isError } = useGetSubscriptionPlansQuery(queryArgs)
  const [createPlan, { isLoading: isCreating }] = useCreateSubscriptionPlanMutation()
  const [updatePlan, { isLoading: isUpdating }] = useUpdateSubscriptionPlanMutation()
  const [deactivate, { isLoading: isDeactivating }] =
    useDeactivateSubscriptionPlanMutation()

  const items = data?.data?.data ?? []
  const editingPlan = editingId == null ? undefined : items.find((p) => p.s_no === editingId)

  const handleCreate = async (values: SubscriptionPlanFormValues) => {
    let features: Record<string, any> | undefined = undefined
    if (values.features_json && values.features_json.trim().length > 0) {
      try {
        features = JSON.parse(values.features_json)
      } catch {
        toast.error('Features must be valid JSON')
        return
      }
    }

    const maxPg =
      values.max_pg_locations === '' || values.max_pg_locations == null
        ? undefined
        : Number(values.max_pg_locations)
    const maxTenants =
      values.max_tenants === '' || values.max_tenants == null
        ? undefined
        : Number(values.max_tenants)

    const maxRooms =
      values.max_rooms === '' || values.max_rooms == null ? undefined : Number(values.max_rooms)
    const maxBeds =
      values.max_beds === '' || values.max_beds == null ? undefined : Number(values.max_beds)
    const maxEmployees =
      values.max_employees === '' || values.max_employees == null
        ? undefined
        : Number(values.max_employees)
    const maxUsers =
      values.max_users === '' || values.max_users == null ? undefined : Number(values.max_users)
    const maxInvoices =
      values.max_invoices_per_month === '' || values.max_invoices_per_month == null
        ? undefined
        : Number(values.max_invoices_per_month)
    const maxSms =
      values.max_sms_per_month === '' || values.max_sms_per_month == null
        ? undefined
        : Number(values.max_sms_per_month)
    const maxWhatsapp =
      values.max_whatsapp_per_month === '' || values.max_whatsapp_per_month == null
        ? undefined
        : Number(values.max_whatsapp_per_month)

    await createPlan({
      name: values.name,
      description: values.description || undefined,
      duration: values.duration,
      price: values.price,
      currency: values.currency || 'INR',
      features,
      max_pg_locations: maxPg,
      max_tenants: maxTenants,
      max_rooms: maxRooms,
      max_beds: maxBeds,
      max_employees: maxEmployees,
      max_users: maxUsers,
      max_invoices_per_month: maxInvoices,
      max_sms_per_month: maxSms,
      max_whatsapp_per_month: maxWhatsapp,
      is_active: values.is_active,
    }).unwrap()

    toast.success('Plan created')
    setIsCreateOpen(false)
  }

  const handleEditOpen = (id: number) => {
    setEditingId(id)
    setIsEditOpen(true)
  }

  const handleUpdate = async (values: SubscriptionPlanFormValues) => {
    if (editingId == null) return

    let features: any = undefined
    if (values.features_json && values.features_json.trim().length > 0) {
      try {
        features = JSON.parse(values.features_json)
      } catch {
        toast.error('Features must be valid JSON')
        return
      }
    }

    const maxPg =
      values.max_pg_locations === '' || values.max_pg_locations == null
        ? undefined
        : Number(values.max_pg_locations)
    const maxTenants =
      values.max_tenants === '' || values.max_tenants == null
        ? undefined
        : Number(values.max_tenants)

    const maxRooms =
      values.max_rooms === '' || values.max_rooms == null ? undefined : Number(values.max_rooms)
    const maxBeds =
      values.max_beds === '' || values.max_beds == null ? undefined : Number(values.max_beds)
    const maxEmployees =
      values.max_employees === '' || values.max_employees == null
        ? undefined
        : Number(values.max_employees)
    const maxUsers =
      values.max_users === '' || values.max_users == null ? undefined : Number(values.max_users)
    const maxInvoices =
      values.max_invoices_per_month === '' || values.max_invoices_per_month == null
        ? undefined
        : Number(values.max_invoices_per_month)
    const maxSms =
      values.max_sms_per_month === '' || values.max_sms_per_month == null
        ? undefined
        : Number(values.max_sms_per_month)
    const maxWhatsapp =
      values.max_whatsapp_per_month === '' || values.max_whatsapp_per_month == null
        ? undefined
        : Number(values.max_whatsapp_per_month)

    await updatePlan({
      id: editingId,
      body: {
        name: values.name,
        description: values.description || undefined,
        duration: values.duration,
        price: values.price,
        currency: values.currency || 'INR',
        features,
        max_pg_locations: maxPg,
        max_tenants: maxTenants,
        max_rooms: maxRooms,
        max_beds: maxBeds,
        max_employees: maxEmployees,
        max_users: maxUsers,
        max_invoices_per_month: maxInvoices,
        max_sms_per_month: maxSms,
        max_whatsapp_per_month: maxWhatsapp,
        is_active: values.is_active,
      },
    }).unwrap()

    toast.success('Plan updated')
    setIsEditOpen(false)
    setEditingId(null)
  }

  return (
    <>
      <Header>
        <TopNav links={topNav} />
        <div className='ms-auto flex items-center gap-2'>
          <ThemeSwitch />
        </div>
      </Header>

      <Main>
        <PageHeader
          title='Subscription Plans'
          right={
            <>
              <FilterPopup
                triggerLabel='Filter'
                title='Status'
                value={statusFilter}
                options={[
                  { label: 'All', value: 'all' },
                  { label: 'Active', value: 'active' },
                  { label: 'Inactive', value: 'inactive' },
                ]}
                onValueChange={setStatusFilter}
              />
              <Button size='sm' onClick={() => setIsCreateOpen(true)}>
                Create plan
              </Button>
            </>
          }
        />

        <SlideOver
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          title='Create Subscription Plan'
        >
          <SubscriptionPlanForm
            mode='create'
            onSubmit={handleCreate}
            isSubmitting={isCreating}
            onCancel={() => setIsCreateOpen(false)}
            noCard
          />
        </SlideOver>

        <SlideOver
          open={isEditOpen}
          onOpenChange={(open) => {
            setIsEditOpen(open)
            if (!open) setEditingId(null)
          }}
          title='Edit Subscription Plan'
        >
          {editingPlan ? (
            <SubscriptionPlanForm
              mode='edit'
              initial={editingPlan}
              onSubmit={handleUpdate}
              isSubmitting={isUpdating}
              onCancel={() => {
                setIsEditOpen(false)
                setEditingId(null)
              }}
              noCard
            />
          ) : null}
        </SlideOver>

        <div className='mt-4'>
          {isLoading ? (
            <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
              <Skeleton className='h-44 w-full' />
              <Skeleton className='h-44 w-full' />
              <Skeleton className='h-44 w-full' />
            </div>
          ) : isError ? (
            <div className='text-sm text-destructive'>Failed to load plans</div>
          ) : items.length === 0 ? (
            <div className='text-sm text-muted-foreground'>No plans found</div>
          ) : (
            <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
              {items.map((plan) => (
                <Card key={plan.s_no} className='overflow-hidden'>
                  <CardHeader className='space-y-2'>
                    <div className='flex items-start justify-between gap-3'>
                      <CardTitle className='text-lg leading-tight'>
                        {plan.name}
                      </CardTitle>
                      <Badge variant={plan.is_active ? 'default' : 'secondary'}>
                        {plan.is_active ? 'ACTIVE' : 'INACTIVE'}
                      </Badge>
                    </div>
                    {plan.description ? (
                      <div className='text-sm text-muted-foreground line-clamp-2'>
                        {plan.description}
                      </div>
                    ) : null}
                  </CardHeader>
                  <CardContent>
                    <div className='grid grid-cols-2 gap-3'>
                      <div>
                        <div className='text-xs text-muted-foreground'>Duration</div>
                        <div className='font-semibold'>{plan.duration} days</div>
                      </div>
                      <div>
                        <div className='text-xs text-muted-foreground'>Price</div>
                        <div className='font-semibold'>
                          {plan.currency} {String(plan.price)}
                        </div>
                      </div>
                      <div>
                        <div className='text-xs text-muted-foreground'>Max PGs</div>
                        <div className='font-semibold'>
                          {plan.max_pg_locations ?? '—'}
                        </div>
                      </div>
                      <div>
                        <div className='text-xs text-muted-foreground'>Max Tenants</div>
                        <div className='font-semibold'>{plan.max_tenants ?? '—'}</div>
                      </div>
                    </div>

                    <div className='mt-4 flex justify-end gap-2'>
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => navigate(`/subscription-plans/${plan.s_no}`)}
                      >
                        View details
                      </Button>
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => handleEditOpen(plan.s_no)}
                      >
                        Edit
                      </Button>
                      <Button
                        size='sm'
                        variant='destructive'
                        disabled={!plan.is_active || isDeactivating}
                        onClick={() => {
                          const confirmed = window.confirm(`Are you sure you want to deactivate "${plan.name}"?`)
                          if (confirmed) deactivate(plan.s_no)
                        }}
                      >
                        Deactivate
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </Main>
    </>
  )
}

const topNav = [
  {
    title: 'Subscription Plans',
    href: '/subscription-plans',
    isActive: true,
    disabled: false,
  },
]
