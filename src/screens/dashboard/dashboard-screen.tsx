import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { TopNav } from '@/components/layout/top-nav'
import { ThemeSwitch } from '@/components/theme-switch'

export function DashboardScreen() {
  return (
    <>
      <Header>
        <TopNav links={topNav} />
        <div className='ms-auto flex items-center'>
          <ThemeSwitch />
        </div>
      </Header>

      <Main>
        <h1 className='text-2xl font-bold'>Sample Dashboard</h1>
        <p className='mt-2 text-sm text-muted-foreground'>
          Replace this page with your real dashboard content.
        </p>
      </Main>
    </>
  )
}

const topNav = [
  {
    title: 'Dashboard',
    href: '/',
    isActive: true,
    disabled: false,
  },
]
