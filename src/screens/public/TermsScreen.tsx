import { PageHeader } from '@/components/form/page-header'

export function TermsScreen() {
  return (
    <div className='legal-page relative overflow-hidden'>
      <div className='pointer-events-none absolute -top-24 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl' />
      <div className='pointer-events-none absolute -right-24 top-40 h-[420px] w-[420px] rounded-full bg-amber-500/10 blur-3xl' />
      <div className='pointer-events-none absolute -left-24 bottom-0 h-[420px] w-[420px] rounded-full bg-violet-500/10 blur-3xl' />

      <div className='container mx-auto max-w-6xl px-4 py-10 sm:py-12'>
        <div className='mx-auto max-w-3xl'>
          <div className='relative overflow-hidden rounded-3xl border border-slate-900/10 bg-[radial-gradient(900px_circle_at_0%_0%,rgba(15,23,42,0.06),transparent_55%),linear-gradient(180deg,rgba(255,255,255,0.78),rgba(255,255,255,0.50))] p-6 shadow-[0_18px_60px_rgba(15,23,42,0.10)] backdrop-blur sm:p-10'>
          <PageHeader
            title='Terms & Conditions'
            subtitle='Please read these terms carefully before using the service.'
          />

          <div className='mt-8 space-y-6'>
            <div className='text-sm text-muted-foreground'>Last Updated: [DD/MM/YYYY]</div>

            <section className='rounded-2xl border bg-white/70 p-6 shadow-sm backdrop-blur'>
          <p className='text-sm text-muted-foreground'>
            Welcome to Indian PG Management System (“App”, “Platform”, “Service”, “we”, “us”, “our”).
            This Platform is a subscription-based internal PG management system designed exclusively
            for PG owners and their authorized employees/staff.
          </p>
          <p className='mt-3 text-sm text-muted-foreground'>
            By accessing, installing, or using this App, you agree to be legally bound by these
            Terms & Conditions. If you do not agree, you must discontinue use immediately.
          </p>
        </section>

            <section className='rounded-2xl border bg-white/70 p-6 shadow-sm backdrop-blur'>
          <h2 className='text-lg font-semibold'>1. Definitions</h2>
          <div className='mt-3 space-y-3 text-sm text-muted-foreground'>
            <p>“PG Owner” means the individual or entity managing one or more PG properties.</p>
            <p>“User” means any authorized owner or staff member using the App.</p>
            <p>“Subscription” means paid access to premium features.</p>
            <p>“Tenant Data” means tenant-related information entered by users.</p>
            <p>
              “Financial Records” include rent, advances, refunds, expenses, and invoices generated
              within the App.
            </p>
          </div>
        </section>

            <section className='rounded-2xl border bg-white/70 p-6 shadow-sm backdrop-blur'>
          <h2 className='text-lg font-semibold'>2. Scope of Service</h2>
          <p className='mt-2 text-sm text-muted-foreground'>
            Indian PG Management System provides tools for:
          </p>
          <ul className='mt-3 list-disc space-y-2 ps-5 text-sm text-muted-foreground'>
            <li>Managing PG locations, rooms, beds, and occupancy</li>
            <li>Managing tenant records and stay history</li>
            <li>Tracking rent, advances, refunds, penalties, and expenses</li>
            <li>Generating internal invoices, summaries, and reports</li>
            <li>Monitoring business performance across PGs</li>
          </ul>
          <p className='mt-4 text-sm text-muted-foreground'>
            ⚠️ The Platform does not act as a legal, financial, or accounting authority.
          </p>
        </section>

            <section className='rounded-2xl border bg-white/70 p-6 shadow-sm backdrop-blur'>
          <h2 className='text-lg font-semibold'>3. Intended Use (Internal Only)</h2>
          <div className='mt-3 space-y-2 text-sm text-muted-foreground'>
            <p>The App is strictly for internal business management.</p>
            <p>It is not a tenant-facing platform.</p>
            <p>Any tenant access (if enabled by owner) is read-only and informational.</p>
            <p>We do not participate in:</p>
          </div>
          <ul className='mt-3 list-disc space-y-2 ps-5 text-sm text-muted-foreground'>
            <li>Rent collection</li>
            <li>Legal agreements</li>
            <li>Tenant verification</li>
            <li>Dispute resolution</li>
          </ul>
        </section>

            <section className='rounded-2xl border bg-white/70 p-6 shadow-sm backdrop-blur'>
          <h2 className='text-lg font-semibold'>4. User Authorization & Roles</h2>
          <p className='mt-2 text-sm text-muted-foreground'>PG owners control:</p>
          <ul className='mt-3 list-disc space-y-2 ps-5 text-sm text-muted-foreground'>
            <li>Staff access</li>
            <li>Roles and permissions</li>
            <li>Data visibility</li>
          </ul>
          <p className='mt-4 text-sm text-muted-foreground'>Owners are fully responsible for:</p>
          <ul className='mt-3 list-disc space-y-2 ps-5 text-sm text-muted-foreground'>
            <li>Actions taken by employees</li>
            <li>Data entered by staff</li>
            <li>Access revocation when employees leave</li>
          </ul>
        </section>

            <section className='rounded-2xl border bg-white/70 p-6 shadow-sm backdrop-blur'>
          <h2 className='text-lg font-semibold'>5. Account Creation & Security</h2>
          <ul className='mt-3 list-disc space-y-2 ps-5 text-sm text-muted-foreground'>
            <li>Users must provide accurate registration details.</li>
            <li>Login credentials must not be shared.</li>
          </ul>
          <p className='mt-4 text-sm text-muted-foreground'>The Platform is not liable for:</p>
          <ul className='mt-3 list-disc space-y-2 ps-5 text-sm text-muted-foreground'>
            <li>Unauthorized access due to negligence</li>
            <li>Loss caused by shared credentials</li>
          </ul>
          <p className='mt-4 text-sm text-muted-foreground'>
            Suspicious or abusive usage may lead to suspension.
          </p>
        </section>

            <section className='rounded-2xl border bg-white/70 p-6 shadow-sm backdrop-blur'>
          <h2 className='text-lg font-semibold'>6. Data Ownership & Responsibility</h2>
          <div className='mt-3 space-y-2 text-sm text-muted-foreground'>
            <p>All data entered into the App belongs to the PG owner.</p>
            <p>We act only as a data processor, not a data owner.</p>
            <p>Users confirm they have lawful rights to store tenant information.</p>
            <p>You are responsible for:</p>
          </div>
          <ul className='mt-3 list-disc space-y-2 ps-5 text-sm text-muted-foreground'>
            <li>Tenant consent</li>
            <li>Legal compliance</li>
            <li>Data correctness</li>
          </ul>
        </section>

            <section className='rounded-2xl border bg-white/70 p-6 shadow-sm backdrop-blur'>
          <h2 className='text-lg font-semibold'>7. Tenant & Personal Data Disclaimer</h2>
          <div className='mt-3 space-y-2 text-sm text-muted-foreground'>
            <p>Tenant data is entered manually by users.</p>
            <p>The Platform does not verify:</p>
          </div>
          <ul className='mt-3 list-disc space-y-2 ps-5 text-sm text-muted-foreground'>
            <li>Identity</li>
            <li>Documents</li>
            <li>Legal agreements</li>
          </ul>
          <p className='mt-4 text-sm text-muted-foreground'>
            Any misuse or incorrect handling of tenant data is the sole responsibility of the PG
            owner.
          </p>
        </section>

            <section className='rounded-2xl border bg-white/70 p-6 shadow-sm backdrop-blur'>
          <h2 className='text-lg font-semibold'>8. Financial Tracking Disclaimer</h2>
          <div className='mt-3 space-y-2 text-sm text-muted-foreground'>
            <p>All rent, advance, refund, and expense entries are user-input data.</p>
            <p>Calculations are system-generated based on inputs.</p>
            <p>We do not guarantee:</p>
          </div>
          <ul className='mt-3 list-disc space-y-2 ps-5 text-sm text-muted-foreground'>
            <li>Accuracy of amounts</li>
            <li>Legal enforceability</li>
            <li>Accounting correctness</li>
          </ul>
          <p className='mt-4 text-sm text-muted-foreground'>
            Users must independently verify financial records.
          </p>
        </section>

            <section className='rounded-2xl border bg-white/70 p-6 shadow-sm backdrop-blur'>
          <h2 className='text-lg font-semibold'>9. Invoices, Bills & Reports</h2>
          <p className='mt-2 text-sm text-muted-foreground'>The Platform may generate:</p>
          <ul className='mt-3 list-disc space-y-2 ps-5 text-sm text-muted-foreground'>
            <li>Rent invoices</li>
            <li>Refund summaries</li>
            <li>Expense reports</li>
            <li>Business analytics</li>
          </ul>
          <p className='mt-4 text-sm text-muted-foreground'>These are:</p>
          <ul className='mt-3 list-disc space-y-2 ps-5 text-sm text-muted-foreground'>
            <li>For internal reference only</li>
            <li>Not legally binding documents</li>
            <li>Not substitutes for audited accounts</li>
          </ul>
        </section>

            <section className='rounded-2xl border bg-white/70 p-6 shadow-sm backdrop-blur'>
          <h2 className='text-lg font-semibold'>10. Subscription, Billing & Payments</h2>
          <div className='mt-3 space-y-2 text-sm text-muted-foreground'>
            <p>Certain features require a paid subscription.</p>
            <p>Subscription fees are billed in advance.</p>
            <p>Prices may change with notice.</p>
            <p className='font-semibold text-foreground'>No Refund Policy</p>
            <p>All subscription payments are final and non-refundable.</p>
            <p>No refunds for:</p>
          </div>
          <ul className='mt-3 list-disc space-y-2 ps-5 text-sm text-muted-foreground'>
            <li>Partial usage</li>
            <li>Unused periods</li>
            <li>Plan changes</li>
            <li>Suspension or termination</li>
            <li>User dissatisfaction</li>
          </ul>
        </section>

            <section className='rounded-2xl border bg-white/70 p-6 shadow-sm backdrop-blur'>
          <h2 className='text-lg font-semibold'>11. Invoicing & GST Compliance (India)</h2>
          <div className='mt-3 space-y-2 text-sm text-muted-foreground'>
            <p>A tax invoice will be generated for subscription payments.</p>
            <p>GST will be applied as per Indian law, if applicable.</p>
            <p>Users must provide correct:</p>
          </div>
          <ul className='mt-3 list-disc space-y-2 ps-5 text-sm text-muted-foreground'>
            <li>Billing name</li>
            <li>Address</li>
            <li>GSTIN (if required)</li>
          </ul>
          <p className='mt-4 text-sm text-muted-foreground'>We are not responsible for:</p>
          <ul className='mt-3 list-disc space-y-2 ps-5 text-sm text-muted-foreground'>
            <li>Incorrect GST details</li>
            <li>Input errors</li>
            <li>Tax filing or claims</li>
          </ul>
          <p className='mt-4 text-sm text-muted-foreground'>
            Tenant rent GST (if any) is entirely the PG owner’s responsibility.
          </p>
        </section>

            <section className='rounded-2xl border bg-white/70 p-6 shadow-sm backdrop-blur'>
          <h2 className='text-lg font-semibold'>12. Data Backup, Retention & Deletion</h2>
          <div className='mt-3 space-y-2 text-sm text-muted-foreground'>
            <p>We take reasonable steps to protect stored data.</p>
            <p>However, we do not guarantee:</p>
          </div>
          <ul className='mt-3 list-disc space-y-2 ps-5 text-sm text-muted-foreground'>
            <li>Permanent data availability</li>
            <li>Zero data loss</li>
          </ul>
          <p className='mt-4 text-sm text-muted-foreground'>Upon subscription expiry or termination:</p>
          <ul className='mt-3 list-disc space-y-2 ps-5 text-sm text-muted-foreground'>
            <li>Data retention policies may apply</li>
            <li>Data may be deleted after a defined period</li>
          </ul>
        </section>

            <section className='rounded-2xl border bg-white/70 p-6 shadow-sm backdrop-blur'>
          <h2 className='text-lg font-semibold'>13. Service Availability & Maintenance</h2>
          <div className='mt-3 space-y-2 text-sm text-muted-foreground'>
            <p>Service uptime is provided on a best-effort basis.</p>
            <p>Downtime may occur due to:</p>
          </div>
          <ul className='mt-3 list-disc space-y-2 ps-5 text-sm text-muted-foreground'>
            <li>Maintenance</li>
            <li>Updates</li>
            <li>Infrastructure issues</li>
          </ul>
          <p className='mt-4 text-sm text-muted-foreground'>No compensation is provided for downtime.</p>
        </section>

            <section className='rounded-2xl border bg-white/70 p-6 shadow-sm backdrop-blur'>
          <h2 className='text-lg font-semibold'>14. Third-Party Services</h2>
          <p className='mt-2 text-sm text-muted-foreground'>The Platform may rely on third-party services such as:</p>
          <ul className='mt-3 list-disc space-y-2 ps-5 text-sm text-muted-foreground'>
            <li>SMS / WhatsApp</li>
            <li>Email</li>
            <li>Payment gateways</li>
          </ul>
          <p className='mt-4 text-sm text-muted-foreground'>
            Failures of third-party services are outside our control.
          </p>
        </section>

            <section className='rounded-2xl border bg-white/70 p-6 shadow-sm backdrop-blur'>
          <h2 className='text-lg font-semibold'>15. Export, Reports & Data Usage</h2>
          <div className='mt-3 space-y-2 text-sm text-muted-foreground'>
            <p>Users may export data (PDF, Excel, etc.).</p>
            <p>Exported data becomes the user’s responsibility.</p>
            <p>We are not responsible for misuse after export.</p>
          </div>
        </section>

            <section className='rounded-2xl border bg-white/70 p-6 shadow-sm backdrop-blur'>
          <h2 className='text-lg font-semibold'>16. Prohibited Activities</h2>
          <p className='mt-2 text-sm text-muted-foreground'>Users must not:</p>
          <ul className='mt-3 list-disc space-y-2 ps-5 text-sm text-muted-foreground'>
            <li>Misuse or reverse-engineer the Platform</li>
            <li>Enter fraudulent or misleading data</li>
            <li>Use the App for unlawful purposes</li>
          </ul>
          <p className='mt-4 text-sm text-muted-foreground'>
            Violations may result in immediate termination.
          </p>
        </section>

            <section className='rounded-2xl border bg-white/70 p-6 shadow-sm backdrop-blur'>
          <h2 className='text-lg font-semibold'>17. Limitation of Liability</h2>
          <div className='mt-3 space-y-2 text-sm text-muted-foreground'>
            <p>To the maximum extent permitted by law:</p>
            <p>We are not liable for:</p>
          </div>
          <ul className='mt-3 list-disc space-y-2 ps-5 text-sm text-muted-foreground'>
            <li>Financial losses</li>
            <li>Legal disputes</li>
            <li>Data inaccuracies</li>
            <li>Business losses</li>
          </ul>
          <p className='mt-4 text-sm text-muted-foreground'>
            Use of the Platform is entirely at the user’s risk.
          </p>
        </section>

            <section className='rounded-2xl border bg-white/70 p-6 shadow-sm backdrop-blur'>
          <h2 className='text-lg font-semibold'>18. Indemnification</h2>
          <p className='mt-2 text-sm text-muted-foreground'>
            You agree to indemnify and hold harmless the Platform owner from:
          </p>
          <ul className='mt-3 list-disc space-y-2 ps-5 text-sm text-muted-foreground'>
            <li>Tenant disputes</li>
            <li>Employee actions</li>
            <li>Tax issues</li>
            <li>Legal claims arising from usage</li>
          </ul>
        </section>

            <section className='rounded-2xl border bg-white/70 p-6 shadow-sm backdrop-blur'>
          <h2 className='text-lg font-semibold'>19. Suspension & Termination</h2>
          <p className='mt-2 text-sm text-muted-foreground'>We may suspend or terminate access:</p>
          <ul className='mt-3 list-disc space-y-2 ps-5 text-sm text-muted-foreground'>
            <li>For violations</li>
            <li>For misuse</li>
            <li>For legal compliance</li>
          </ul>
          <p className='mt-4 text-sm text-muted-foreground'>Termination does not entitle refunds.</p>
        </section>

            <section className='rounded-2xl border bg-white/70 p-6 shadow-sm backdrop-blur'>
          <h2 className='text-lg font-semibold'>20. Changes to Terms</h2>
          <p className='mt-2 text-sm text-muted-foreground'>
            Terms may be updated periodically. Continued use constitutes acceptance.
          </p>
        </section>

            <section className='rounded-2xl border bg-white/70 p-6 shadow-sm backdrop-blur'>
          <h2 className='text-lg font-semibold'>21. Governing Law & Jurisdiction</h2>
          <div className='mt-3 space-y-2 text-sm text-muted-foreground'>
            <p>Governed by the laws of India.</p>
            <p>Jurisdiction lies exclusively with Indian courts.</p>
          </div>
        </section>

            <section className='rounded-2xl border bg-white/70 p-6 shadow-sm backdrop-blur'>
          <h2 className='text-lg font-semibold'>22. Contact Information</h2>
          <div className='mt-3 space-y-2 text-sm text-muted-foreground'>
            <p>📧 Email: support@indianpgmanagementsystem.com</p>
            <p>🏢 Product: Indian PG Management System</p>
          </div>
        </section>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}
