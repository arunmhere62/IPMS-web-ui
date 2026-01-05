import { useEffect, useMemo, useState } from 'react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { TopNav } from '@/components/layout/top-nav'
import { ThemeSwitch } from '@/components/theme-switch'
import { PageHeader } from '@/components/page-header'
import { SlideOver } from '@/components/slide-over'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import {
  type Permission,
  useBulkUpsertPermissionsMutation,
  useCreatePermissionMutation,
  useDeletePermissionMutation,
  useGetPermissionsQuery,
  useUpdatePermissionMutation,
} from '@/store/permissions.api'

const ACTIONS = ['CREATE', 'EDIT', 'VIEW', 'DELETE'] as const

type PermissionFormState = {
  screen_name: string
  action: string
  actions: string[]
  description: string
}

function normalizeScreenName(s: string) {
  return s.trim().toLowerCase()
}

function getScreenNameGroupKey(screenName: string) {
  const normalized = normalizeScreenName(screenName)
  return normalized || 'general'
}

function formatGroupLabel(groupKey: string) {
  return groupKey.replace(/[_-]+/g, ' ')
}

export function PermissionsScreen() {
  const { data, isLoading, isError } = useGetPermissionsQuery()
  const items = data?.data ?? []

  const groupedItems = useMemo(() => {
    const map = new Map<string, Permission[]>()
    for (const p of items) {
      const key = getScreenNameGroupKey(p.screen_name)
      const arr = map.get(key) ?? []
      arr.push(p)
      map.set(key, arr)
    }

    for (const arr of map.values()) {
      arr.sort((a, b) => {
        const aKey = `${a.screen_name}_${String(a.action).toLowerCase()}`
        const bKey = `${b.screen_name}_${String(b.action).toLowerCase()}`
        return aKey.localeCompare(bKey)
      })
    }

    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [items])

  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const next: Record<string, boolean> = {}
    for (const [group] of groupedItems) {
      next[group] = collapsedGroups[group] ?? false
    }
    setCollapsedGroups(next)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupedItems])

  const existingActionsByScreen = useMemo(() => {
    const map = new Map<string, Set<string>>()
    for (const p of items) {
      const key = String(p.screen_name ?? '').trim().toLowerCase()
      if (!key) continue
      const set = map.get(key) ?? new Set<string>()
      set.add(String(p.action).toUpperCase())
      map.set(key, set)
    }
    return map
  }, [items])

  const [createPermission, { isLoading: isCreating }] =
    useCreatePermissionMutation()
  const [bulkUpsertPermissions, { isLoading: isBulkSaving }] =
    useBulkUpsertPermissionsMutation()
  const [updatePermission, { isLoading: isUpdating }] =
    useUpdatePermissionMutation()
  const [deletePermission, { isLoading: isDeleting }] =
    useDeletePermissionMutation()

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Permission | null>(null)

  const initialForm: PermissionFormState = useMemo(
    () => ({
      screen_name: editing?.screen_name ?? '',
      action: (editing?.action as string) ?? 'VIEW',
      actions: editing?.action ? [String(editing.action)] : ['VIEW'],
      description: editing?.description ?? '',
    }),
    [editing]
  )

  const [form, setForm] = useState<PermissionFormState>(initialForm)

  // Keep form in sync when editing changes
  useEffect(() => {
    setForm(initialForm)
  }, [initialForm])

  const handleOpenCreate = () => {
    setEditing(null)
    setOpen(true)
  }

  const handleOpenEdit = (p: Permission) => {
    setEditing(p)
    setOpen(true)
  }

  const handleSubmit = async () => {
    const screen_name = normalizeScreenName(form.screen_name)
    const action = form.action
    const actions = form.actions

    const existingForScreen = existingActionsByScreen.get(screen_name) ?? new Set<string>()

    if (!screen_name) {
      toast.error('Screen name is required')
      return
    }

    if (editing) {
      if (!action) {
        toast.error('Action is required')
        return
      }

      const nextActionUpper = String(action).toUpperCase()
      const isChangingToDuplicate =
        nextActionUpper !== String(editing.action).toUpperCase() &&
        existingForScreen.has(nextActionUpper)
      if (isChangingToDuplicate) {
        toast.error('Permission already exists for this screen name and action')
        return
      }
    } else {
      const uniqueActions = Array.from(new Set((actions ?? []).map((a) => String(a).toUpperCase())))
      const nonDuplicateActions = uniqueActions.filter((a) => !existingForScreen.has(a))

      if (!nonDuplicateActions || nonDuplicateActions.length === 0) {
        toast.error('Select at least one action')
        return
      }
    }

    try {
      if (editing) {
        await updatePermission({
          id: editing.s_no,
          body: {
            screen_name,
            action,
            description: form.description || undefined,
          },
        }).unwrap()
        toast.success('Permission updated')
      } else {
        const uniqueActions = Array.from(new Set((actions ?? []).map((a) => String(a).toUpperCase())))
        const nonDuplicateActions = uniqueActions.filter((a) => !existingForScreen.has(a))

        if (nonDuplicateActions.length !== uniqueActions.length) {
          toast.error('Some selected actions already exist for this screen and were skipped')
        }

        if (nonDuplicateActions.length === 0) {
          toast.error('No new actions to create')
          return
        }

        if (nonDuplicateActions.length === 1) {
          await createPermission({
            screen_name,
            action: nonDuplicateActions[0],
            description: form.description || undefined,
          }).unwrap()
          toast.success('Permission created')
        } else {
          await bulkUpsertPermissions({
            screen_name,
            actions: nonDuplicateActions,
            description: form.description || undefined,
          }).unwrap()
          toast.success('Permissions saved')
        }
      }

      setOpen(false)
      setEditing(null)
    } catch (e: any) {
      toast.error(e?.data?.message ?? 'Failed to save permission')
    }
  }

  const handleDelete = async (p: Permission) => {
    const confirmed = window.confirm(
      `Delete permission ${p.screen_name}_${String(p.action).toLowerCase()} ?`
    )
    if (!confirmed) return

    try {
      await deletePermission(p.s_no).unwrap()
      toast.success('Permission deleted')
    } catch (e: any) {
      toast.error(e?.data?.message ?? 'Failed to delete permission')
    }
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
          title='Permissions'
          subtitle='Manage permissions_master (catalog)'
          right={
            <Button size='sm' onClick={handleOpenCreate}>
              Create permission
            </Button>
          }
        />

        {groupedItems.length > 0 && (
          <div className='mt-2 flex flex-wrap items-center gap-2'>
            <Button
              size='sm'
              variant='outline'
              onClick={() =>
                setCollapsedGroups(() => {
                  const next: Record<string, boolean> = {}
                  for (const [group] of groupedItems) next[group] = false
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
                  for (const [group] of groupedItems) next[group] = true
                  return next
                })
              }
            >
              Collapse all
            </Button>
          </div>
        )}

        <SlideOver
          open={open}
          onOpenChange={(v) => {
            setOpen(v)
            if (!v) setEditing(null)
          }}
          title={editing ? 'Edit Permission' : 'Create Permission'}
        >
          <div className='mt-4 grid gap-4'>
            <div className='grid gap-2'>
              <div className='text-sm font-medium'>Screen name</div>
              <Input
                value={form.screen_name}
                onChange={(e) => setForm((s) => ({ ...s, screen_name: e.target.value }))}
                placeholder='tenants'
              />
            </div>

            {editing ? (
              <div className='grid gap-2'>
                <div className='text-sm font-medium'>Action</div>
                <Select
                  value={form.action}
                  onValueChange={(v) => setForm((s) => ({ ...s, action: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select action' />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTIONS.map((a) => {
                      const screenKey = normalizeScreenName(form.screen_name)
                      const existing = existingActionsByScreen.get(screenKey) ?? new Set<string>()
                      const current = String(editing.action).toUpperCase()
                      const disabled = existing.has(a) && a !== current
                      return (
                        <SelectItem key={a} value={a} disabled={disabled}>
                          {a}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className='grid gap-2'>
                <div className='text-sm font-medium'>Actions</div>
                <div className='grid gap-2'>
                  {ACTIONS.map((a) => {
                    const checked = form.actions.includes(a)
                    const screenKey = normalizeScreenName(form.screen_name)
                    const existing = existingActionsByScreen.get(screenKey) ?? new Set<string>()
                    const disabled = existing.has(a)
                    return (
                      <div key={a} className='flex items-center gap-2'>
                        <Checkbox
                          checked={checked}
                          disabled={disabled}
                          onCheckedChange={(v) => {
                            setForm((s) => {
                              const next = new Set(s.actions)
                              if (v === true) next.add(a)
                              else next.delete(a)
                              return { ...s, actions: Array.from(next) }
                            })
                          }}
                        />
                        <div className={disabled ? 'text-sm text-muted-foreground' : 'text-sm'}>
                          {a}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div className='grid gap-2'>
              <div className='text-sm font-medium'>Description</div>
              <Input
                value={form.description}
                onChange={(e) =>
                  setForm((s) => ({ ...s, description: e.target.value }))
                }
                placeholder='Allows viewing tenants'
              />
            </div>

            <div className='flex justify-end gap-2'>
              <Button
                variant='outline'
                onClick={() => {
                  setOpen(false)
                  setEditing(null)
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isCreating || isUpdating || isBulkSaving}
              >
                Save
              </Button>
            </div>
          </div>
        </SlideOver>

        <div className='mt-4'>
          {isLoading ? (
            <div className='grid gap-2'>
              <Skeleton className='h-10 w-full' />
              <Skeleton className='h-10 w-full' />
              <Skeleton className='h-10 w-full' />
            </div>
          ) : isError ? (
            <div className='text-sm text-destructive'>Failed to load permissions</div>
          ) : items.length === 0 ? (
            <div className='text-sm text-muted-foreground'>No permissions found</div>
          ) : (
            <div className='space-y-4'>
              {groupedItems.map(([group, groupPermissions]) => (
                <Collapsible
                  key={group}
                  open={!collapsedGroups[group]}
                  onOpenChange={(open) =>
                    setCollapsedGroups((s) => ({ ...s, [group]: !open }))
                  }
                  className='space-y-2'
                >
                  <div className='flex items-center justify-between gap-2'>
                    <CollapsibleTrigger asChild>
                      <button type='button' className='text-sm font-semibold capitalize'>
                        {formatGroupLabel(group)}
                      </button>
                    </CollapsibleTrigger>
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() =>
                        setCollapsedGroups((s) => ({ ...s, [group]: !(s[group] ?? false) }))
                      }
                    >
                      {collapsedGroups[group] ? 'Expand' : 'Collapse'}
                    </Button>
                  </div>
                  <CollapsibleContent>
                    <div className='grid grid-cols-1 gap-2 md:grid-cols-2'>
                      {groupPermissions.map((p) => (
                        <div
                          key={p.s_no}
                          className='flex items-center justify-between gap-3 rounded-md border p-3'
                        >
                          <div className='min-w-0'>
                            <div className='font-medium'>
                              {p.screen_name}_{String(p.action).toLowerCase()}
                            </div>
                            <div className='text-sm text-muted-foreground'>
                              {p.description ?? '—'}
                            </div>
                          </div>
                          <div className='flex shrink-0 gap-2'>
                            <Button
                              size='sm'
                              variant='outline'
                              onClick={() => handleOpenEdit(p)}
                            >
                              Edit
                            </Button>
                            <Button
                              size='sm'
                              variant='destructive'
                              disabled={isDeleting}
                              onClick={() => handleDelete(p)}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      ))}
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
    title: 'Permissions',
    href: '/permissions',
    isActive: true,
    disabled: false,
  },
]
