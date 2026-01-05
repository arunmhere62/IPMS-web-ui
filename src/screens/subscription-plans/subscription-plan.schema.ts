import { z } from 'zod'

export const subscriptionPlanFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  duration: z.coerce.number().int().min(1, 'Duration must be at least 1 day'),
  price: z.coerce.number().min(0, 'Price must be 0 or more'),
  currency: z.string().min(1).default('INR').optional(),
  max_pg_locations: z
    .union([z.coerce.number().int().min(0), z.literal(''), z.undefined()])
    .optional(),
  max_tenants: z
    .union([z.coerce.number().int().min(0), z.literal(''), z.undefined()])
    .optional(),
  max_rooms: z
    .union([z.coerce.number().int().min(0), z.literal(''), z.undefined()])
    .optional(),
  max_beds: z
    .union([z.coerce.number().int().min(0), z.literal(''), z.undefined()])
    .optional(),
  max_employees: z
    .union([z.coerce.number().int().min(0), z.literal(''), z.undefined()])
    .optional(),
  max_users: z
    .union([z.coerce.number().int().min(0), z.literal(''), z.undefined()])
    .optional(),
  max_invoices_per_month: z
    .union([z.coerce.number().int().min(0), z.literal(''), z.undefined()])
    .optional(),
  max_sms_per_month: z
    .union([z.coerce.number().int().min(0), z.literal(''), z.undefined()])
    .optional(),
  max_whatsapp_per_month: z
    .union([z.coerce.number().int().min(0), z.literal(''), z.undefined()])
    .optional(),
  is_active: z.boolean().default(true),
  features_json: z.string().optional(),
})

export type SubscriptionPlanFormInput = z.input<typeof subscriptionPlanFormSchema>

export type SubscriptionPlanFormValues = z.output<typeof subscriptionPlanFormSchema>
