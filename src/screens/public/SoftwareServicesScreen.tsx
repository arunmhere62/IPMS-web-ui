import { PageHeader } from '@/components/form/page-header'

function SectionHeader({ title }: { title: string }) {
  return (
    <h2 className="text-lg font-medium py-2 border-b mb-3">{title}</h2>
  )
}

function ServiceCard({ icon, title, items }: { icon: string; title: string; items: string[] }) {
  return (
    <div className='rounded-2xl border bg-white/70 p-6 shadow-sm backdrop-blur'>
      <div className='flex items-center gap-3 mb-4'>
        <span className='text-2xl'>{icon}</span>
        <h3 className='font-semibold text-base text-slate-800'>{title}</h3>
      </div>
      <ul className='space-y-2'>
        {items.map((item, i) => (
          <li key={i} className='flex items-start gap-2 text-sm text-muted-foreground'>
            <span className='mt-0.5 text-primary'>✓</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function SoftwareServicesScreen() {
  return (
    <div className='legal-page relative overflow-hidden'>
      <div className='pointer-events-none absolute -top-24 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl' />
      <div className='pointer-events-none absolute -right-24 top-40 h-[420px] w-[420px] rounded-full bg-amber-500/10 blur-3xl' />
      <div className='pointer-events-none absolute -left-24 bottom-0 h-[420px] w-[420px] rounded-full bg-violet-500/10 blur-3xl' />

      <div className='container mx-auto max-w-6xl px-4 py-10 sm:py-12'>
        <div className='mx-auto max-w-3xl'>
          <div className='relative overflow-hidden rounded-3xl border border-slate-900/10 bg-[radial-gradient(900px_circle_at_0%_0%,rgba(15,23,42,0.06),transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.78),rgba(255,255,255,0.50))] p-6 shadow-[0_18px_60px_rgba(15,23,42,0.10)] backdrop-blur sm:p-10'>
            <PageHeader
              title='Software Services'
              subtitle='Cloud-based Property & PG Management Software for modern accommodation businesses.'
            />

            <div className='mt-8 space-y-6'>
              <div className='text-sm text-muted-foreground'>Last Updated: May 22, 2026</div>

              {/* About Us */}
              <section className='rounded-2xl border bg-white/70 p-6 shadow-sm backdrop-blur'>
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
                    icon="🏠"
                    title="PG Property Management"
                    items={[
                      'Add and manage multiple PG properties',
                      'Room and bed allocation management',
                      'Occupancy tracking',
                      'Vacancy monitoring',
                    ]}
                  />
                  <ServiceCard
                    icon="👥"
                    title="Tenant Management"
                    items={[
                      'Digital tenant onboarding',
                      'Tenant profile management',
                      'ID proof and document storage',
                      'Check-in and check-out tracking',
                    ]}
                  />
                  <ServiceCard
                    icon="💰"
                    title="Rent & Payment Tracking"
                    items={[
                      'Monthly rent tracking',
                      'Due date reminders',
                      'Payment history management',
                      'Expense tracking for PG owners',
                    ]}
                  />
                  <ServiceCard
                    icon="🛏️"
                    title="Room & Occupancy Management"
                    items={[
                      'Real-time room availability monitoring',
                      'Bed occupancy status',
                      'Tenant movement tracking',
                    ]}
                  />
                  <ServiceCard
                    icon="📊"
                    title="Reports & Analytics"
                    items={[
                      'Occupancy reports',
                      'Income tracking reports',
                      'Tenant management reports',
                      'Property performance insights',
                    ]}
                  />
                  <ServiceCard
                    icon="🔐"
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
              <section className='rounded-2xl border bg-white/70 p-6 shadow-sm backdrop-blur'>
                <SectionHeader title="Business Model" />
                <div className='mt-3 space-y-3 text-sm text-muted-foreground'>
                  <p>
                    Indian PG Management is a <strong className='text-slate-700'>Software-as-a-Service (SaaS)</strong> platform. We provide software tools and technology solutions exclusively for PG owners and accommodation businesses.
                  </p>
                  <div className='mt-4 rounded-xl border border-blue-100 bg-blue-50/60 p-4'>
                    <p className='font-semibold text-slate-700 mb-3'>Important Clarification</p>
                    <ul className='space-y-2'>
                      {[
                        'We are not a rental brokerage platform',
                        'We do not own or manage PG properties',
                        'We do not act as an intermediary between tenants and landlords',
                        'We do not collect rent on behalf of property owners',
                        'Our revenue is generated through software subscription fees paid by PG owners',
                      ].map((item, i) => (
                        <li key={i} className='flex items-start gap-2'>
                          <span className='text-blue-500 mt-0.5'>✅</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>

              {/* Who Can Use */}
              <section className='rounded-2xl border bg-white/70 p-6 shadow-sm backdrop-blur'>
                <SectionHeader title="Who Can Use Our Platform?" />
                <p className='mt-3 text-sm text-muted-foreground mb-4'>Our software platform is suitable for:</p>
                <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
                  {[
                    { icon: '🏡', label: 'PG Owners' },
                    { icon: '🏨', label: 'Hostel Owners' },
                    { icon: '🏢', label: 'Coliving Space Operators' },
                    { icon: '🎓', label: 'Student Accommodation Providers' },
                    { icon: '🏘️', label: 'Rental Accommodation Businesses' },
                    { icon: '📋', label: 'Property Management Companies' },
                  ].map((item, i) => (
                    <div key={i} className='flex items-center gap-2 rounded-xl border bg-white/80 p-3 text-sm text-slate-700 shadow-sm'>
                      <span className='text-xl'>{item.icon}</span>
                      <span className='font-medium'>{item.label}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Subscription & Payments */}
              <section className='rounded-2xl border bg-white/70 p-6 shadow-sm backdrop-blur'>
                <SectionHeader title="Subscription & Payments" />
                <div className='mt-3 space-y-3 text-sm text-muted-foreground'>
                  <p>
                    Users (PG owners) subscribe to our software platform to access management features. Payments made through our website/app are <strong className='text-slate-700'>only for:</strong>
                  </p>
                  <ul className='space-y-2 mt-2'>
                    {[
                      'Software subscription plans',
                      'Platform usage fees',
                      'Premium software features',
                    ].map((item, i) => (
                      <li key={i} className='flex items-start gap-2'>
                        <span className='text-primary mt-0.5'>✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <p className='mt-3 rounded-xl border border-amber-100 bg-amber-50/60 p-3 text-amber-800'>
                    <strong>Note:</strong> We do not process rental transactions between tenants and property owners. All subscription payments are for software access only.
                  </p>
                </div>
              </section>

              {/* Contact */}
              <section className='rounded-2xl border bg-white/70 p-6 shadow-sm backdrop-blur'>
                <SectionHeader title="Contact Us" />
                <div className='mt-3 space-y-2 text-sm text-muted-foreground'>
                  <p>For service-related inquiries, partnership opportunities, or software support, please contact us through our official website.</p>
                  <div className='mt-3 space-y-1'>
                    <p><strong className='text-slate-700'>Email:</strong> info@IndianPGManagement.com</p>
                    <p><strong className='text-slate-700'>Website:</strong> <a href="https://www.indianpgmanagement.com" className='text-primary underline' target='_blank' rel='noreferrer'>www.indianpgmanagement.com</a></p>
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
