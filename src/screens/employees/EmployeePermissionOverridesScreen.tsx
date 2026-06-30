import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  useGetUserPermissionsQuery,
  useListPermissionsGroupedQuery,
  useListUserPermissionOverridesQuery,
  useBulkUpsertUserPermissionOverridesMutation,
  useRemoveUserPermissionOverrideMutation,
  useLazyGetMyPermissionsQuery,
  type PermissionCatalogItem,
} from '@/services/rbacApi'
import { useAppSelector } from '@/store/hooks'
import type { RootState } from '@/store/store'
import type { AuthUser } from '@/store/slices/authSlice'
import { showErrorAlert, showSuccessAlert } from '@/utils/toast'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/form/page-header'

const EFFECTS = ['ALLOW', 'DENY'] as const
type Effect = (typeof EFFECTS)[number]

const isSuperAdminUser = (user: AuthUser): boolean => {
  const roleNameRaw = (user as any)?.role_name ?? (user as any)?.roles?.role_name
  const roleName = String(roleNameRaw ?? '').toLowerCase()
  return (
    roleName === 'super_admin' ||
    roleName === 'superadmin' ||
    roleName === 'super admin'
  )
}

const buildPermissionKey = (p: PermissionCatalogItem) => {
  return `${p.screen_name}_${String(p.action).toLowerCase()}`
}

export function EmployeePermissionOverridesScreen() {
  const params = useParams()
  const employeeId = Number(params.id)
  const validId = Number.isFinite(employeeId) && employeeId > 0 ? employeeId : 0

  const user = useAppSelector((s: RootState) => s.auth.user)
  const isSuperAdmin = useMemo(() => isSuperAdminUser(user), [user])

  useEffect(() => {
    if (!isSuperAdmin) return
  }, [isSuperAdmin])

  const {
    data: groupedPermissions,
    isLoading: loadingCatalog,
    refetch: refetchCatalog,
  } = useListPermissionsGroupedQuery()

  const {
    data: overrides,
    isLoading: loadingOverrides,
    refetch: refetchOverrides,
  } = useListUserPermissionOverridesQuery({ user_id: validId })

  const {
    data: employeePerms,
    refetch: refetchEmployeePerms,
  } = useGetUserPermissionsQuery(validId, { skip: !validId })

  const [bulkUpsertOverrides, { isLoading: saving }] =
    useBulkUpsertUserPermissionOverridesMutation()
  const [removeOverride, { isLoading: removing }] =
    useRemoveUserPermissionOverrideMutation()
  const [triggerRefreshMyPerms] = useLazyGetMyPermissionsQuery()

  const [pending, setPending] = useState<Record<number, Effect>>({})
  const [clearTarget, setClearTarget] = useState<PermissionCatalogItem | null>(
    null
  )

  const overrideByPermissionId = useMemo(() => {
    const map = new Map<number, { effect: string }>()
    ;(overrides ?? []).forEach((o) => {
      map.set(o.permission_id, { effect: o.effect })
    })
    return map
  }, [overrides])

  const groups = useMemo(() => {
    const entries = Object.entries(groupedPermissions ?? {})
    return entries.sort(([a], [b]) => a.localeCompare(b))
  }, [groupedPermissions])

  const permissionsMap =
    (employeePerms as any)?.permissions_map ?? {}

  const onSet = (permission: PermissionCatalogItem, effect: Effect) => {
    setPending((prev) => ({ ...prev, [permission.s_no]: effect }))
  }

  const onSaveBulk = async () => {
    const entries = Object.entries(pending)
    if (entries.length === 0) {
      showSuccessAlert('No pending changes')
      return
    }

    try {
      await bulkUpsertOverrides({
        overrides: entries.map(([permissionId, effect]) => ({
          user_id: validId,
          permission_id: Number(permissionId),
          effect: effect as any,
        })),
      }).unwrap()

      setPending({})
      showSuccessAlert('Overrides saved')
      await refetchOverrides()
      await refetchEmployeePerms()
      await triggerRefreshMyPerms()
    } catch (e: any) {
      showErrorAlert(e, 'Bulk Save Error')
    }
  }

  const onClear = (permission: PermissionCatalogItem) => {
    setClearTarget(permission)
  }

  const confirmClear = async () => {
    if (!clearTarget) return
    try {
      await removeOverride({
        user_id: validId,
        permission_id: clearTarget.s_no,
      }).unwrap()
      showSuccessAlert('Override removed')
      await refetchOverrides()
      await refetchEmployeePerms()
      await triggerRefreshMyPerms()
      setClearTarget(null)
    } catch (e: any) {
      showErrorAlert(e, 'Override Error')
    }
  }

  const loading = loadingCatalog || loadingOverrides

  if (!isSuperAdmin) {
    return (
      <div className='container mx-auto max-w-4xl px-4 py-4'>
        <PageHeader title='Access Settings' showBack={true} />
        <div className='mt-4 rounded-lg border border-dashed bg-muted/30 px-6 py-16 text-center'>
          <p className='text-lg font-semibold'>Access Denied</p>
          <p className='mt-2 text-sm text-muted-foreground'>
            Only Super Admin can manage employee access settings.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className='container mx-auto max-w-4xl px-4 py-4'>
      <PageHeader
        title='Access Settings'
        showBack={true}
        subtitle='Manage employee permission overrides'
      />

      {loading ? (
        <div className='mt-4 rounded-lg border bg-card px-6 py-12 text-center'>
          <div className='mx-auto size-8 animate-spin rounded-full border-2 border-primary border-t-transparent'></div>
          <p className='mt-4 text-sm text-muted-foreground'>
            Loading permissions...
          </p>
        </div>
      ) : (
        <div className='mt-4 space-y-3'>
          {/* Info Card */}
          <Card className='py-0 shadow-sm'>
            <CardContent className='p-4'>
              <h2 className='text-sm font-extrabold text-foreground'>
                Manage Employee Access
              </h2>
              <p className='mt-1.5 text-xs text-muted-foreground leading-relaxed'>
                This screen lets you fine-tune permissions for one employee
                without changing their role.
              </p>
              <p className='mt-1 text-xs text-muted-foreground leading-relaxed'>
                Choose Allow to grant access, Deny to block access, or Clear to
                follow the role defaults.
              </p>
            </CardContent>
          </Card>

          {/* Action Bar */}
          <div className='flex items-center justify-end gap-2'>
            <Button
              size='sm'
              onClick={onSaveBulk}
              disabled={
                saving || removing || Object.keys(pending).length === 0
              }
            >
              {saving
                ? 'Saving...'
                : `Save Changes (${Object.keys(pending).length})`}
            </Button>
            <Button
              size='sm'
              variant='outline'
              onClick={() => {
                void refetchCatalog()
                void refetchOverrides()
              }}
            >
              Refresh
            </Button>
          </div>

          {/* Permission Groups */}
          {groups.map(([groupName, perms]) => {
            const list = perms as PermissionCatalogItem[]
            const allowedCount = list.reduce((sum, p) => {
              const permissionKey = buildPermissionKey(p)
              return sum + (Boolean((permissionsMap as any)[permissionKey]) ? 1 : 0)
            }, 0)
            const blockedCount = list.length - allowedCount
            const pendingCount = list.reduce(
              (sum, p) => sum + (pending[p.s_no] ? 1 : 0),
              0
            )

            return (
              <Card key={groupName} className='py-0 shadow-sm'>
                <CardContent className='p-4'>
                  <div className='flex items-center justify-between'>
                    <h3 className='text-sm font-bold text-foreground'>
                      {groupName}
                    </h3>
                    <div className='flex items-center gap-2'>
                      <span className='rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-extrabold text-green-700'>
                        Allowed: {allowedCount}
                      </span>
                      <span className='rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-extrabold text-red-700'>
                        Blocked: {blockedCount}
                      </span>
                      {pendingCount > 0 && (
                        <span className='rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-extrabold text-amber-700'>
                          Pending: {pendingCount}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className='mt-3 space-y-3'>
                    {list.map((p) => {
                      const current =
                        pending[p.s_no] ??
                        (overrideByPermissionId.get(p.s_no)?.effect as any)
                      const permissionKey = buildPermissionKey(p)
                      const hasAccess = Boolean(
                        (permissionsMap as any)[permissionKey]
                      )

                      const pendingEffect = pending[p.s_no]
                      const savedEffect =
                        overrideByPermissionId.get(p.s_no)?.effect as any
                      const effectiveEffect = pendingEffect ?? savedEffect

                      const accessLabel = hasAccess
                        ? 'Currently Allowed'
                        : 'Currently Blocked'

                      const sourceLabel = effectiveEffect
                        ? `Access setting: ${String(effectiveEffect)}${pendingEffect ? ' (pending)' : ''}`
                        : hasAccess
                          ? 'From role permission'
                          : 'No role permission'

                      const statusLabel = hasAccess ? 'ALLOWED' : 'BLOCKED'
                      const statusBg = hasAccess
                        ? 'bg-green-100'
                        : 'bg-red-100'
                      const statusFg = hasAccess
                        ? 'text-green-700'
                        : 'text-red-700'

                      return (
                        <div
                          key={p.s_no}
                          className='border-t border-border/40 pt-3 first:border-t-0 first:pt-0'
                        >
                          <div className='flex items-center gap-2'>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold ${statusBg} ${statusFg}`}
                            >
                              {statusLabel}
                            </span>
                            <span className='text-[11px] font-bold text-muted-foreground'>
                              {accessLabel}
                            </span>
                          </div>

                          <p className='mt-1 text-[11px] text-muted-foreground'>
                            {sourceLabel}
                          </p>

                          <p className='mt-1.5 text-[13px] font-semibold text-foreground'>
                            {p.screen_name}_{String(p.action).toLowerCase()}
                          </p>
                          {p.description ? (
                            <p className='mt-1 text-xs text-muted-foreground'>
                              {p.description}
                            </p>
                          ) : null}

                          <div className='mt-2.5 flex items-center gap-2'>
                            {EFFECTS.map((e) => {
                              const selected = current === e
                              return (
                                <button
                                  key={e}
                                  disabled={saving || removing}
                                  onClick={() => onSet(p, e)}
                                  className={`rounded-lg px-3 py-2 text-xs font-bold transition-colors disabled:opacity-50 ${
                                    selected
                                      ? 'bg-primary text-primary-foreground'
                                      : 'bg-muted text-foreground hover:bg-muted/80'
                                  }`}
                                >
                                  {e}
                                </button>
                              )
                            })}

                            <button
                              disabled={saving || removing || !current}
                              onClick={() => onClear(p)}
                              className={`ml-auto rounded-lg px-3 py-2 text-xs font-bold transition-colors disabled:opacity-50 ${
                                current
                                  ? 'bg-red-50 text-red-700 hover:bg-red-100'
                                  : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              Clear
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Clear Override Confirmation */}
      <AlertDialog
        open={!!clearTarget}
        onOpenChange={(open) => {
          if (!open) setClearTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Override</AlertDialogTitle>
            <AlertDialogDescription>
              Remove this override?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmClear}
              disabled={removing}
              className='text-destructive-foreground bg-destructive hover:bg-destructive/90'
            >
              {removing ? 'Removing...' : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
