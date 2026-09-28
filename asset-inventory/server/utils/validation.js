import { z } from 'zod';
import { stages, conditions, criticalities, categories, maintenanceTypes, maintenanceStatuses } from './constants.js';
const text = z.string().trim().max(4000).nullable().optional();
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0,10) === v, 'Invalid date').or(z.literal('')).nullable().optional();
export const assetSchema = z.object({
 asset_code: z.string().trim().min(1).max(50).optional(), name: z.string().trim().min(1).max(200), category: z.enum(categories),
 description: text, manufacturer: text, model: text, serial_number: text, supplier: text, location: text, department: text, custodian: text, notes: text,
 purchase_date: date, warranty_expiry: date, installation_date: date, commissioning_date: date, retirement_date: date,
 purchase_cost: z.coerce.number().finite().min(0).max(1e12).optional(), expected_life_years: z.preprocess(v => v === '' ? null : v, z.coerce.number().int().min(1).max(100).nullable().optional()),
 lifecycle_stage: z.enum(stages).optional(), condition: z.enum(conditions).optional(), criticality: z.enum(criticalities).optional()
});
export const maintenanceSchema = z.object({
 maintenance_type: z.enum(maintenanceTypes), title: z.string().trim().min(1).max(200), description: text,
 scheduled_date: date, completed_date: date, technician: text, vendor: text, cost: z.coerce.number().finite().min(0).max(1e12).optional(),
 status: z.enum(maintenanceStatuses).optional(), findings: text, action_taken: text
});
export function parse(schema, body) {
 const result = schema.safeParse(body);
 if (!result.success) { const e = new Error(result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ')); e.status = 400; throw e; }
 return result.data;
}
export function fail(message, status = 400) { const e = new Error(message); e.status = status; throw e; }
