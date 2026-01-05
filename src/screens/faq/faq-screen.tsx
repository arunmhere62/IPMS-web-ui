import { PageHeader } from '@/components/page-header'

type FaqItem = {
  question: string
  answer: string
}

type FaqGroup = {
  title: string
  items: FaqItem[]
}

const FAQ_GROUPS: FaqGroup[] = [
  {
    title: 'Account & Login',
    items: [
      {
        question: 'OTP not coming. What should I do?',
        answer:
          'Check network coverage, verify the phone number, and try again after 30 seconds. If it still fails, use “Report Issue” from the app and mention your phone number and time of attempt.',
      },
      {
        question: 'Why am I getting “No permission / Access denied”?',
        answer:
          'Your role may not have the required permission. Contact your admin or ask them to update your role/permission overrides.',
      },
    ],
  },
  {
    title: 'Tenants',
    items: [
      {
        question: 'How do I add a new tenant?',
        answer:
          'Go to Tenants → Add Tenant, fill tenant details and upload documents/photos if required, then save.',
      },
      {
        question: 'How do I move a tenant to another bed/room?',
        answer:
          'Open the tenant details and update their room/bed assignment. If you face an issue, raise a ticket with the tenant name and target bed/room.',
      },
    ],
  },
  {
    title: 'Payments & Bills',
    items: [
      {
        question: 'How is rent cycle calculated?',
        answer:
          'Rent cycle depends on your PG settings (calendar-based or mid-month). If bills look incorrect, raise a ticket with PG name, tenant, and date range.',
      },
      {
        question: 'Payment marked failed but money deducted. What next?',
        answer:
          'Share payment reference/UPI txn id and date/time via a support ticket. We will verify and update status or guide on refund timelines.',
      },
    ],
  },
]

export function FaqScreen() {
  return (
    <div className='container py-6'>
      <PageHeader
        title='FAQ'
        subtitle='Quick answers to common questions. If you still need help, raise a ticket from the mobile app.'
      />

      <div className='mt-6 space-y-6'>
        {FAQ_GROUPS.map((group) => (
          <section key={group.title} className='rounded-xl border bg-card p-4'>
            <h2 className='text-lg font-semibold'>{group.title}</h2>

            <div className='mt-3 space-y-4'>
              {group.items.map((item) => (
                <details key={item.question} className='rounded-lg border bg-background px-4 py-3'>
                  <summary className='cursor-pointer text-sm font-semibold'>{item.question}</summary>
                  <div className='mt-2 text-sm text-muted-foreground'>{item.answer}</div>
                </details>
              ))}
            </div>
          </section>
        ))}

        <div className='rounded-xl border bg-card p-4'>
          <h2 className='text-lg font-semibold'>Need more help?</h2>
          <div className='mt-2 text-sm text-muted-foreground'>
            Open the mobile app → Settings → Report Issue to create a support ticket.
          </div>
        </div>
      </div>
    </div>
  )
}
