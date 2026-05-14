import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Logo } from '@/assets/logo'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { TopNav } from '@/components/layout/top-nav'
import { ThemeSwitch } from '@/components/theme-switch'

type PublicHeaderProps = {
  className?: string
}

const legalLinks = [
  { title: 'Terms and Conditions', href: '/terms' },
  { title: 'Privacy Policy', href: '/privacy' },
  { title: 'Cancellation & Refund', href: '/refund-policy' },
  { title: 'Contact Us', href: '/contact' },
]

export function PublicHeader({ className }: PublicHeaderProps) {
  const location = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const isHome = location.pathname === '/home'

  useEffect(() => {
    let frame = 0
    let latest = 0

    const update = () => {
      frame = 0
      const next = latest > 10
      setScrolled((prev) => (prev === next ? prev : next))
    }

    const onScroll = () => {
      latest = document.documentElement.scrollTop || document.body.scrollTop
      if (frame) return
      frame = window.requestAnimationFrame(update)
    }

    document.addEventListener('scroll', onScroll, { passive: true })
    onScroll()

    return () => {
      document.removeEventListener('scroll', onScroll)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])

  const isLegalActive = legalLinks.some(l => location.pathname === l.href)

  const links = useMemo(
    () => [
      { title: 'Home', href: '/home', isActive: location.pathname === '/home' },
      { title: 'Subscriptions', href: '/subscriptions', isActive: location.pathname === '/subscriptions' },
      { title: 'FAQ', href: '/faq', isActive: location.pathname === '/faq' },
      ...legalLinks.map(l => ({ title: l.title, href: l.href, isActive: location.pathname === l.href })),
    ],
    [location.pathname]
  )

  return (
    <header
      className={cn(
        'sticky top-0 z-50 h-20 border-b border-primary/10 backdrop-blur',
        isHome ? 'bg-white/10 supports-[backdrop-filter]:bg-white/5' : 'bg-background/80',
        scrolled ? 'shadow-[0_8px_30px_rgba(37,99,235,0.18)]' : 'shadow-none',
        className
      )}
    >
      <div className='container mx-auto flex h-full max-w-6xl items-center gap-3 px-4'>
        <Link to='/home' className='flex items-center gap-2 text-base font-semibold'>
          <Logo className='size-15' alt='IPMS' />
          <span className='hidden sm:inline'>IPMS</span>
        </Link>

        <div className='mx-auto hidden items-center space-x-4 lg:flex xl:space-x-6'>
          <TopNav links={links.slice(0, 3)} showMobileMenu={false} />

          {/* Legal dropdown */}
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <button className={cn(
                'flex items-center gap-1 text-base font-medium transition-colors hover:text-primary',
                isLegalActive ? 'text-foreground' : 'text-muted-foreground'
              )}>
                Policies & Support <ChevronDown className='size-4' />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='start'>
              {legalLinks.map(l => (
                <DropdownMenuItem key={l.href} asChild>
                  <NavLink to={l.href} className={location.pathname === l.href ? '' : 'text-muted-foreground'}>
                    {l.title}
                  </NavLink>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className='ms-auto flex items-center gap-2'>
          <div className='hidden items-center gap-2 lg:flex'>
            <Button asChild variant='outline' size='lg'>
              <Link to='/signup'>Signup</Link>
            </Button>
            <Button asChild size='lg'>
              <Link to='/login'>Login</Link>
            </Button>
          </div>

          <ThemeSwitch />
          {/* Mobile menu includes all links including legal */}
          <TopNav links={links} showDesktopNav={false} />
        </div>
      </div>
    </header>
  )
}
