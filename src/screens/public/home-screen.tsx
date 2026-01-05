import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/page-header'

function HomeCard({ title, description, to }: { title: string; description: string; to: string }) {
  return (
    <Link
      to={to}
      className='group rounded-xl border bg-card p-6 transition hover:border-primary/40 hover:shadow-sm'
    >
      <div className='flex items-start justify-between gap-4'>
        <div className='min-w-0'>
          <div className='text-base font-semibold'>{title}</div>
          <div className='mt-1 text-sm text-muted-foreground'>{description}</div>
        </div>
        <div className='text-muted-foreground transition group-hover:text-foreground'>→</div>
      </div>
    </Link>
  )
}

export function PublicHomeScreen() {
  return (
    <div>
      <div className='container mx-auto max-w-6xl py-10'>
        <div className='rounded-2xl border bg-card p-8'>
          <div className='grid gap-8 md:grid-cols-2 md:items-center'>
            <div>
              <h1 className='text-3xl font-bold leading-tight md:text-4xl'>
                Everything your PG needs — in one place.
              </h1>
              <p className='mt-3 text-sm text-muted-foreground md:text-base'>
                Manage tenants, payments, and daily operations. Read our policies anytime and get quick help from FAQs.
              </p>

              <div className='mt-6 flex flex-wrap gap-3'>
                <Link
                  to='/login'
                  className='rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90'
                >
                  Login to your account
                </Link>
                <Link
                  to='/faq'
                  className='rounded-lg border bg-background px-5 py-2.5 text-sm font-semibold hover:bg-muted'
                >
                  View FAQ
                </Link>
              </div>
            </div>

            <div className='rounded-xl border bg-background p-6'>
              <PageHeader
                title='Help & Policies'
                subtitle='Quick links you can share with users during signup.'
                className='mb-4'
              />
              <div className='grid gap-3'>
                <HomeCard title='FAQ' description='Quick answers to common questions.' to='/faq' />
                <HomeCard title='Terms & Conditions' description='Rules and conditions for using the service.' to='/terms' />
                <HomeCard title='Privacy Policy' description='How we collect and use your information.' to='/privacy' />
              </div>
            </div>
          </div>
        </div>

        <div className='mt-8 grid gap-4 md:grid-cols-3'>
          <div className='rounded-xl border bg-card p-6'>
            <div className='text-sm font-semibold'>Fast onboarding</div>
            <div className='mt-1 text-sm text-muted-foreground'>
              Users can read Terms/Privacy during signup and continue smoothly.
            </div>
          </div>
          <div className='rounded-xl border bg-card p-6'>
            <div className='text-sm font-semibold'>Always accessible</div>
            <div className='mt-1 text-sm text-muted-foreground'>
              Keep your FAQ and policies available via direct URLs.
            </div>
          </div>
          <div className='rounded-xl border bg-card p-6'>
            <div className='text-sm font-semibold'>Mobile + Web</div>
            <div className='mt-1 text-sm text-muted-foreground'>
              Same links work in the app WebView and in a browser.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
