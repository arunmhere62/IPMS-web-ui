import { PageHeader } from '@/components/form/page-header'

import addAdvanceImg from '@/assets/faq-helper-images/add-advance.jpeg'
import addRefundImg from '@/assets/faq-helper-images/add-refund.jpeg'
import addRentImg from '@/assets/faq-helper-images/add-rent.jpeg'
import checkoutImg from '@/assets/faq-helper-images/checkout.jpeg'
import createBedImg from '@/assets/faq-helper-images/create-bed.jpeg'
import createEmployeeImg from '@/assets/faq-helper-images/create-employee.jpeg'
import createPgImg from '@/assets/faq-helper-images/create-pg.jpeg'
import createRoomImg from '@/assets/faq-helper-images/create-room.jpeg'
import subscribeImg from '@/assets/faq-helper-images/subscribe.jpeg'

type FaqItem = {
  question: string
  answer: string
}

type FaqGroup = {
  title: string
  items: FaqItem[]
}

type HelperGuide = {
  title: string
  subtitle: string
  imageSrc: string
}

const HELPER_GUIDES: HelperGuide[] = [
  {
    title: 'Create PG',
    subtitle: 'Start by setting up your PG location details.',
    imageSrc: createPgImg,
  },
  {
    title: 'Create Rooms',
    subtitle: 'Add rooms with numbers and basic configuration.',
    imageSrc: createRoomImg,
  },
  {
    title: 'Create Beds',
    subtitle: 'Allocate beds under rooms and set pricing.',
    imageSrc: createBedImg,
  },
  {
    title: 'Create Employee',
    subtitle: 'Add staff and assign roles/permissions.',
    imageSrc: createEmployeeImg,
  },
  {
    title: 'Add Rent',
    subtitle: 'Record rent payments with the correct rent cycle.',
    imageSrc: addRentImg,
  },
  {
    title: 'Add Advance',
    subtitle: 'Capture advance payments and adjust dues.',
    imageSrc: addAdvanceImg,
  },
  {
    title: 'Add Refund',
    subtitle: 'Record refunds with supporting details.',
    imageSrc: addRefundImg,
  },
  {
    title: 'Checkout Tenant',
    subtitle: 'Complete checkout and finalize balances.',
    imageSrc: checkoutImg,
  },
  {
    title: 'Subscribe',
    subtitle: 'Pick a plan and activate your subscription.',
    imageSrc: subscribeImg,
  },
]


export function FaqScreen() {
  return (
    <div className='relative overflow-hidden'>
      <div className='pointer-events-none absolute -top-24 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl' />
      <div className='pointer-events-none absolute -right-24 top-40 h-[420px] w-[420px] rounded-full bg-emerald-500/10 blur-3xl' />
      <div className='pointer-events-none absolute -left-24 bottom-0 h-[420px] w-[420px] rounded-full bg-violet-500/10 blur-3xl' />

      <div className='container mx-auto max-w-6xl px-4 py-10 sm:py-12'>
        <div className='mx-auto max-w-5xl'>
          <div className='relative overflow-hidden rounded-3xl border border-slate-900/10 bg-[radial-gradient(900px_circle_at_0%_0%,rgba(15,23,42,0.06),transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.78),rgba(255,255,255,0.50))] p-6 shadow-[0_18px_60px_rgba(15,23,42,0.10)] backdrop-blur sm:p-10'>
            <div className='flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between'>
              <PageHeader
                title='FAQ'
                subtitle='Quick answers to common questions. Use the quick guides below for step-by-step help.'
              />
              <div className='hidden sm:block'>
                <div className='rounded-2xl border bg-white/60 p-4 shadow-sm backdrop-blur'>
                  <div className='text-sm font-semibold'>Need support?</div>
                  <div className='mt-1 text-xs text-muted-foreground'>
                    Open the mobile app → Settings → Report Issue to create a ticket.
                  </div>
                </div>
              </div>
            </div>

            <div className='mt-8'>
              <div className='flex items-end justify-between gap-4'>
                <div>
                  <div className='text-lg font-semibold'>Quick Guides</div>
                  <div className='mt-1 text-sm text-muted-foreground'>
                    Illustrated helpers for common workflows.
                  </div>
                </div>
              </div>

              <div className='mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                {HELPER_GUIDES.map((g) => (
                  <div
                    key={g.title}
                    className='group overflow-hidden rounded-2xl border bg-card shadow-sm transition hover:border-primary/30 hover:shadow-md'
                  >
                    <div className='relative w-full overflow-hidden bg-muted'>
                      <img
                        src={g.imageSrc}
                        alt={g.title}
                        className='block h-auto w-full transition duration-300 group-hover:scale-[1.01]'
                        loading='lazy'
                        decoding='async'
                      />
                      <div className='pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-black/0 to-black/0' />
                    </div>
                    <div className='p-4'>
                      <div className='text-sm font-semibold'>{g.title}</div>
                      <div className='mt-1 text-xs text-muted-foreground'>{g.subtitle}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            
          </div>
        </div>
      </div>
    </div>
  )
}
