import { Home, Wallet, Ticket, User } from 'lucide-react'
import { type SidebarData } from '@/components/layout/types'

export const getTenantSidebarData = (): SidebarData => {
  return {
    user: {
      name: 'IPMS Tenant',
      email: '',
      avatar: '',
    },
    teams: [],
    navGroups: [
      {
        title: 'General',
        items: [
          {
            title: 'Home',
            url: '/tenant-dashboard',
            icon: Home,
          },
          {
            title: 'Payments',
            url: '/tenant-dashboard/payments',
            icon: Wallet,
          },
          {
            title: 'Tickets',
            url: '/tenant-dashboard/tickets',
            icon: Ticket,
          },
          {
            title: 'Profile',
            url: '/tenant-dashboard/settings',
            icon: User,
          },
        ],
      },
    ],
  }
}
