import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export function DashboardSkeleton() {
  return (
    <div className='space-y-4'>
      <div className='grid gap-4 lg:grid-cols-3'>
        <Card className='py-4 lg:col-span-2'>
          <CardHeader className='pb-2'>
            <Skeleton className='h-5 w-40' />
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid gap-3 sm:grid-cols-2'>
              <Skeleton className='h-24 rounded-lg' />
              <Skeleton className='h-24 rounded-lg' />
            </div>
            <div className='grid gap-3 sm:grid-cols-2'>
              <Skeleton className='h-28 rounded-lg' />
              <Skeleton className='h-28 rounded-lg' />
            </div>
          </CardContent>
        </Card>

        <Card className='py-4'>
          <CardHeader className='pb-2'>
            <Skeleton className='h-5 w-32' />
          </CardHeader>
          <CardContent className='space-y-3'>
            <Skeleton className='h-9 w-full rounded-md' />
            <div className='grid gap-2'>
              <Skeleton className='h-12 rounded-md' />
              <Skeleton className='h-12 rounded-md' />
              <Skeleton className='h-12 rounded-md' />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className='py-4'>
        <CardContent className='space-y-4'>
          <Skeleton className='h-4 w-40' />
          <Skeleton className='h-4 w-56' />
          <div className='flex gap-2'>
            <Skeleton className='h-10 w-32 rounded-md' />
            <Skeleton className='h-10 w-32 rounded-md' />
            <Skeleton className='h-10 w-32 rounded-md' />
          </div>
          <div className='grid gap-2'>
            <Skeleton className='h-14 rounded-md' />
            <Skeleton className='h-14 rounded-md' />
            <Skeleton className='h-14 rounded-md' />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
