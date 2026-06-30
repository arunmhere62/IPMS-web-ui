import {
  LayoutDashboard,
  Building2,
  HelpCircle,
  Users,
  DoorOpen,
  UserRound,
  User,
  Settings,
  Ticket,
  CreditCard,
  Wallet,
  FileText,
  Shield,
  RefreshCcw,
  MonitorCheck,
  Receipt,
} from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  user: {
    name: 'IPMS',
    email: '',
    avatar: '',
  },
  teams: [],
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
          title: 'Employees',
          url: '/employees',
          icon: Users,
        },
        {
          title: 'Tenants',
          url: '/tenants',
          icon: UserRound,
        },
        {
          title: 'Visitors',
          url: '/visitors',
          icon: User,
        },
        {
          title: 'Rooms',
          url: '/rooms',
          icon: DoorOpen,
        },
        {
          title: 'Payments',
          url: '/payments',
          icon: Wallet,
        },
        {
          title: 'Expenses',
          url: '/expenses',
          icon: Receipt,
        },
        {
          title: 'Subscriptions',
          url: '/subscriptions/manage',
          icon: CreditCard,
        },
        {
          title: 'Tickets',
          url: '/tickets',
          icon: Ticket,
        },
        {
          title: 'Settings',
          url: '/settings',
          icon: Settings,
        },
        {
          title: 'FAQ',
          url: '/dashboard/faq',
          icon: HelpCircle,
        },
      ],
    },
    {
      title: 'Policies & Support',
      items: [
        {
          title: 'Terms and Conditions',
          url: '/dashboard/terms',
          icon: FileText,
        },
        {
          title: 'Privacy Policy',
          url: '/dashboard/privacy',
          icon: Shield,
        },
        {
          title: 'Cancellation & Refund',
          url: '/dashboard/refund-policy',
          icon: RefreshCcw,
        },
        {
          title: 'Contact Us',
          url: '/dashboard/contact',
          icon: HelpCircle,
        },
        {
          title: 'Software Services',
          url: '/dashboard/software-services',
          icon: MonitorCheck,
        },
      ],
    },
  ],
}
