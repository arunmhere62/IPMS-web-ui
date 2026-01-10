import { LayoutDashboard, Building2, HelpCircle } from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  user: {
    name: 'IPMS',
    email: '',
    avatar: '',
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
        {
          title: 'FAQ',
          url: '/faq',
          icon: HelpCircle,
        },
      ],
    },
  ],
}
