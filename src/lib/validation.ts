import { z } from 'zod';

const text = (min: number, max: number, message: string) =>
  z.string().trim().min(min, message).max(max, `Must be at most ${max} characters`);

export const bookingSchema = z.object({
  serviceId: z.coerce.number().int().positive(),
  start: z.iso.datetime().transform((value) => new Date(value)),
  name: text(2, 100, 'Please enter your name'),
  email: z.string().trim().toLowerCase().pipe(z.email('Please enter a valid email address').max(255)),
  phone: z
    .string()
    .trim()
    .max(30, 'Must be at most 30 characters')
    .regex(/^[+\d\s()-]*$/, 'Use digits, spaces and + ( ) - only')
    .transform((value) => value || null),
});

export const serviceSchema = z.object({
  name: text(2, 80, 'Please enter a name'),
  description: z.string().trim().max(300, 'Must be at most 300 characters'),
  durationMin: z.coerce
    .number()
    .int()
    .min(10, 'At least 10 minutes')
    .max(240, 'At most 4 hours')
    .multipleOf(5, 'Use multiples of 5 minutes'),
  price: z.coerce.number().min(0, 'Price cannot be negative').max(10000, 'Price is too high'),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase(),
  password: z.string(),
});

export type FieldErrors = Record<string, string[] | undefined>;

/** Reads a FormData into a plain object, turning missing fields into empty strings. */
export function formToObject(formData: FormData, fields: string[]): Record<string, string> {
  return Object.fromEntries(fields.map((f) => [f, String(formData.get(f) ?? '')]));
}

export function fieldErrors(error: z.ZodError): FieldErrors {
  return z.flattenError(error).fieldErrors as FieldErrors;
}
