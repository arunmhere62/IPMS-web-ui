import { useParams } from 'react-router-dom'
import { OrganizationDetailsScreen } from './organization-details-screen'

export function OrganizationDetailsRoute() {
  const { orgId } = useParams()
  const orgIdNumber = Number(orgId)

  if (!Number.isFinite(orgIdNumber)) {
    return <div className='p-4'>Invalid organization id</div>
  }

  return <OrganizationDetailsScreen orgId={orgIdNumber} />
}
