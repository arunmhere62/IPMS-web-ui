import { Mail, Phone, MapPin, Clock } from 'lucide-react'
import { PageHeader } from '@/components/form/page-header'

export function ContactUsScreen() {
  return (
    <div className='legal-page'>
      <div className='container mx-auto max-w-6xl px-4 py-10 sm:py-12'>
        <div className='mx-auto max-w-3xl'>
          <div className='relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 sm:p-10'>
            <PageHeader
              title='Contact Us'
              subtitle='We are here to help. Reach out to us through any of the channels below.'
            />

            <div className='mt-8 grid gap-4 sm:grid-cols-2'>

              {/* Email */}
              <a
                href='mailto:info@IndianPGManagement.com'
                className='group flex items-start gap-4 rounded-2xl border bg-white p-6 transition-colors hover:border-slate-400/50'
              >
                <div className='flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-slate-700'>
                  <Mail className='size-5' />
                </div>
                <div>
                  <p className='mb-1 text-sm font-semibold text-foreground'>Email</p>
                  <p className='text-sm underline-offset-2 group-hover:underline'>
                    info@IndianPGManagement.com
                  </p>
                  <p className='mt-1 text-xs text-muted-foreground'>We respond within 1 business day</p>
                </div>
              </a>

              {/* Phone 1 */}
              <a
                href='tel:+918248449609'
                className='group flex items-start gap-4 rounded-2xl border bg-white p-6 transition-colors hover:border-slate-400/50'
              >
                <div className='flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-slate-700'>
                  <Phone className='size-5' />
                </div>
                <div>
                  <p className='mb-1 text-sm font-semibold text-foreground'>Phone</p>
                  <p className='text-sm underline-offset-2 group-hover:underline'>+91 82484 49609</p>
                  <p className='mt-1 text-xs text-muted-foreground'>Mon – Sat, 9 AM – 6 PM IST</p>
                </div>
              </a>

              {/* Phone 2 */}
              <a
                href='tel:+919042528852'
                className='group flex items-start gap-4 rounded-2xl border bg-white p-6 transition-colors hover:border-slate-400/50'
              >
                <div className='flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-slate-700'>
                  <Phone className='size-5' />
                </div>
                <div>
                  <p className='mb-1 text-sm font-semibold text-foreground'>Phone (Alternate)</p>
                  <p className='text-sm text-primary underline-offset-2 group-hover:underline'>+91 90425 28852</p>
                  <p className='mt-1 text-xs text-muted-foreground'>Mon – Sat, 9 AM – 6 PM IST</p>
                </div>
              </a>

              {/* Business hours */}
              <div className='flex items-start gap-4 rounded-2xl border bg-white p-6'>
                <div className='flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-slate-700'>
                  <Clock className='size-5' />
                </div>
                <div>
                  <p className='mb-1 text-sm font-semibold text-foreground'>Business Hours</p>
                  <p className='text-sm text-muted-foreground'>Monday – Saturday</p>
                  <p className='text-sm text-muted-foreground'>9:00 AM – 6:00 PM IST</p>
                  <p className='mt-1 text-xs text-muted-foreground'>Closed on Sundays & public holidays</p>
                </div>
              </div>

              {/* Address (Indian domicile) */}
              <div className='flex items-start gap-4 rounded-2xl border bg-white p-6 sm:col-span-2'>
                <div className='flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-slate-700'>
                  <MapPin className='size-5' />
                </div>
                <div>
                  <p className='mb-1 text-sm font-semibold text-foreground'>Registered Office (India)</p>
                  <p className='text-sm text-muted-foreground'>Satz Techno Solutions (Partnership)</p>
                  <p className='text-sm text-muted-foreground'>Doing Business As: Indian PG Management System (IPMS)</p>
                  <p className='text-sm text-muted-foreground'>No 1/50, P.K Street Mettu Kantigai, Gudapakkam</p>
                  <p className='text-sm text-muted-foreground'>Chennai, Thiruvallur, Tamil Nadu, 600124, India</p>
                  <p className='mt-1 text-sm text-muted-foreground'>Website: www.IndianPGManagement.com</p>
                </div>
              </div>

            </div>

            {/* Account closure note */}
            <div className='mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5'>
              <p className='text-sm font-semibold text-slate-800'>Want to close your account?</p>
              <p className='mt-1 text-sm text-slate-700'>
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
