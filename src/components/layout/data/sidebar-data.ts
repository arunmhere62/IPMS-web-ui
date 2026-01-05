import { LayoutDashboard, Command, Building2, CreditCard, Shield, FileText, Ticket } from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  user: {
    name: 'satnaing',
    email: 'satnaingdev@gmail.com',
    avatar: '/avatars/shadcn.jpg',
  },
  teams: [
    {
      name: 'Shadcn Admin',
      logo: Command,
      plan: 'Vite + ShadcnUI',
    },
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
          title: 'Tickets',
          url: '/tickets',
          icon: Ticket,
        },
        {
          title: 'Organizations',
          url: '/organizations',
          icon: Building2,
        },
        {
          title: 'Subscription Plans',
          url: '/subscription-plans',
          icon: CreditCard,
        },
        {
          title: 'Legal Documents',
          url: '/legal-documents',
          icon: FileText,
        },
      ],
    },
    {
      title: 'Access Control',
      items: [
        {
          title: 'Permissions',
          url: '/permissions',
          icon: Shield,
        },
        {
          title: 'Roles',
          url: '/roles',
          icon: Shield,
        },
        {
          title: 'Role Permissions',
          url: '/role-permissions',
          icon: Shield,
        },
      ],
    },
  ],
}
