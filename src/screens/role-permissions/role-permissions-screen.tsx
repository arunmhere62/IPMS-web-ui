import { useEffect, useMemo, useState } from 'react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { TopNav } from '@/components/layout/top-nav'
import { ThemeSwitch } from '@/components/theme-switch'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Skeleton } from '@/components/ui/skeleton'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { useGetRolesQuery } from '@/store/roles.api'
import {
  useBulkUpdateRolePermissionsMutation,
  useGetRolePermissionsQuery,
} from '@/store/role-permissions.api'
import { ConfirmDialog } from '@/components/confirm-dialog'

function buildPermissionKey(screenName: string, action: string) {
  return `${screenName}_${action.toLowerCase()}`
}

export function RolePermissionsScreen() {
  const { data: rolesRes, isLoading: rolesLoading } = useGetRolesQuery()
  const roles = rolesRes?.data ?? []

  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const roleId = selectedRoleId ?? (roles.length > 0 ? roles[0].s_no : null)

  const roleIdForQuery = roleId ?? 0

  const {
    data: permsRes,
    isLoading: permsLoading,
    isError: permsError,
  } = useGetRolePermissionsQuery(roleIdForQuery, {
    skip: roleId == null,
  })

  const [bulkUpdate, { isLoading: saving }] =
    useBulkUpdateRolePermissionsMutation()

  const permissions = permsRes?.data?.permissions ?? []

  const [local, setLocal] = useState<Record<string, boolean>>({})

  const groupedPermissions = useMemo(() => {
    const map = new Map<string, typeof permissions>()
    for (const p of permissions) {
      const group = p.screen_name || 'general'
      if (!map.has(group)) map.set(group, [])
      map.get(group)!.push(p)
    }

    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [permissions])

  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const next: Record<string, boolean> = {}
    for (const [group] of groupedPermissions) {
      next[group] = collapsedGroups[group] ?? false
    }
    setCollapsedGroups(next)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupedPermissions])

  // initialize local state when permissions change
  useEffect(() => {
    if (!permissions.length) return
    const next: Record<string, boolean> = {}
    for (const p of permissions) {
      next[buildPermissionKey(p.screen_name, String(p.action))] = !!p.granted
    }
    setLocal(next)
  }, [permissions])

  const handleSave = () => {
    if (roleId == null) return
    setConfirmOpen(true)
  }

  const handleConfirmSave = async () => {
    if (roleId == null) return

    try {
      await bulkUpdate({
        roleId,
        body: { permissions: local },
      }).unwrap()
      toast.success('Role permissions saved')
      setConfirmOpen(false)
    } catch (e: any) {
      toast.error(e?.data?.message ?? 'Failed to save role permissions')
    }
  }

  const togglePermission = (key: string) => {
    setLocal((s) => ({ ...s, [key]: !(s[key] ?? false) }))
  }

  return (
    <>
      <Header>
        <TopNav links={topNav} />
        <div className='ms-auto flex items-center gap-2'>
          <ThemeSwitch />
        </div>
      </Header>

      <Main>
        <PageHeader
          title='Role Permissions'
          subtitle='Grant baseline permissions to roles (role_permissions)'
          right={
            <Button size='sm' onClick={handleSave} disabled={saving || roleId == null}>
              Save changes
            </Button>
          }
        />

        {groupedPermissions.length > 0 && roleId != null && (
          <div className='mt-2 flex flex-wrap items-center gap-2'>
            <Button
              size='sm'
              variant='outline'
              onClick={() =>
                setCollapsedGroups(() => {
                  const next: Record<string, boolean> = {}
                  for (const [group] of groupedPermissions) next[group] = false
                  return next
                })
              }
            >
              Expand all
            </Button>
            <Button
              size='sm'
              variant='outline'
              onClick={() =>
                setCollapsedGroups(() => {
                  const next: Record<string, boolean> = {}
                  for (const [group] of groupedPermissions) next[group] = true
                  return next
                })
              }
            >
              Collapse all
            </Button>
          </div>
        )}

        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title='Confirm save changes'
          desc='Are you sure you want to update baseline permissions for this role?'
          confirmText='Yes, save'
          handleConfirm={handleConfirmSave}
          isLoading={saving}
          disabled={saving || roleId == null}
        />

        <div className='mt-4 grid gap-4'>
          <div>
            <div className='mb-2 text-sm font-medium'>Select role</div>
            {rolesLoading ? (
              <Skeleton className='h-9 w-[320px]' />
            ) : roles.length === 0 ? (
              <div className='text-sm text-muted-foreground'>Create a role first.</div>
            ) : (
              <Tabs
                value={String(roleId ?? '')}
                onValueChange={(v) => setSelectedRoleId(Number(v))}
              >
                <TabsList className='flex h-auto w-full flex-wrap justify-start gap-1 bg-transparent p-0'>
                  {roles.map((r) => (
                    <TabsTrigger
                      key={r.s_no}
                      value={String(r.s_no)}
                      className='flex-none rounded-md border bg-background px-3 py-2 text-sm data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground'
                    >
                      {r.role_name}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            )}
          </div>

          {roleId == null ? (
            <div className='text-sm text-muted-foreground'>Create a role first.</div>
          ) : permsLoading ? (
            <div className='grid gap-2'>
              <Skeleton className='h-10 w-full' />
              <Skeleton className='h-10 w-full' />
              <Skeleton className='h-10 w-full' />
            </div>
          ) : permsError ? (
            <div className='text-sm text-destructive'>Failed to load role permissions</div>
          ) : (
            <div className='space-y-4'>
              {groupedPermissions.map(([groupName, perms]) => (
                <Collapsible
                  key={groupName}
                  open={!collapsedGroups[groupName]}
                  onOpenChange={(open) =>
                    setCollapsedGroups((s) => ({ ...s, [groupName]: !open }))
                  }
                  className='space-y-2'
                >
                  <div className='flex items-center justify-between gap-2'>
                    <CollapsibleTrigger asChild>
                      <button type='button' className='text-sm font-semibold capitalize'>
                        {groupName}
                      </button>
                    </CollapsibleTrigger>
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() =>
                        setCollapsedGroups((s) => ({
                          ...s,
                          [groupName]: !(s[groupName] ?? false),
                        }))
                      }
                    >
                      {collapsedGroups[groupName] ? 'Expand' : 'Collapse'}
                    </Button>
                  </div>
                  <CollapsibleContent>
                    <div className='grid grid-cols-1 gap-2 md:grid-cols-2'>
                      {perms.map((p) => {
                        const key = buildPermissionKey(p.screen_name, String(p.action))
                        const checked = local[key] ?? false
                        return (
                          <div
                            key={p.s_no}
                            role='button'
                            tabIndex={0}
                            className='flex cursor-pointer items-center justify-between gap-3 rounded-md border p-3 transition-colors hover:bg-muted/40'
                            onClick={() => togglePermission(key)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') togglePermission(key)
                            }}
                          >
                            <div className='min-w-0'>
                              <div className='font-medium'>{key}</div>
                              <div className='text-sm text-muted-foreground'>
                                {p.description ?? '—'}
                              </div>
                            </div>
                            <Checkbox
                              checked={checked}
                              onClick={(e) => e.stopPropagation()}
                              onCheckedChange={(v) =>
                                setLocal((s) => ({ ...s, [key]: v === true }))
                              }
                            />
                          </div>
                        )
                      })}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          )}
        </div>
      </Main>
    </>
  )
}

const topNav = [
  {
    title: 'Role Permissions',
    href: '/role-permissions',
    isActive: true,
    disabled: false,
  },
]
