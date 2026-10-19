import { z } from 'zod';

// API dates are ISO strings with a timezone, not JavaScript Date objects.
const EventFieldsSchema = z.strictObject({
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  startsAt: z.iso.datetime({ offset: true }),
  endsAt: z.iso.datetime({ offset: true }).nullable(),
  location: z.string().trim().min(1),
  rsvpLink: z.url({ protocol: /^https?$/ }).nullable(),
});

function hasValidDateOrder(event: { startsAt?: string; endsAt?: string | null }) {
  return (
    event.startsAt === undefined ||
    event.endsAt == null ||
    Date.parse(event.endsAt) >= Date.parse(event.startsAt)
  );
}

const dateOrderError = {
  message: 'End time must be at or after start time.',
  path: ['endsAt'],
};

export const EventSchema = EventFieldsSchema.extend({
  id: z.int().positive(),
}).refine(hasValidDateOrder, dateOrderError);
export type Event = z.infer<typeof EventSchema>;

export const CreateEventSchema = EventFieldsSchema.extend({
  endsAt: EventFieldsSchema.shape.endsAt.optional(),
  rsvpLink: EventFieldsSchema.shape.rsvpLink.optional(),
}).refine(hasValidDateOrder, dateOrderError);
export type CreateEvent = z.infer<typeof CreateEventSchema>;

// The service must also check date order against existing values on partial updates.
export const UpdateEventSchema = EventFieldsSchema.partial()
  .refine((event) => Object.keys(event).length > 0, {
    message: 'Provide at least one field to update.',
  })
  .refine(hasValidDateOrder, dateOrderError);
export type UpdateEvent = z.infer<typeof UpdateEventSchema>;

// Route parameters arrive as strings. Accept only positive decimal integer IDs.
export const EventParamsSchema = z.strictObject({
  id: z
    .string()
    .regex(/^[1-9]\d*$/)
    .transform(Number)
    .pipe(z.int().positive()),
});
export type EventParams = z.infer<typeof EventParamsSchema>;

export const EventsQuerySchema = z.strictObject({
  period: z.enum(['upcoming', 'past']).optional(),
});
export type EventsQuery = z.infer<typeof EventsQuerySchema>;

export const EventsResponseSchema = z.array(EventSchema);
export type EventsResponse = z.infer<typeof EventsResponseSchema>;
