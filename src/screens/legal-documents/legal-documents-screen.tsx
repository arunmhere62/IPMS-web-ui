import { useMemo, useState } from 'react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { TopNav } from '@/components/layout/top-nav'
import { ThemeSwitch } from '@/components/theme-switch'
import { PageHeader } from '@/components/page-header'
import { SlideOver } from '@/components/slide-over'
import { FilterPopup } from '@/components/filter-popup'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
  CreateLegalDocumentBody,
  useCreateLegalDocumentMutation,
  useGetLegalDocumentsQuery,
  useUpdateLegalDocumentMutation,
  useSetLegalDocumentActiveMutation,
} from '@/store/legal-documents.api'

export function LegalDocumentsScreen() {
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'all'>('all')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  const queryArgs = useMemo(
    () => ({
      page: 1,
      limit: 50,
      is_active:
        statusFilter === 'all' ? undefined : statusFilter === 'active' ? true : false,
    }),
    [statusFilter]
  )

  const { data, isLoading, isError } = useGetLegalDocumentsQuery(queryArgs)
  const [createDoc, { isLoading: isCreating }] = useCreateLegalDocumentMutation()
  const [updateDoc, { isLoading: isUpdating }] = useUpdateLegalDocumentMutation()
  const [setActive, { isLoading: isSettingActive }] = useSetLegalDocumentActiveMutation()

  const items = data?.data?.data ?? []

  const [form, setForm] = useState<CreateLegalDocumentBody>({
    type: 'TERMS_AND_CONDITIONS',
    title: 'Terms & Conditions',
    version: 'v1',
    url: '',
    is_active: true,
    is_required: true,
  })

  const [editForm, setEditForm] = useState<CreateLegalDocumentBody>({
    type: 'TERMS_AND_CONDITIONS',
    title: 'Terms & Conditions',
    version: 'v1',
    url: '',
    is_active: true,
    is_required: true,
  })

  const resetForm = () => {
    setForm({
      type: 'TERMS_AND_CONDITIONS',
      title: 'Terms & Conditions',
      version: 'v1',
      url: '',
      is_active: true,
      is_required: true,
    })
  }

  const resetEditForm = () => {
    setEditForm({
      type: 'TERMS_AND_CONDITIONS',
      title: 'Terms & Conditions',
      version: 'v1',
      url: '',
      is_active: true,
      is_required: true,
    })
  }

  const toLocalInputValue = (value?: string | null) => {
    if (!value) return ''
    try {
      return new Date(value).toISOString().slice(0, 16)
    } catch {
      return ''
    }
  }

  const handleCreate = async () => {
    if (!form.type || !form.title || !form.version || !form.url) {
      toast.error('Type, title, version and URL are required')
      return
    }

    await createDoc({
      ...form,
      organization_id:
        form.organization_id === null || form.organization_id === undefined
          ? undefined
          : Number(form.organization_id),
      expiry_date: form.expiry_date === '' ? null : form.expiry_date,
      effective_date: form.effective_date === '' ? undefined : form.effective_date,
    }).unwrap()

    toast.success('Legal document created')
    setIsCreateOpen(false)
    resetForm()
  }

  const openEdit = (doc: any) => {
    setEditingId(Number(doc?.s_no))
    setEditForm({
      type: String(doc?.type ?? ''),
      title: String(doc?.title ?? ''),
      version: String(doc?.version ?? ''),
      url: String(doc?.url ?? ''),
      is_active: Boolean(doc?.is_active),
      is_required: Boolean(doc?.is_required),
      effective_date: doc?.effective_date ? toLocalInputValue(doc.effective_date) : undefined,
      expiry_date: doc?.expiry_date ? toLocalInputValue(doc.expiry_date) : null,
      organization_id: doc?.organization_id ?? undefined,
    })
    setIsEditOpen(true)
  }

  const handleUpdate = async () => {
    if (!editingId) return
    if (!editForm.type || !editForm.title || !editForm.version || !editForm.url) {
      toast.error('Type, title, version and URL are required')
      return
    }

    await updateDoc({
      id: editingId,
      body: {
        ...editForm,
        organization_id:
          editForm.organization_id === null || editForm.organization_id === undefined
            ? undefined
            : Number(editForm.organization_id),
        expiry_date: editForm.expiry_date === '' ? null : editForm.expiry_date,
        effective_date: editForm.effective_date === '' ? undefined : editForm.effective_date,
      },
    }).unwrap()

    toast.success('Legal document updated')
    setIsEditOpen(false)
    setEditingId(null)
    resetEditForm()
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
          title='Legal Documents'
          right={
            <>
              <FilterPopup
                triggerLabel='Filter'
                title='Status'
                value={statusFilter}
                options={[
                  { label: 'All', value: 'all' },
                  { label: 'Active', value: 'active' },
                  { label: 'Inactive', value: 'inactive' },
                ]}
                onValueChange={setStatusFilter}
              />
              <Button size='sm' onClick={() => setIsCreateOpen(true)}>
                Create
              </Button>
            </>
          }
        />

        <SlideOver
          open={isCreateOpen}
          onOpenChange={(open) => {
            setIsCreateOpen(open)
            if (!open) resetForm()
          }}
          title='Create Legal Document'
        >
          <div className='mt-4 grid gap-4'>
            <div className='grid gap-2'>
              <Label htmlFor='type'>Type</Label>
              <Input
                id='type'
                value={form.type}
                onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
                placeholder='TERMS_AND_CONDITIONS'
              />
            </div>

            <div className='grid gap-2'>
              <Label htmlFor='title'>Title</Label>
              <Input
                id='title'
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder='Terms & Conditions'
              />
            </div>

            <div className='grid gap-2'>
              <Label htmlFor='version'>Version</Label>
              <Input
                id='version'
                value={form.version}
                onChange={(e) => setForm((p) => ({ ...p, version: e.target.value }))}
                placeholder='v1'
              />
            </div>

            <div className='grid gap-2'>
              <Label htmlFor='url'>URL</Label>
              <Input
                id='url'
                value={form.url}
                onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))}
                placeholder='https://...'
              />
            </div>

            <div className='grid gap-2'>
              <Label htmlFor='effective_date'>Effective Date (optional)</Label>
              <Input
                id='effective_date'
                type='datetime-local'
                value={form.effective_date ?? ''}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    effective_date: e.target.value || undefined,
                  }))
                }
              />
            </div>

            <div className='grid gap-2'>
              <Label htmlFor='expiry_date'>Expiry Date (optional)</Label>
              <Input
                id='expiry_date'
                type='datetime-local'
                value={form.expiry_date ?? ''}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    expiry_date: e.target.value || null,
                  }))
                }
              />
            </div>

            <div className='grid gap-2'>
              <Label htmlFor='organization_id'>Organization ID (optional)</Label>
              <Input
                id='organization_id'
                type='number'
                value={form.organization_id ?? ''}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    organization_id: e.target.value === '' ? undefined : Number(e.target.value),
                  }))
                }
                placeholder='Leave empty for global'
              />
            </div>

            <div className='flex items-center gap-2'>
              <Checkbox
                checked={!!form.is_required}
                onCheckedChange={(checked) =>
                  setForm((p) => ({ ...p, is_required: Boolean(checked) }))
                }
                id='is_required'
              />
              <Label htmlFor='is_required'>Required</Label>
            </div>

            <div className='flex items-center gap-2'>
              <Checkbox
                checked={!!form.is_active}
                onCheckedChange={(checked) =>
                  setForm((p) => ({ ...p, is_active: Boolean(checked) }))
                }
                id='is_active'
              />
              <Label htmlFor='is_active'>Active</Label>
            </div>

            <div className='mt-2 flex justify-end gap-2'>
              <Button
                variant='outline'
                onClick={() => {
                  setIsCreateOpen(false)
                  resetForm()
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={isCreating}>
                Create
              </Button>
            </div>
          </div>
        </SlideOver>

        <SlideOver
          open={isEditOpen}
          onOpenChange={(open) => {
            setIsEditOpen(open)
            if (!open) {
              setEditingId(null)
              resetEditForm()
            }
          }}
          title='Edit Legal Document'
        >
          <div className='mt-4 grid gap-4'>
            <div className='grid gap-2'>
              <Label htmlFor='edit_type'>Type</Label>
              <Input
                id='edit_type'
                value={editForm.type}
                onChange={(e) => setEditForm((p) => ({ ...p, type: e.target.value }))}
                placeholder='TERMS_AND_CONDITIONS'
              />
            </div>

            <div className='grid gap-2'>
              <Label htmlFor='edit_title'>Title</Label>
              <Input
                id='edit_title'
                value={editForm.title}
                onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))}
                placeholder='Terms & Conditions'
              />
            </div>

            <div className='grid gap-2'>
              <Label htmlFor='edit_version'>Version</Label>
              <Input
                id='edit_version'
                value={editForm.version}
                onChange={(e) => setEditForm((p) => ({ ...p, version: e.target.value }))}
                placeholder='v1'
              />
            </div>

            <div className='grid gap-2'>
              <Label htmlFor='edit_url'>URL</Label>
              <Input
                id='edit_url'
                value={editForm.url}
                onChange={(e) => setEditForm((p) => ({ ...p, url: e.target.value }))}
                placeholder='https://...'
              />
            </div>

            <div className='grid gap-2'>
              <Label htmlFor='edit_effective_date'>Effective Date (optional)</Label>
              <Input
                id='edit_effective_date'
                type='datetime-local'
                value={editForm.effective_date ?? ''}
                onChange={(e) =>
                  setEditForm((p) => ({
                    ...p,
                    effective_date: e.target.value || undefined,
                  }))
                }
              />
            </div>

            <div className='grid gap-2'>
              <Label htmlFor='edit_expiry_date'>Expiry Date (optional)</Label>
              <Input
                id='edit_expiry_date'
                type='datetime-local'
                value={editForm.expiry_date ?? ''}
                onChange={(e) =>
                  setEditForm((p) => ({
                    ...p,
                    expiry_date: e.target.value || null,
                  }))
                }
              />
            </div>

            <div className='grid gap-2'>
              <Label htmlFor='edit_organization_id'>Organization ID (optional)</Label>
              <Input
                id='edit_organization_id'
                type='number'
                value={editForm.organization_id ?? ''}
                onChange={(e) =>
                  setEditForm((p) => ({
                    ...p,
                    organization_id: e.target.value === '' ? undefined : Number(e.target.value),
                  }))
                }
                placeholder='Leave empty for global'
              />
            </div>

            <div className='flex items-center gap-2'>
              <Checkbox
                checked={!!editForm.is_required}
                onCheckedChange={(checked) =>
                  setEditForm((p) => ({ ...p, is_required: Boolean(checked) }))
                }
                id='edit_is_required'
              />
              <Label htmlFor='edit_is_required'>Required</Label>
            </div>

            <div className='flex items-center gap-2'>
              <Checkbox
                checked={!!editForm.is_active}
                onCheckedChange={(checked) =>
                  setEditForm((p) => ({ ...p, is_active: Boolean(checked) }))
                }
                id='edit_is_active'
              />
              <Label htmlFor='edit_is_active'>Active</Label>
            </div>

            <div className='mt-2 flex justify-end gap-2'>
              <Button
                variant='outline'
                onClick={() => {
                  setIsEditOpen(false)
                  setEditingId(null)
                  resetEditForm()
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={isUpdating || !editingId}>
                Save
              </Button>
            </div>
          </div>
        </SlideOver>

        <div className='mt-4'>
          {isLoading ? (
            <div className='text-sm text-muted-foreground'>Loading...</div>
          ) : isError ? (
            <div className='text-sm text-destructive'>Failed to load legal documents</div>
          ) : items.length === 0 ? (
            <div className='text-sm text-muted-foreground'>No legal documents found</div>
          ) : (
            <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
              {items.map((doc) => (
                <Card key={doc.s_no} className='overflow-hidden'>
                  <CardHeader className='space-y-2'>
                    <div className='flex items-start justify-between gap-3'>
                      <CardTitle className='text-lg leading-tight'>{doc.title}</CardTitle>
                      <Badge variant={doc.is_active ? 'default' : 'secondary'}>
                        {doc.is_active ? 'ACTIVE' : 'INACTIVE'}
                      </Badge>
                    </div>
                    <div className='text-sm text-muted-foreground'>
                      {doc.type} • {doc.version}
                    </div>
                    {doc.organization_id ? (
                      <div className='text-xs text-muted-foreground'>Org: {doc.organization_id}</div>
                    ) : (
                      <div className='text-xs text-muted-foreground'>Global</div>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className='text-sm break-all'>
                      <a
                        href={doc.url}
                        target='_blank'
                        rel='noreferrer'
                        className='text-primary underline'
                      >
                        {doc.url}
                      </a>
                    </div>

                    <div className='mt-4 flex justify-end gap-2'>
                      <Button size='sm' variant='outline' onClick={() => openEdit(doc)}>
                        Edit
                      </Button>
                      <Button
                        size='sm'
                        variant='outline'
                        disabled={isSettingActive}
                        onClick={async () => {
                          await setActive({ id: doc.s_no, value: !doc.is_active }).unwrap()
                          toast.success(doc.is_active ? 'Deactivated' : 'Activated')
                        }}
                      >
                        {doc.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
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
    title: 'Legal Documents',
    href: '/legal-documents',
    isActive: true,
    disabled: false,
  },
]
