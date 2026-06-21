import { PageHeader } from '@/components/form/page-header'

export function AboutUsScreen() {
  return (
    <div className='legal-page'>
      <div className='container mx-auto max-w-6xl px-4 py-10 sm:py-12'>
        <div className='mx-auto max-w-3xl'>
          <div className='relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 sm:p-10'>
            <PageHeader
              title='About Us'
              subtitle='Indian PG Management System (IPMS) — Built by Satz Techno Solutions'
            />

            <div className='mt-8 space-y-6'>
              <div className='text-sm text-muted-foreground'>Last Updated: June 13, 2026</div>

              <section className='rounded-2xl border bg-white p-6'>
                <h2 className='mb-3 border-b py-2 text-lg font-medium'>Legal Entity</h2>
                <div className='space-y-2 text-sm text-muted-foreground'>
                  <p><strong>Legal Entity Name:</strong> Satz Techno Solutions (Partnership)</p>
                  <p><strong>Doing Business As:</strong> IndianPGManagement.com (IPMS)</p>
                  <p>
                    <strong>Registered Office:</strong> No 1/50, P.K Street Mettu Kantigai, Gudapakkam, Chennai,
                    Thiruvallur, Tamil Nadu, 600124, India
                  </p>
                </div>
              </section>

              <section className='rounded-2xl border bg-white p-6'>
                <h2 className='mb-3 border-b py-2 text-lg font-medium'>What We Do</h2>
                <div className='space-y-2 text-sm text-muted-foreground'>
                  <p>
                    IPMS is a cloud-based platform that helps PG (Paying Guest) operators manage properties,
                    rooms, beds, tenants, ticketing, payments, and staff. Our mission is to simplify day-to-day
                    operations and provide a seamless experience for owners and tenants.
                  </p>
                </div>
              </section>

              <section className='rounded-2xl border bg-white p-6'>
                <h2 className='mb-3 border-b py-2 text-lg font-medium'>Contact</h2>
                <div className='space-y-2 text-sm text-muted-foreground'>
                  <p><strong>Email:</strong> info@IndianPGManagement.com</p>
                  <p><strong>Phone:</strong> +91 82484 49609 / +91 90425 28852</p>
                  <p><strong>Website:</strong> www.IndianPGManagement.com</p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
