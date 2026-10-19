import type { Event } from '@nsbe/shared';
import { Button } from '@nsbe/ui/components/button';
import { Card } from '@nsbe/ui/components/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@nsbe/ui/components/dialog';

const dateFormat = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'full',
  timeStyle: 'short',
  timeZone: 'America/Denver',
});

export function EventCard({ event, past }: { event: Event; past: boolean }) {
  const date = new Date(event.startsAt);
  return (
    <Card className="event-card overflow-hidden border-0 bg-white p-0 shadow-none ring-1 ring-black/10">
      <div className="flex gap-5 p-6 sm:p-8">
        <div
          className="border-primary w-14 shrink-0 border-t-2 pt-3 text-center"
          aria-hidden="true"
        >
          <span className="text-xs font-bold tracking-widest uppercase">
            {date.toLocaleDateString('en-US', { month: 'short', timeZone: 'America/Denver' })}
          </span>
          <span className="mt-1 block text-4xl font-semibold tracking-tight">
            {date.toLocaleDateString('en-US', { day: '2-digit', timeZone: 'America/Denver' })}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
            {past ? 'From the archive' : 'On the calendar'}
          </p>
          <h3 className="mt-3 text-2xl leading-tight font-semibold break-words">{event.title}</h3>
          <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
            <time dateTime={event.startsAt}>{dateFormat.format(date)}</time> · Mountain Time
          </p>
          <p className="mt-1 text-sm font-medium break-words">{event.location}</p>
          <p className="text-muted-foreground mt-4 line-clamp-3 text-sm leading-6 break-words">
            {event.description}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="h-10 px-4"
                  aria-label={`View details for ${event.title}`}
                >
                  Event details <span aria-hidden="true">↗</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle className="pr-8 text-2xl">{event.title}</DialogTitle>
                  <DialogDescription>{dateFormat.format(date)} · Mountain Time</DialogDescription>
                </DialogHeader>
                <p className="font-medium break-words">{event.location}</p>
                {event.endsAt && (
                  <p className="text-muted-foreground text-sm">
                    Ends {dateFormat.format(new Date(event.endsAt))} · Mountain Time
                  </p>
                )}
                <p className="text-sm leading-7 break-words whitespace-pre-wrap">
                  {event.description}
                </p>
                {!past && event.rsvpLink && (
                  <Button asChild>
                    <a href={event.rsvpLink} target="_blank" rel="noopener noreferrer">
                      RSVP <span className="sr-only">(opens a new tab)</span>
                      <span aria-hidden="true">↗</span>
                    </a>
                  </Button>
                )}
              </DialogContent>
            </Dialog>
            {!past && event.rsvpLink && (
              <Button asChild variant="link">
                <a href={event.rsvpLink} target="_blank" rel="noopener noreferrer">
                  RSVP <span aria-hidden="true">↗</span>
                  <span className="sr-only"> (opens a new tab)</span>
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
