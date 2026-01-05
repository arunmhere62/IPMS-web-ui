import { useEffect, useMemo, useState } from 'react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { TopNav } from '@/components/layout/top-nav'
import { ThemeSwitch } from '@/components/theme-switch'
import { PageHeader } from '@/components/page-header'
import { SlideOver } from '@/components/slide-over'
import { Button } from '@/components/ui/button'
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
  type Role,
  useCreateRoleMutation,
  useDeleteRoleMutation,
  useGetRolesQuery,
  useUpdateRoleMutation,
} from '@/store/roles.api'

const STATUSES = ['ACTIVE', 'INACTIVE'] as const

type RoleFormState = {
  role_name: string
  status: string
}

export function RolesScreen() {
  const { data, isLoading, isError } = useGetRolesQuery()
  const items = data?.data ?? []

  const [createRole, { isLoading: isCreating }] = useCreateRoleMutation()
  const [updateRole, { isLoading: isUpdating }] = useUpdateRoleMutation()
  const [deleteRole, { isLoading: isDeleting }] = useDeleteRoleMutation()

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Role | null>(null)

  const initialForm: RoleFormState = useMemo(
    () => ({
      role_name: editing?.role_name ?? '',
      status: (editing?.status as string) ?? 'ACTIVE',
    }),
    [editing]
  )

  const [form, setForm] = useState<RoleFormState>(initialForm)

  useEffect(() => {
    setForm(initialForm)
  }, [initialForm])

  const handleOpenCreate = () => {
    setEditing(null)
    setOpen(true)
  }

  const handleOpenEdit = (r: Role) => {
    setEditing(r)
    setOpen(true)
  }

  const handleSubmit = async () => {
    const role_name = form.role_name.trim()
    if (!role_name) {
      toast.error('Role name is required')
      return
    }

    try {
      if (editing) {
        await updateRole({
          id: editing.s_no,
          body: { role_name, status: form.status },
        }).unwrap()
        toast.success('Role updated')
      } else {
        await createRole({ role_name, status: form.status }).unwrap()
        toast.success('Role created')
      }

      setOpen(false)
      setEditing(null)
    } catch (e: any) {
      toast.error(e?.data?.message ?? 'Failed to save role')
    }
  }

  const handleDelete = async (r: Role) => {
    const confirmed = window.confirm(`Delete role "${r.role_name}" ?`)
    if (!confirmed) return

    try {
      await deleteRole(r.s_no).unwrap()
      toast.success('Role deleted')
    } catch (e: any) {
      toast.error(e?.data?.message ?? 'Failed to delete role')
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
          title='Roles'
          subtitle='Manage roles (do not assign users here)'
          right={
            <Button size='sm' onClick={handleOpenCreate}>
              Create role
            </Button>
          }
        />

        <SlideOver
          open={open}
          onOpenChange={(v) => {
            setOpen(v)
            if (!v) setEditing(null)
          }}
          title={editing ? 'Edit Role' : 'Create Role'}
        >
          <div className='mt-4 grid gap-4'>
            <div className='grid gap-2'>
              <div className='text-sm font-medium'>Role name</div>
              <Input
                value={form.role_name}
                onChange={(e) => setForm((s) => ({ ...s, role_name: e.target.value }))}
                placeholder='EMPLOYEE'
              />
            </div>

            <div className='grid gap-2'>
              <div className='text-sm font-medium'>Status</div>
              <Select
                value={form.status}
                onValueChange={(v) => setForm((s) => ({ ...s, status: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select status' />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                disabled={isCreating || isUpdating}
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
            <div className='text-sm text-destructive'>Failed to load roles</div>
          ) : items.length === 0 ? (
            <div className='text-sm text-muted-foreground'>No roles found</div>
          ) : (
            <div className='space-y-2'>
              {items.map((r) => (
                <div
                  key={r.s_no}
                  className='flex items-center justify-between gap-3 rounded-md border p-3'
                >
                  <div className='min-w-0'>
                    <div className='font-medium'>{r.role_name}</div>
                    <div className='text-sm text-muted-foreground'>
                      Status: {r.status ?? '—'}
                    </div>
                  </div>
                  <div className='flex shrink-0 gap-2'>
                    <Button size='sm' variant='outline' onClick={() => handleOpenEdit(r)}>
                      Edit
                    </Button>
                    <Button
                      size='sm'
                      variant='destructive'
                      disabled={isDeleting}
                      onClick={() => handleDelete(r)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
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
    title: 'Roles',
    href: '/roles',
    isActive: true,
    disabled: false,
  },
]
