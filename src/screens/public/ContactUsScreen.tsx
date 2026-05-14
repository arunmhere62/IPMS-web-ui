import { Mail, Phone, MapPin, Clock } from 'lucide-react'
import { PageHeader } from '@/components/form/page-header'

export function ContactUsScreen() {
  return (
    <div className='legal-page relative overflow-hidden'>
      <div className='pointer-events-none absolute -top-24 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl' />
      <div className='pointer-events-none absolute -right-24 top-40 h-[420px] w-[420px] rounded-full bg-emerald-500/10 blur-3xl' />
      <div className='pointer-events-none absolute -left-24 bottom-0 h-[420px] w-[420px] rounded-full bg-violet-500/10 blur-3xl' />

      <div className='container mx-auto max-w-6xl px-4 py-10 sm:py-12'>
        <div className='mx-auto max-w-3xl'>
          <div className='relative overflow-hidden rounded-3xl border border-slate-900/10 bg-[radial-gradient(900px_circle_at_0%_0%,rgba(15,23,42,0.06),transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.78),rgba(255,255,255,0.50))] p-6 shadow-[0_18px_60px_rgba(15,23,42,0.10)] backdrop-blur sm:p-10'>
            <PageHeader
              title='Contact Us'
              subtitle='We are here to help. Reach out to us through any of the channels below.'
            />

            <div className='mt-8 grid gap-4 sm:grid-cols-2'>

              {/* Email */}
              <a
                href='mailto:info@IndianPGManagement.com'
                className='group flex items-start gap-4 rounded-2xl border bg-white/70 p-6 shadow-sm backdrop-blur transition-colors hover:border-primary/40 hover:bg-primary/5'
              >
                <div className='flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary'>
                  <Mail className='size-5' />
                </div>
                <div>
                  <p className='mb-1 text-sm font-semibold text-foreground'>Email</p>
                  <p className='text-sm text-primary underline-offset-2 group-hover:underline'>
                    info@IndianPGManagement.com
                  </p>
                  <p className='mt-1 text-xs text-muted-foreground'>We respond within 1 business day</p>
                </div>
              </a>

              {/* Phone 1 */}
              <a
                href='tel:+918248449609'
                className='group flex items-start gap-4 rounded-2xl border bg-white/70 p-6 shadow-sm backdrop-blur transition-colors hover:border-primary/40 hover:bg-primary/5'
              >
                <div className='flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600'>
                  <Phone className='size-5' />
                </div>
                <div>
                  <p className='mb-1 text-sm font-semibold text-foreground'>Phone</p>
                  <p className='text-sm text-primary underline-offset-2 group-hover:underline'>+91 82484 49609</p>
                  <p className='mt-1 text-xs text-muted-foreground'>Mon – Sat, 9 AM – 6 PM IST</p>
                </div>
              </a>

              {/* Phone 2 */}
              <a
                href='tel:+919042528852'
                className='group flex items-start gap-4 rounded-2xl border bg-white/70 p-6 shadow-sm backdrop-blur transition-colors hover:border-primary/40 hover:bg-primary/5'
              >
                <div className='flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600'>
                  <Phone className='size-5' />
                </div>
                <div>
                  <p className='mb-1 text-sm font-semibold text-foreground'>Phone (Alternate)</p>
                  <p className='text-sm text-primary underline-offset-2 group-hover:underline'>+91 90425 28852</p>
                  <p className='mt-1 text-xs text-muted-foreground'>Mon – Sat, 9 AM – 6 PM IST</p>
                </div>
              </a>

              {/* Business hours */}
              <div className='flex items-start gap-4 rounded-2xl border bg-white/70 p-6 shadow-sm backdrop-blur'>
                <div className='flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600'>
                  <Clock className='size-5' />
                </div>
                <div>
                  <p className='mb-1 text-sm font-semibold text-foreground'>Business Hours</p>
                  <p className='text-sm text-muted-foreground'>Monday – Saturday</p>
                  <p className='text-sm text-muted-foreground'>9:00 AM – 6:00 PM IST</p>
                  <p className='mt-1 text-xs text-muted-foreground'>Closed on Sundays & public holidays</p>
                </div>
              </div>

              {/* Address */}
              <div className='flex items-start gap-4 rounded-2xl border bg-white/70 p-6 shadow-sm backdrop-blur sm:col-span-2'>
                <div className='flex size-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600'>
                  <MapPin className='size-5' />
                </div>
                <div>
                  <p className='mb-1 text-sm font-semibold text-foreground'>Business</p>
                  <p className='text-sm text-muted-foreground'>Indian PG Management System (IPMS)</p>
                  <p className='text-sm text-muted-foreground'>www.IndianPGManagement.com</p>
                </div>
              </div>

            </div>

            {/* Account closure note */}
            <div className='mt-6 rounded-2xl border border-amber-200 bg-amber-50/60 p-5'>
              <p className='text-sm font-semibold text-amber-800'>Want to close your account?</p>
              <p className='mt-1 text-sm text-amber-700'>
                We don't offer self-serve account deletion. Please email us at{' '}
                <a href='mailto:info@IndianPGManagement.com' className='underline underline-offset-2'>
                  info@IndianPGManagement.com
                </a>{' '}
                or call us directly and we will process your request within 2 business days.
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
