import { PageHeader } from '@/components/form/page-header'

function SectionHeader({ title }: { title: string }) {
  return <h2 className='mb-3 border-b py-2 text-lg font-medium'>{title}</h2>
}

export function RefundPolicyScreen() {
  return (
    <div className='legal-page relative overflow-hidden'>
      <div className='pointer-events-none absolute -top-24 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl' />
      <div className='pointer-events-none absolute -right-24 top-40 h-[420px] w-[420px] rounded-full bg-emerald-500/10 blur-3xl' />
      <div className='pointer-events-none absolute -left-24 bottom-0 h-[420px] w-[420px] rounded-full bg-violet-500/10 blur-3xl' />

      <div className='container mx-auto max-w-6xl px-4 py-10 sm:py-12'>
        <div className='mx-auto max-w-3xl'>
          <div className='relative overflow-hidden rounded-3xl border border-slate-900/10 bg-[radial-gradient(900px_circle_at_0%_0%,rgba(15,23,42,0.06),transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.78),rgba(255,255,255,0.50))] p-6 shadow-[0_18px_60px_rgba(15,23,42,0.10)] backdrop-blur sm:p-10'>
            <PageHeader
              title='Cancellation & Refund Policy'
              subtitle='Please read this policy carefully before making a payment.'
            />

            <div className='mt-8 space-y-6'>
              <div className='text-sm text-muted-foreground'>Last Updated: January 11, 2026</div>

              <section className='rounded-2xl border bg-white/70 p-6 shadow-sm backdrop-blur'>
                <SectionHeader title='Overview' />
                <div className='space-y-2 text-sm text-muted-foreground'>
                  <p>
                    IndianPGManagement.com ("IPMS") provides a cloud-based property management platform
                    for PG (Paying Guest) operators. Payments made on the platform are for software
                    subscription licenses and related services. This policy explains our position on
                    cancellations and refunds.
                  </p>
                </div>
              </section>

              <section className='rounded-2xl border bg-white/70 p-6 shadow-sm backdrop-blur'>
                <SectionHeader title='Subscription Cancellation' />
                <div className='space-y-2 text-sm text-muted-foreground'>
                  <p>
                    You may cancel your subscription at any time from within the mobile app. Upon
                    cancellation, your access to paid features will continue until the end of the
                    current billing period. No further charges will be made after cancellation.
                  </p>
                  <p>
                    Cancellation requests must be submitted before the next billing cycle to avoid
                    being charged for the subsequent period.
                  </p>
                </div>
              </section>

              <section className='rounded-2xl border bg-white/70 p-6 shadow-sm backdrop-blur'>
                <SectionHeader title='Refund Policy' />
                <div className='space-y-2 text-sm text-muted-foreground'>
                  <p>
                    <strong>Subscription Fees:</strong> All subscription and license payments are
                    non-refundable once processed. We do not offer pro-rated refunds for unused
                    portions of an active subscription period.
                  </p>
                  <p>
                    <strong>Duplicate / Erroneous Payments:</strong> If you have been charged more
                    than once for the same transaction or have been charged incorrectly, please
                    contact us within 7 days of the transaction at{' '}
                    <a
                      href='mailto:info@IndianPGManagement.com'
                      className='text-primary underline underline-offset-2'
                    >
                      info@IndianPGManagement.com
                    </a>
                    . After verification, the duplicate or erroneous amount will be refunded within
                    7 working days to your original payment method.
                  </p>
                  <p>
                    <strong>Failed Transactions:</strong> In the event that a payment is deducted
                    from your account but the subscription is not activated, please contact our
                    support team. Such amounts will be refunded within 7 working days upon
                    confirmation.
                  </p>
                  <p>
                    <strong>Free Trial Period:</strong> No payment is required during the free trial
                    period. You will only be charged once you choose to upgrade to a paid plan.
                  </p>
                </div>
              </section>

              <section className='rounded-2xl border bg-white/70 p-6 shadow-sm backdrop-blur'>
                <SectionHeader title='Non-Refundable Items' />
                <div className='space-y-2 text-sm text-muted-foreground'>
                  <ul className='list-inside list-disc space-y-1'>
                    <li>Subscription fees for any completed billing period</li>
                    <li>One-time setup or onboarding fees</li>
                    <li>Add-on feature payments</li>
                    <li>SMS / WhatsApp messaging credits consumed</li>
                  </ul>
                </div>
              </section>

              <section className='rounded-2xl border bg-white/70 p-6 shadow-sm backdrop-blur'>
                <SectionHeader title='How to Request a Refund' />
                <div className='space-y-2 text-sm text-muted-foreground'>
                  <p>To raise a refund request, please email us at:</p>
                  <p>
                    <strong>Email:</strong>{' '}
                    <a
                      href='mailto:info@IndianPGManagement.com'
                      className='text-primary underline underline-offset-2'
                    >
                      info@IndianPGManagement.com
                    </a>
                  </p>
                  <p>Please include:</p>
                  <ul className='list-inside list-disc space-y-1'>
                    <li>Your registered email / mobile number</li>
                    <li>Transaction ID / Order ID</li>
                    <li>Date and amount of payment</li>
                    <li>Reason for the refund request</li>
                  </ul>
                  <p>
                    We will review and respond to your request within 3 business days. Approved
                    refunds will be processed within 7 working days.
                  </p>
                </div>
              </section>

              <section className='rounded-2xl border bg-white/70 p-6 shadow-sm backdrop-blur'>
                <SectionHeader title='Payment Security' />
                <div className='space-y-2 text-sm text-muted-foreground'>
                  <p>
                    Payments are processed via a secure, PCI-DSS compliant payment gateway.
                    IndianPGManagement.com does not store your card or bank details.
                    All transactions are encrypted using industry-standard SSL technology.
                  </p>
                </div>
              </section>

              <section className='rounded-2xl border bg-white/70 p-6 shadow-sm backdrop-blur'>
                <SectionHeader title='Contact Us' />
                <div className='space-y-2 text-sm text-muted-foreground'>
                  <p>
                    For any payment-related queries, cancellations, or refund requests, contact us
                    at:
                  </p>
                  <p>
                    <strong>Email:</strong>{' '}
                    <a
                      href='mailto:info@IndianPGManagement.com'
                      className='text-primary underline underline-offset-2'
                    >
                      info@IndianPGManagement.com
                    </a>
                  </p>
                  <p>
                    <strong>Phone:</strong>{' '}
                    <a href='tel:+918248449609' className='text-primary underline underline-offset-2'>
                      +91 82484 49609
                    </a>
                    {' / '}
                    <a href='tel:+919042528852' className='text-primary underline underline-offset-2'>
                      +91 90425 28852
                    </a>
                  </p>
                  <p>
                    <strong>Website:</strong> www.IndianPGManagement.com
                  </p>
                  <p>
                    <strong>Business:</strong> Indian PG Management System (IPMS)
                  </p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
