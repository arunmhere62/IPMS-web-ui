import { PageHeader } from '@/components/form/page-header'

function SectionHeader({ title }: { title: string }) {
  return (
    <h2 className="text-lg font-medium py-2 border-b mb-3">{title}</h2>
  )
}

function ServiceCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className='rounded-2xl border bg-white p-6'>
      <h3 className='mb-3 text-base font-semibold text-slate-800'>{title}</h3>
      <ul className='list-disc ps-5 space-y-2'>
        {items.map((item, i) => (
          <li key={i} className='text-sm text-muted-foreground'>{item}</li>
        ))}
      </ul>
    </div>
  )
}

export function SoftwareServicesScreen() {
  return (
    <div className='legal-page'>
      <div className='container mx-auto max-w-6xl px-4 py-10 sm:py-12'>
        <div className='mx-auto max-w-3xl'>
          <div className='relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 sm:p-10'>
            <PageHeader
              title='Software Services'
              subtitle='Cloud-based Property & PG Management Software for modern accommodation businesses.'
            />

            <div className='mt-8 space-y-6'>
              <div className='text-sm text-muted-foreground'>Last Updated: May 22, 2026</div>

              {/* About Us */}
              <section className='rounded-2xl border bg-white p-6'>
                <SectionHeader title="About Us" />
                <div className='mt-3 space-y-3 text-sm text-muted-foreground'>
                  <p>
                    Indian PG Management is a cloud-based Property & PG Management Software platform designed to simplify the daily operations of Paying Guest (PG), hostel, and accommodation businesses.
                  </p>
                  <p>
                    Our software helps PG owners digitally manage tenants, rooms, occupancy, rent tracking, and property operations through an easy-to-use online platform.
                  </p>
                  <p>
                    We provide a subscription-based software service to PG owners and accommodation businesses to streamline their management process and improve operational efficiency.
                  </p>
                </div>
              </section>

              {/* Services Grid */}
              <section>
                <SectionHeader title="Our Software Services" />
                <p className='text-sm text-muted-foreground mb-4'>
                  We provide the following software services to PG owners and property managers:
                </p>
                <div className='grid gap-4 sm:grid-cols-2'>
                  <ServiceCard
                    title="PG Property Management"
                    items={[
                      'Add and manage multiple PG properties',
                      'Room and bed allocation management',
                      'Occupancy tracking',
                      'Vacancy monitoring',
                    ]}
                  />
                  <ServiceCard
                    title="Tenant Management"
                    items={[
                      'Digital tenant onboarding',
                      'Tenant profile management',
                      'ID proof and document storage',
                      'Check-in and check-out tracking',
                    ]}
                  />
                  <ServiceCard
                    title="Rent & Payment Tracking"
                    items={[
                      'Monthly rent tracking',
                      'Due date reminders',
                      'Payment history management',
                      'Expense tracking for PG owners',
                    ]}
                  />
                  <ServiceCard
                    title="Room & Occupancy Management"
                    items={[
                      'Real-time room availability monitoring',
                      'Bed occupancy status',
                      'Tenant movement tracking',
                    ]}
                  />
                  <ServiceCard
                    title="Reports & Analytics"
                    items={[
                      'Occupancy reports',
                      'Income tracking reports',
                      'Tenant management reports',
                      'Property performance insights',
                    ]}
                  />
                  <ServiceCard
                    title="Subscription-Based Software Access"
                    items={[
                      'Access to premium management features',
                      'Secure cloud data storage',
                      'Regular feature updates',
                      'Priority customer support',
                    ]}
                  />
                </div>
              </section>

              {/* Business Model */}
              <section className='rounded-2xl border bg-white p-6'>
                <SectionHeader title="Business Model" />
                <div className='mt-3 space-y-3 text-sm text-muted-foreground'>
                  <p>
                    Indian PG Management is a <strong className='text-slate-700'>Software-as-a-Service (SaaS)</strong> platform. We provide software tools and technology solutions exclusively for PG owners and accommodation businesses.
                  </p>
                  <div className='mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4'>
                    <p className='mb-3 font-semibold text-slate-800'>Important Clarification</p>
                    <ul className='list-disc ps-5 space-y-2'>
                      {[
                        'We are not a rental brokerage platform',
                        'We do not own or manage PG properties',
                        'We do not act as an intermediary between tenants and landlords',
                        'We do not collect rent on behalf of property owners',
                        'Our revenue is generated through software subscription fees paid by PG owners',
                      ].map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>

              {/* Who Can Use */}
              <section className='rounded-2xl border bg-white p-6'>
                <SectionHeader title="Who Can Use Our Platform?" />
                <p className='mt-3 mb-4 text-sm text-muted-foreground'>Our software platform is suitable for:</p>
                <ul className='list-disc ps-5 text-sm text-slate-700 space-y-1'>
                  {[
                    'PG Owners',
                    'Hostel Owners',
                    'Coliving Space Operators',
                    'Student Accommodation Providers',
                    'Rental Accommodation Businesses',
                    'Property Management Companies',
                  ].map((label, i) => (
                    <li key={i}>{label}</li>
                  ))}
                </ul>
              </section>

              {/* Subscription & Payments */}
              <section className='rounded-2xl border bg-white p-6'>
                <SectionHeader title="Subscription & Payments" />
                <div className='mt-3 space-y-3 text-sm text-muted-foreground'>
                  <p>
                    Users (PG owners) subscribe to our software platform to access management features. Payments made through our website/app are <strong className='text-slate-700'>only for:</strong>
                  </p>
                  <ul className='mt-2 list-disc ps-5 space-y-2'>
                    {[
                      'Software subscription plans',
                      'Platform usage fees',
                      'Premium software features',
                    ].map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                  <p className='mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-800'>
                    <strong>Note:</strong> We do not process rental transactions between tenants and property owners. All subscription payments are for software access only.
                  </p>
                </div>
              </section>

              {/* Contact */}
              <section className='rounded-2xl border bg-white p-6'>
                <SectionHeader title="Contact Us" />
                <div className='mt-3 space-y-2 text-sm text-muted-foreground'>
                  <p>For service-related inquiries, partnership opportunities, or software support, please contact us through our official website.</p>
                  <div className='mt-3 space-y-1'>
                    <p><strong className='text-slate-700'>Email:</strong> info@IndianPGManagement.com</p>
                    <p><strong className='text-slate-700'>Website:</strong> <a href="https://www.indianpgmanagement.com" className='underline' target='_blank' rel='noreferrer'>www.indianpgmanagement.com</a></p>
                  </div>
                </div>
              </section>

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
