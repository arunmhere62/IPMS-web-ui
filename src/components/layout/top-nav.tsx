import { NavLink } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type TopNavProps = React.HTMLAttributes<HTMLElement> & {
  links: {
    title: string
    href: string
    isActive: boolean
    disabled?: boolean
  }[]
  showMobileMenu?: boolean
  showDesktopNav?: boolean
}

export function TopNav({ className, links, ...props }: TopNavProps) {
  const { showMobileMenu = true, showDesktopNav = true, ...navProps } = props
  return (
    <>
      {showMobileMenu ? (
        <div className='lg:hidden'>
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button size='icon' variant='outline' className='size-10 md:size-9'>
                <Menu />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side='bottom' align='start'>
              {links.map(({ title, href, isActive, disabled }) => (
                <DropdownMenuItem key={`${title}-${href}`} asChild>
                  {disabled ? (
                    <span className='text-muted-foreground'>{title}</span>
                  ) : (
                    <NavLink
                      to={href}
                      className={!isActive ? 'text-muted-foreground' : ''}
                    >
                      {title}
                    </NavLink>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : null}

      {showDesktopNav ? (
        <nav
          className={cn(
            'hidden items-center space-x-4 lg:flex lg:space-x-4 xl:space-x-6',
            className
          )}
          {...navProps}
        >
          {links.map(({ title, href, isActive, disabled }) => (
            disabled ? (
              <span
                key={`${title}-${href}`}
                className='text-base font-medium text-muted-foreground'
              >
                {title}
              </span>
            ) : (
              <NavLink
                key={`${title}-${href}`}
                to={href}
                className={`text-base font-medium transition-colors hover:text-primary ${isActive ? '' : 'text-muted-foreground'}`}
              >
                {title}
              </NavLink>
            )
          ))}
        </nav>
      ) : null}
    </>
  )
}
