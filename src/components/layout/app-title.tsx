import { Link } from 'react-router-dom'
import { Logo } from '@/assets/logo'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'

export function AppTitle() {
  const { setOpenMobile } = useSidebar()
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size='lg'
          className='gap-0 py-0 hover:bg-transparent active:bg-transparent'
          asChild
        >
          <div>
            <Link
              to='/'
              onClick={() => setOpenMobile(false)}
              className='flex flex-1 items-center gap-2 text-start text-sm leading-tight'
            >
              <Logo className='size-8' alt='IPMS' />
              <span className='grid'>
                <span className='truncate font-bold'>IPMS</span>
                <span className='truncate text-xs'>Indian PG Management System</span>
              </span>
            </Link>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
