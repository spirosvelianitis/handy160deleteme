// Blueprint-synchronized validation constants and helpers
export const LIMITS = {
  ID_MAX: 128,
  NAME_MIN: 2,
  NAME_MAX: 80,
  EMAIL_MIN: 5,
  EMAIL_MAX: 120,
  PHONE_MIN: 7,
  PHONE_MAX: 25,
  ADDRESS_MIN: 5,
  ADDRESS_MAX: 200,
  NEIGHBORHOOD_MIN: 2,
  NEIGHBORHOOD_MAX: 100,
  DESCRIPTION_MIN: 5,
  DESCRIPTION_MAX: 1000,
  PROJECT_NOTES_MIN: 5,
  PROJECT_NOTES_MAX: 1200,
  ADMIN_NOTES_MAX: 600,
  BIO_SUMMARY_MIN: 10,
  BIO_SUMMARY_MAX: 1200,
} as const;

export const PATTERNS = {
  ID: /^[a-zA-Z0-9_-]+$/,
  DATE: /^20[2-9][0-9]-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/,
  EMAIL: /^[^@ ]+@[^@ ]+\.[^@ ]+$/,
  SLOT_ID: /^[0-9]{4}-[0-9]{2}-[0-9]{2}_(morning|midday|afternoon)$/,
} as const;

export const SERVICE_CATEGORIES = [
  'Carpentry & Trim',
  'Kitchen & Bath',
  'Drywall & Paint',
  'Doors & Hardware',
  'Decks & Exterior',
  'Electrical & Fixtures',
  'General Maintenance',
] as const;

export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];

export const GALLERY_CATEGORIES = [
  'Carpentry',
  'Kitchen & Bath',
  'Exterior',
  'Electrical & Lighting',
] as const;

export type GalleryCategory = (typeof GALLERY_CATEGORIES)[number];

export const SLOT_KEYS = ['morning', 'midday', 'afternoon'] as const;
export type SlotKey = (typeof SLOT_KEYS)[number];

export const SLOT_LABELS: Record<SlotKey, { label: string; window: string }> = {
  morning: { label: 'Morning', window: '8:00 AM – 11:00 AM' },
  midday: { label: 'Midday', window: '11:30 AM – 2:00 PM' },
  afternoon: { label: 'Afternoon', window: '2:30 PM – 5:30 PM' },
};

export function generateDocId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}_${rand}`.replace(/[^a-zA-Z0-9_-]/g, '');
}

export function validateAppointmentInput(input: {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  serviceAddress: string;
  date: string;
  slotKey: string;
  description: string;
}): string | null {
  const name = input.clientName.trim();
  const email = input.clientEmail.trim();
  const phone = input.clientPhone.trim();
  const address = input.serviceAddress.trim();
  const desc = input.description.trim();

  if (name.length < LIMITS.NAME_MIN || name.length > LIMITS.NAME_MAX) {
    return `Please enter your name (${LIMITS.NAME_MIN}–${LIMITS.NAME_MAX} characters).`;
  }
  if (!PATTERNS.EMAIL.test(email) || email.length > LIMITS.EMAIL_MAX) {
    return 'Please enter a valid email address.';
  }
  if (phone.length < LIMITS.PHONE_MIN || phone.length > LIMITS.PHONE_MAX) {
    return 'Please enter a valid phone number.';
  }
  if (address.length < LIMITS.ADDRESS_MIN || address.length > LIMITS.ADDRESS_MAX) {
    return 'Please enter the service street address.';
  }
  if (!PATTERNS.DATE.test(input.date)) {
    return 'Please select a valid appointment date.';
  }
  if (!SLOT_KEYS.includes(input.slotKey as SlotKey)) {
    return 'Please select a valid time window.';
  }
  if (desc.length < LIMITS.DESCRIPTION_MIN || desc.length > LIMITS.DESCRIPTION_MAX) {
    return `Please describe the repair or project (${LIMITS.DESCRIPTION_MIN}–${LIMITS.DESCRIPTION_MAX} characters).`;
  }
  return null;
}

export function validateEstimateInput(input: {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  neighborhood: string;
  projectNotes: string;
}): string | null {
  const name = input.clientName.trim();
  const email = input.clientEmail.trim();
  const phone = input.clientPhone.trim();
  const hood = input.neighborhood.trim();
  const notes = input.projectNotes.trim();

  if (name.length < LIMITS.NAME_MIN || name.length > LIMITS.NAME_MAX) {
    return `Please enter your name (${LIMITS.NAME_MIN}–${LIMITS.NAME_MAX} characters).`;
  }
  if (!PATTERNS.EMAIL.test(email) || email.length > LIMITS.EMAIL_MAX) {
    return 'Please enter a valid email address.';
  }
  if (phone.length < LIMITS.PHONE_MIN || phone.length > LIMITS.PHONE_MAX) {
    return 'Please enter a valid phone number.';
  }
  if (hood.length < LIMITS.NEIGHBORHOOD_MIN || hood.length > LIMITS.NEIGHBORHOOD_MAX) {
    return 'Please enter your neighborhood or zip code.';
  }
  if (notes.length < LIMITS.PROJECT_NOTES_MIN || notes.length > LIMITS.PROJECT_NOTES_MAX) {
    return 'Please provide a brief project description for the written estimate.';
  }
  return null;
}
