import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Bed,
  Building2,
  CircleDollarSign,
  Flame,
  LayoutGrid,
  Settings,
  Ticket,
  Users,
  Wallet,
  Wrench,
  ArrowRight,
} from 'lucide-react'

export interface QuickActionItem {
  title: string
  subtitle?: string
  screen: string
  icon: string
  color?: string
}

const ICON_MAP: Record<string, React.ElementType> = {
  flash: Flame,
  bed: Bed,
  people: Users,
  wallet: Wallet,
  calendar: CircleDollarSign,
  building: Building2,
  ticket: Ticket,
  settings: Settings,
  grid: LayoutGrid,
  wrench: Wrench,
}

const SUBTITLE_MAP: Record<string, string> = {
  QuickSetup: 'Initial setup guide',
  Rooms: 'Rooms & beds',
  Tenants: 'Manage tenants',
  Expenses: 'Track expenses',
  UpcomingVacancies: 'Vacancy calendar',
  Visitors: 'Visitor log',
  Employees: 'Staff management',
  Tickets: 'Support tickets',
  Payments: 'Payments center',
  Settings: 'App settings',
}

const COLOR_CLASSES: Record<string, string> = {
  QuickSetup: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100',
  Rooms: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
  Tenants: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
  Expenses: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
  UpcomingVacancies: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100',
  Visitors: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
  Employees: 'bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100',
  Tickets: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100',
  Payments: 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100',
  Settings: 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100',
}

interface QuickActionsProps {
  menuItems: QuickActionItem[]
  onNavigate: (screen: string) => void
  tourHintScreen?: string | null
  className?: string
}

export function QuickActions({
  menuItems,
  onNavigate,
  tourHintScreen,
  className,
}: QuickActionsProps) {
  return (
    <div className={cn('space-y-3', className)}>
      <div className='flex items-center justify-between'>
        <div>
          <div className='text-base font-semibold'>Quick Actions</div>
          <div className='text-xs text-muted-foreground'>
            Jump to frequently used sections
          </div>
        </div>
      </div>

      <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'>
        {menuItems.map((item) => {
          const Icon = ICON_MAP[item.icon] ?? LayoutGrid
          const colorClass =
            COLOR_CLASSES[item.screen] ??
            'bg-muted text-foreground border-border hover:bg-accent'
          const showHint = tourHintScreen === item.screen

          return (
            <Button
              key={item.screen}
              variant='outline'
              onClick={() => onNavigate(item.screen)}
              className={cn(
                'group relative h-auto flex-col items-start gap-2 border p-4 text-left transition-colors',
                colorClass
              )}
            >
              {showHint && (
                <span className='absolute -top-2 right-2 inline-flex animate-pulse items-center rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground'>
                  Tap here
                </span>
              )}
              <Icon className='size-5 shrink-0' />
              <div className='min-w-0'>
                <div className='text-sm font-semibold'>{item.title}</div>
                <div className='text-xs opacity-80'>
                  {item.subtitle ?? SUBTITLE_MAP[item.screen] ?? 'Open'}
                </div>
              </div>
              <ArrowRight className='absolute right-2 bottom-2 size-4 opacity-0 transition-opacity group-hover:opacity-100' />
            </Button>
          )
        })}
      </div>
    </div>
  )
}
