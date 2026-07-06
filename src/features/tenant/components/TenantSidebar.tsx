import { useLayout } from '@/context/layout-provider'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
import { AppTitle } from '@/components/layout/app-title'
import { NavGroup } from '@/components/layout/nav-group'
import { NavUser } from '@/components/layout/nav-user'
import { type SidebarData } from '@/components/layout/types'

interface TenantSidebarProps {
  data: SidebarData
  user: {
    name: string
    email: string
    avatar: string
  }
}

export function TenantSidebar({ data, user }: TenantSidebarProps) {
  const { collapsible, variant } = useLayout()

  return (
    <Sidebar collapsible={collapsible} variant={variant}>
      <SidebarHeader>
        {data.teams.length > 0 ? (
          <div className='px-2'>
            <span className='text-sm font-semibold'>Teams</span>
          </div>
        ) : (
          <AppTitle />
        )}
      </SidebarHeader>
      <SidebarContent>
        {data.navGroups.map((props) => (
          <NavGroup key={props.title} {...props} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
