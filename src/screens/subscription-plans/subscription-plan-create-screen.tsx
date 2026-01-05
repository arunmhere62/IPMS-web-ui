import { useNavigate } from 'react-router-dom'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { TopNav } from '@/components/layout/top-nav'
import { ThemeSwitch } from '@/components/theme-switch'
import { toast } from 'sonner'
import {
  useCreateSubscriptionPlanMutation,
} from '@/store/subscription-plans.api'
import { SubscriptionPlanForm } from './subscription-plan-form'
import { SubscriptionPlanFormValues } from './subscription-plan.schema'

export function SubscriptionPlanCreateScreen() {
  const navigate = useNavigate()
  const [createPlan, { isLoading }] = useCreateSubscriptionPlanMutation()

  const handleSubmit = async (values: SubscriptionPlanFormValues) => {
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

    await createPlan({
      name: values.name,
      description: values.description || undefined,
      duration: values.duration,
      price: values.price,
      currency: values.currency || 'INR',
      features,
      max_pg_locations: maxPg,
      max_tenants: maxTenants,
      is_active: values.is_active,
    }).unwrap()

    toast.success('Plan created')
    navigate('/subscription-plans')
  }

  return (
    <>
      <Header>
        <TopNav links={topNav} />
        <div className='ms-auto flex items-center'>
          <ThemeSwitch />
        </div>
      </Header>
      <Main>
        <SubscriptionPlanForm
          mode='create'
          onSubmit={handleSubmit}
          isSubmitting={isLoading}
        />
      </Main>
    </>
  )
}

const topNav = [
  {
    title: 'Subscription Plans',
    href: '/subscription-plans',
    isActive: false,
    disabled: false,
  },
]
