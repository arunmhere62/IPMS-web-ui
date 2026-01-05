import { Link, Outlet, useLocation } from 'react-router-dom'

function NavLink({
  to,
  label,
}: {
  to: string
  label: string
}) {
  const location = useLocation()
  const active = location.pathname === to

  return (
    <Link
      to={to}
      className={
        active
          ? 'text-foreground'
          : 'text-muted-foreground hover:text-foreground'
      }
    >
      {label}
    </Link>
  )
}

export function PublicLayout() {
  const location = useLocation()
  const isEmbedded = new URLSearchParams(location.search).get('embed') === '1'

  if (isEmbedded) {
    return <Outlet />
  }

  return (
    <div>
      <div className='sticky top-0 z-50 border-b bg-background/80 backdrop-blur'>
        <div className='container mx-auto flex max-w-6xl items-center justify-between py-4'>
          <Link to='/home' className='text-sm font-semibold'>
            PG App
          </Link>

          <nav className='flex items-center gap-4 text-sm'>
            <NavLink to='/home' label='Home' />
            <NavLink to='/faq' label='FAQ' />
            <NavLink to='/terms' label='Terms' />
            <NavLink to='/privacy' label='Privacy' />
            <Link
              to='/login'
              className='rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90'
            >
              Login
            </Link>
          </nav>
        </div>
      </div>

      <Outlet />
    </div>
  )
}
