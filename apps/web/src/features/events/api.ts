import { type EventsQuery, EventsResponseSchema } from '@nsbe/shared';

export async function fetchEvents(period: EventsQuery['period'], signal?: AbortSignal) {
  const configured: unknown = import.meta.env.VITE_API_URL;
  const base = typeof configured === 'string' ? configured.replace(/\/$/, '') : '';
  const response = await fetch(`${base}/api/events${period ? `?period=${period}` : ''}`, {
    signal,
  });
  if (!response.ok) throw new Error('We could not load events. Please try again.');
  return EventsResponseSchema.parse(await response.json());
}
