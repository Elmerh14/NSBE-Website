import type { CreateEvent, Event, EventsQuery, EventsResponse, UpdateEvent } from '@nsbe/shared';

import { type Event as EventRow, Prisma, type PrismaClient } from '../../generated/prisma/client';
import { AppError } from '../../lib/errors';

function serializeEvent(event: EventRow): Event {
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    startsAt: event.startsAt.toISOString(),
    endsAt: event.endsAt?.toISOString() ?? null,
    location: event.location,
    rsvpLink: event.rsvpLink,
  };
}

function isMissingRecord(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025';
}

export async function getEvent(prisma: PrismaClient, id: number): Promise<Event> {
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) throw new AppError(404, 'NOT_FOUND', 'Event not found');
  return serializeEvent(event);
}

export async function createEvent(prisma: PrismaClient, input: CreateEvent): Promise<Event> {
  const event = await prisma.event.create({
    data: {
      ...input,
      startsAt: new Date(input.startsAt),
      endsAt: input.endsAt ? new Date(input.endsAt) : null,
      rsvpLink: input.rsvpLink ?? null,
    },
  });
  return serializeEvent(event);
}

export async function updateEvent(
  prisma: PrismaClient,
  id: number,
  input: UpdateEvent,
): Promise<Event> {
  const existing = await prisma.event.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, 'NOT_FOUND', 'Event not found');
  const startsAt = input.startsAt === undefined ? existing.startsAt : new Date(input.startsAt);
  const endsAt =
    input.endsAt === undefined
      ? existing.endsAt
      : input.endsAt === null
        ? null
        : new Date(input.endsAt);
  if (endsAt !== null && endsAt < startsAt) {
    throw new AppError(400, 'VALIDATION_ERROR', 'End time must be at or after start time.');
  }

  try {
    return serializeEvent(
      await prisma.event.update({
        // Prevent concurrent date edits from invalidating the date-order check above.
        where: { id, startsAt: existing.startsAt, endsAt: existing.endsAt },
        data: {
          ...input,
          startsAt: input.startsAt === undefined ? undefined : startsAt,
          endsAt: input.endsAt === undefined ? undefined : endsAt,
        },
      }),
    );
  } catch (error) {
    if (isMissingRecord(error)) {
      throw new AppError(409, 'CONFLICT', 'Event changed or was deleted; reload and try again');
    }
    throw error;
  }
}

export async function deleteEvent(prisma: PrismaClient, id: number): Promise<void> {
  try {
    await prisma.event.delete({ where: { id } });
  } catch (error) {
    if (isMissingRecord(error)) throw new AppError(404, 'NOT_FOUND', 'Event not found');
    throw error;
  }
}

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

  return events.map(serializeEvent);
}
