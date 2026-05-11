import { Link } from 'react-router-dom'
import { Logo } from '@/assets/logo'
import { Mail, Phone, ShieldCheck } from 'lucide-react'

const CURRENT_YEAR = new Date().getFullYear()

const LEGAL_LINKS = [
  { label: 'Terms of Service', to: '/terms' },
  { label: 'Privacy Policy', to: '/privacy' },
  { label: 'Cancellation & Refund Policy', to: '/refund-policy' },
  { label: 'FAQ', to: '/faq' },
  { label: 'Pricing', to: '/subscriptions' },
]

export function AppFooter() {
  return (
    <footer className='border-t bg-background'>
      <div className='container mx-auto max-w-6xl px-4 py-8'>

        <div className='grid gap-8 sm:grid-cols-3'>
          {/* Brand + contact */}
          <div className='space-y-3'>
            <Link to='/home' className='flex items-center gap-2 text-sm font-semibold text-foreground'>
              <Logo className='size-6' alt='IPMS' />
              <span>IPMS</span>
            </Link>
            <p className='text-xs text-muted-foreground'>
              Indian PG Management System — manage your PG properties efficiently.
            </p>
            <a
              href='mailto:info@IndianPGManagement.com'
              className='flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground'
            >
              <Mail className='size-3.5' />
              info@IndianPGManagement.com
            </a>
            <a
              href='tel:+918248449609'
              className='flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground'
            >
              <Phone className='size-3.5' />
              +91 82484 49609
            </a>
            <a
              href='tel:+919042528852'
              className='flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground'
            >
              <Phone className='size-3.5' />
              +91 90425 28852
            </a>
          </div>

          {/* Legal links */}
          <div>
            <p className='mb-3 text-xs font-semibold uppercase tracking-wider text-foreground'>Legal</p>
            <nav className='flex flex-col gap-2'>
              {LEGAL_LINKS.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  className='text-xs text-muted-foreground transition-colors hover:text-foreground'
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Secure payment note */}
          <div>
            <p className='mb-3 text-xs font-semibold uppercase tracking-wider text-foreground'>Payments</p>
            <div className='space-y-2'>
              <div className='flex items-start gap-2 text-xs text-muted-foreground'>
                <ShieldCheck className='mt-0.5 size-3.5 shrink-0 text-emerald-500' />
                <span>Payments are processed via a secure, PCI-DSS compliant payment gateway.</span>
              </div>
              <div className='flex items-start gap-2 text-xs text-muted-foreground'>
                <ShieldCheck className='mt-0.5 size-3.5 shrink-0 text-emerald-500' />
                <span>We do not store your card or bank details. All transactions are SSL encrypted.</span>
              </div>
              <div className='mt-3 text-xs text-muted-foreground'>
                Subscription billing is managed in the mobile app.
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className='mt-8 flex flex-col items-center justify-between gap-2 border-t pt-4 sm:flex-row'>
          <p className='text-xs text-muted-foreground'>
            © {CURRENT_YEAR} IndianPGManagement.com. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
