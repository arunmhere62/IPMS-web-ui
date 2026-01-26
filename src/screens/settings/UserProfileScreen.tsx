import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, User } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/form/page-header'

import { useAppSelector } from '@/store/hooks'

const DetailRow = ({ label, value }: { label: string; value?: string | number | null }) => {
  return (
    <div className='flex items-start justify-between gap-4 border-b py-2 last:border-b-0'>
      <div className='text-xs text-muted-foreground'>{label}</div>
      <div className='text-sm font-semibold text-right'>{value == null || value === '' ? '—' : String(value)}</div>
    </div>
  )
}

export function UserProfileScreen() {
  const user = useAppSelector((s) => s.auth.user) as any

  const name = String(user?.name ?? 'User')
  const phone = user?.phone
  const email = user?.email

  const initials = useMemo(() => {
    const parts = name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
    const first = parts[0]?.[0] ?? 'U'
    const second = parts.length > 1 ? parts[1]?.[0] : parts[0]?.[1]
    return `${first}${second ?? ''}`.toUpperCase()
  }, [name])

  return (
    <div className='container mx-auto max-w-4xl px-3 py-6'>
      <PageHeader
        title='Profile'
        subtitle='Your account details'
        right={
          <Button asChild variant='outline' size='sm'>
            <Link to='/settings'>
              <ChevronLeft className='me-1 size-4' />
              Back
            </Link>
          </Button>
        }
      />

      <div className='mt-4 grid gap-4'>
        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center gap-3'>
              <div className='flex size-14 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground'>
                {initials}
              </div>
              <div className='min-w-0'>
                <div className='truncate text-base font-semibold'>{name}</div>
                <div className='mt-1 text-xs text-muted-foreground'>{phone || email || ''}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2 text-sm font-semibold'>
                <User className='size-4 text-primary' />
                Details
              </div>
              {user?.s_no ? <Badge variant='outline'>#{String(user.s_no)}</Badge> : null}
            </div>

            <div className='mt-3 grid gap-2'>
              <DetailRow label='Name' value={user?.name} />
              <DetailRow label='Phone' value={user?.phone} />
              <DetailRow label='Email' value={user?.email} />
              <DetailRow label='Role' value={user?.role_name ?? user?.roles?.role_name} />
              <DetailRow label='Organization' value={user?.organization_name ?? user?.organization_id} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
