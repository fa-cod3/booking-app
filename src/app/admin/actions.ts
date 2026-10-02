'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getDb } from '@/db';
import { checkCredentials } from '@/lib/auth';
import { cancelById, createService, setServiceActive, updateService } from '@/lib/bookings';
import { endSession, requireAdmin, startSession } from '@/lib/session';
import { fieldErrors, formToObject, loginSchema, serviceSchema, type FieldErrors } from '@/lib/validation';

// `values` refills the inputs, because React resets a form after its action runs.
export type FormState = { error?: string; fieldErrors?: FieldErrors; ok?: boolean; values?: Record<string, string> };

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { email, password } = loginSchema.parse(formToObject(formData, ['email', 'password']));
  if (!checkCredentials(email, password)) return { error: 'Wrong email or password.', values: { email } };
  await startSession(email);
  redirect('/admin');
}

export async function logoutAction() {
  await endSession();
  redirect('/admin/login');
}

export async function cancelBookingByIdAction(formData: FormData) {
  await requireAdmin();
  await cancelById(getDb(), Number(formData.get('id')));
  revalidatePath('/admin');
}

const serviceFields = ['name', 'description', 'durationMin', 'price'];

export async function saveServiceAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const values = formToObject(formData, serviceFields);
  const parsed = serviceSchema.safeParse(values);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values };

  const id = Number(formData.get('id'));
  if (id) await updateService(getDb(), id, parsed.data);
  else await createService(getDb(), parsed.data);

  revalidatePath('/admin/services');
  return { ok: true };
}

export async function toggleServiceAction(formData: FormData) {
  await requireAdmin();
  await setServiceActive(getDb(), Number(formData.get('id')), formData.get('active') === 'true');
  revalidatePath('/admin/services');
}
