import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { SubscriptionPlan } from '@/store/subscription-plans.api'
import {
    SubscriptionPlanFormInput,
    SubscriptionPlanFormValues,
    subscriptionPlanFormSchema,
} from './subscription-plan.schema'

export function SubscriptionPlanForm({
    mode,
    initial,
    onSubmit,
    isSubmitting,
    onCancel,
    noCard,
}: {
    mode: 'create' | 'edit'
    initial?: SubscriptionPlan
    onSubmit: (values: SubscriptionPlanFormValues) => Promise<void> | void
    isSubmitting: boolean
    onCancel?: () => void
    noCard?: boolean
}) {
    const navigate = useNavigate()

    const form = useForm<SubscriptionPlanFormInput, any, SubscriptionPlanFormValues>({
        resolver: zodResolver(subscriptionPlanFormSchema),
        defaultValues: {
            name: '',
            description: '',
            duration: 30,
            price: 0,
            currency: 'INR',
            max_pg_locations: undefined,
            max_tenants: undefined,
            max_rooms: undefined,
            max_beds: undefined,
            max_employees: undefined,
            max_users: undefined,
            max_invoices_per_month: undefined,
            max_sms_per_month: undefined,
            max_whatsapp_per_month: undefined,
            is_active: true,
            features_json: '',
        },
    })

    useEffect(() => {
        if (!initial) return

        form.reset({
            name: initial.name ?? '',
            description: initial.description ?? '',
            duration: initial.duration ?? 30,
            price: Number(initial.price ?? 0),
            currency: initial.currency ?? 'INR',
            max_pg_locations: initial.max_pg_locations ?? undefined,
            max_tenants: initial.max_tenants ?? undefined,
            max_rooms: initial.max_rooms ?? undefined,
            max_beds: initial.max_beds ?? undefined,
            max_employees: initial.max_employees ?? undefined,
            max_users: initial.max_users ?? undefined,
            max_invoices_per_month: initial.max_invoices_per_month ?? undefined,
            max_sms_per_month: initial.max_sms_per_month ?? undefined,
            max_whatsapp_per_month: initial.max_whatsapp_per_month ?? undefined,
            is_active: Boolean(initial.is_active),
            features_json:
                initial.features != null ? JSON.stringify(initial.features, null, 2) : '',
        })
    }, [initial, form])

    const content = (
        <>
            {!noCard ? (
                <CardHeader>
                    <CardTitle>
                        {mode === 'create' ? 'Create Subscription Plan' : 'Edit Subscription Plan'}
                    </CardTitle>
                </CardHeader>
            ) : null}
            <CardContent className={noCard ? 'p-0' : undefined}>
                <Form {...form}>
                    <form className='grid gap-6' onSubmit={form.handleSubmit(onSubmit)}>
                        <div className='grid gap-4'>
                            <FormField
                                control={form.control}
                                name='name'
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder='Starter' {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name='currency'
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Currency</FormLabel>
                                        <FormControl>
                                            <Input placeholder='INR' {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name='duration'
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Duration (days)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type='number'
                                                min={1}
                                                value={(field.value as any) ?? ''}
                                                onChange={(e) => field.onChange(e.target.value)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name='price'
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Price</FormLabel>
                                        <FormControl>
                                            <Input
                                                type='number'
                                                min={0}
                                                step='0.01'
                                                value={(field.value as any) ?? ''}
                                                onChange={(e) => field.onChange(e.target.value)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name='max_pg_locations'
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Max PG Locations</FormLabel>
                                        <FormControl>
                                            <Input
                                                type='number'
                                                min={0}
                                                value={(field.value as any) ?? ''}
                                                onChange={(e) => field.onChange(e.target.value)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />



                            <FormField
                                control={form.control}
                                name='max_rooms'
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Max Rooms</FormLabel>
                                        <FormControl>
                                            <Input
                                                type='number'
                                                min={0}
                                                value={(field.value as any) ?? ''}
                                                onChange={(e) => field.onChange(e.target.value)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name='max_beds'
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Max Beds</FormLabel>
                                        <FormControl>
                                            <Input
                                                type='number'
                                                min={0}
                                                value={(field.value as any) ?? ''}
                                                onChange={(e) => {
                                                    const v = e.target.value
                                                    field.onChange(v)
                                                    form.setValue('max_tenants', v, {
                                                        shouldDirty: true,
                                                        shouldValidate: true,
                                                    })
                                                }}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name='max_tenants'
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Max Tenants</FormLabel>
                                        <FormControl>
                                            <Input
                                                type='number'
                                                min={0}
                                                readOnly
                                                value={((form.watch('max_beds') as any) ?? (field.value as any)) ?? ''}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name='max_employees'
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Max Employees</FormLabel>
                                        <FormControl>
                                            <Input
                                                type='number'
                                                min={0}
                                                value={(field.value as any) ?? ''}
                                                onChange={(e) => field.onChange(e.target.value)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name='max_users'
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Max Users</FormLabel>
                                        <FormControl>
                                            <Input
                                                type='number'
                                                min={0}
                                                value={(field.value as any) ?? ''}
                                                onChange={(e) => field.onChange(e.target.value)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name='max_invoices_per_month'
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Max Invoices / Month</FormLabel>
                                        <FormControl>
                                            <Input
                                                type='number'
                                                min={0}
                                                value={(field.value as any) ?? ''}
                                                onChange={(e) => field.onChange(e.target.value)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name='max_sms_per_month'
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Max SMS / Month</FormLabel>
                                        <FormControl>
                                            <Input
                                                type='number'
                                                min={0}
                                                value={(field.value as any) ?? ''}
                                                onChange={(e) => field.onChange(e.target.value)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name='max_whatsapp_per_month'
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Max WhatsApp / Month</FormLabel>
                                        <FormControl>
                                            <Input
                                                type='number'
                                                min={0}
                                                value={(field.value as any) ?? ''}
                                                onChange={(e) => field.onChange(e.target.value)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name='description'
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder='Short description...' {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name='features_json'
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Features (JSON)</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            rows={6}
                                            placeholder='{"feature": true}'
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name='is_active'
                            render={({ field }) => (
                                <FormItem className='flex items-center justify-between rounded-md border p-3'>
                                    <div>
                                        <FormLabel>Active</FormLabel>
                                        <div className='text-sm text-muted-foreground'>
                                            If disabled, plan won\'t be offered
                                        </div>
                                    </div>
                                    <FormControl>
                                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <div className='flex items-center justify-end gap-2'>
                            <Button
                                type='button'
                                variant='outline'
                                onClick={() => (onCancel ? onCancel() : navigate('/subscription-plans'))}
                            >
                                Cancel
                            </Button>
                            <Button type='submit' disabled={isSubmitting}>
                                {isSubmitting
                                    ? mode === 'create'
                                        ? 'Creating...'
                                        : 'Saving...'
                                    : mode === 'create'
                                        ? 'Create'
                                        : 'Save'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </>
    )

    if (noCard) return content

    return <Card>{content}</Card>
}
