import { LayoutDashboard, Building2 } from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  user: {
    name: 'satnaing',
    email: 'satnaingdev@gmail.com',
    avatar: '/avatars/shadcn.jpg',
  },
  teams: [
    
  ],
  navGroups: [
    {
      title: 'General',
      items: [
        {
          title: 'Dashboard',
          url: '/',
          icon: LayoutDashboard,
        },
        {
          title: 'PG Locations',
          url: '/pg-locations',
          icon: Building2,
        },
        {
          title: 'Subscriptions',
          url: '/subscriptions',
        },
      ],
    },
  ],
}
