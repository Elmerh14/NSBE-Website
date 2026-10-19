import type { EventsQuery, EventsResponse } from '@nsbe/shared';

import type { PrismaClient } from '../../generated/prisma/client';

export async function listEvents(
  prisma: PrismaClient,
  query: EventsQuery,
): Promise<EventsResponse> {
  const now = new Date();
  const events = await prisma.event.findMany({
    where:
      query.period === 'upcoming'
        ? { startsAt: { gte: now } }
        : query.period === 'past'
          ? { startsAt: { lt: now } }
          : {},
    orderBy: { startsAt: query.period === 'past' ? 'desc' : 'asc' },
  });

  return events.map((event) => ({
    id: event.id,
    title: event.title,
    description: event.description,
    startsAt: event.startsAt.toISOString(),
    endsAt: event.endsAt?.toISOString() ?? null,
    location: event.location,
    rsvpLink: event.rsvpLink,
  }));
}
