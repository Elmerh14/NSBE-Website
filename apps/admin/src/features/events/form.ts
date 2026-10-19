import { CreateEventSchema, type Event } from '@nsbe/shared';
import { z } from 'zod';

export function toLocalInput(iso: string) {
  const date = new Date(iso);
  const pad = (value: number, length = 2) => String(value).padStart(length, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(date.getMilliseconds(), 3)}`;
}

const localDate = (original?: string) =>
  z
    .string()
    .min(1, 'Choose a date and time')
    .transform((value, ctx) => {
      // Preserve the original instant in the repeated fall DST hour when unchanged.
      if (original && value === toLocalInput(original)) return original;
      const date = new Date(value);
      // Roundtrip catches impossible dates and local times skipped by daylight saving.
      if (
        !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?$/.test(value) ||
        Number.isNaN(date.getTime()) ||
        !toLocalInput(date.toISOString()).startsWith(value)
      ) {
        ctx.addIssue({
          code: 'custom',
          message: 'Choose a valid date and time in your local time zone',
        });
        return z.NEVER;
      }
      return date.toISOString();
    });

export const createEventFormSchema = (event?: Event) =>
  z
    .object({
      title: CreateEventSchema.shape.title,
      description: CreateEventSchema.shape.description,
      location: CreateEventSchema.shape.location,
      startsAt: localDate(event?.startsAt),
      endsAt: z.union([z.literal('').transform(() => null), localDate(event?.endsAt ?? undefined)]),
      rsvpLink: z
        .string()
        .trim()
        .transform((value) => value || null),
    })
    .pipe(
      CreateEventSchema.safeExtend({
        endsAt: CreateEventSchema.shape.endsAt.nonoptional(),
        rsvpLink: CreateEventSchema.shape.rsvpLink.nonoptional(),
      }),
    );

export const EventFormSchema = createEventFormSchema();

export function eventDefaults(event?: Event): z.input<typeof EventFormSchema> {
  return {
    title: event?.title ?? '',
    description: event?.description ?? '',
    location: event?.location ?? '',
    startsAt: event ? toLocalInput(event.startsAt) : '',
    endsAt: event?.endsAt ? toLocalInput(event.endsAt) : '',
    rsvpLink: event?.rsvpLink ?? '',
  };
}
