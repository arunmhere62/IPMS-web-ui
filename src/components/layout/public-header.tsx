import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { TopNav } from '@/components/layout/top-nav'
import { ThemeSwitch } from '@/components/theme-switch'

type PublicHeaderProps = {
  className?: string
}

export function PublicHeader({ className }: PublicHeaderProps) {
  const location = useLocation()
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      setOffset(document.body.scrollTop || document.documentElement.scrollTop)
    }

    document.addEventListener('scroll', onScroll, { passive: true })
    return () => document.removeEventListener('scroll', onScroll)
  }, [])

  const links = useMemo(
    () => [
      { title: 'Home', href: '/home', isActive: location.pathname === '/home' },
      { title: 'Subscriptions', href: '/subscriptions', isActive: location.pathname === '/subscriptions' },
      { title: 'Terms', href: '/terms', isActive: location.pathname === '/terms' },
      { title: 'Privacy', href: '/privacy', isActive: location.pathname === '/privacy' },
    ],
    [location.pathname]
  )

  return (
    <header
      className={cn(
        'sticky top-0 z-50 h-16 border-b bg-background/80 backdrop-blur',
        offset > 10 ? 'shadow' : 'shadow-none',
        className
      )}
    >
      <div className='container mx-auto flex h-full max-w-6xl items-center gap-3 px-4'>
        <Link to='/home' className='text-sm font-semibold'>
          PG App
        </Link>

        <div className='ms-auto flex items-center gap-3'>
          <TopNav links={links} />
          <ThemeSwitch />
          <div className='hidden items-center gap-2 lg:flex'>
            <Button asChild variant='outline'>
              <Link to='/signup'>Signup</Link>
            </Button>
            <Button asChild>
              <Link to='/login'>Login</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
