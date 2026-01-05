import { useLayout } from '@/context/layout-provider'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
import { AppTitle } from './app-title'
import { sidebarData } from './data/sidebar-data'
import { NavGroup } from './nav-group'
import { NavUser } from './nav-user'
import { TeamSwitcher } from './team-switcher'
import { useAppSelector } from '@/store/hooks'

export function AppSidebar() {
  const { collapsible, variant } = useLayout()

  const authUser = useAppSelector((s) => s.auth.user)
  const displayName =
    (authUser as any)?.name ||
    (authUser as any)?.full_name ||
    (authUser as any)?.username ||
    'User'
  const displayEmail =
    (authUser as any)?.email ||
    (authUser as any)?.phone ||
    (authUser as any)?.mobile ||
    ''
  const displayAvatar =
    (authUser as any)?.avatar ||
    (authUser as any)?.profile_pic ||
    (authUser as any)?.profilePic ||
    ''

  const navUser = {
    name: String(displayName),
    email: String(displayEmail),
    avatar: String(displayAvatar),
  }

  return (
    <Sidebar collapsible={collapsible} variant={variant}>
      <SidebarHeader>
        {sidebarData.teams.length > 0 ? <TeamSwitcher teams={sidebarData.teams} /> : <AppTitle />}

        {/* Replace <TeamSwitch /> with the following <AppTitle />
         /* if you want to use the normal app title instead of TeamSwitch dropdown */}
        {/* <AppTitle /> */}
      </SidebarHeader>
      <SidebarContent>
        {sidebarData.navGroups.map((props) => (
          <NavGroup key={props.title} {...props} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={navUser} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
