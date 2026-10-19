import { Button } from '@nsbe/ui/components/button';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router';

import { fetchEvents } from './api';
import { EventCard } from './EventCard';

export function EventsPage() {
  const [params, setParams] = useSearchParams();
  const period = params.get('period') === 'past' ? 'past' : 'upcoming';
  const events = useQuery({
    queryKey: ['events', period],
    queryFn: ({ signal }) => fetchEvents(period, signal),
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

  return (
    <div className="min-h-screen">
      <a href="#events" className="sr-only fixed z-50 bg-white p-4 focus:not-sr-only">
        Skip to events
      </a>
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-6 sm:px-10">
        <Link to="/events" className="flex items-center gap-3" aria-label="CU Denver NSBE events">
          <span className="brand-mark">
            N<span className="text-primary">.</span>
          </span>
          <span className="text-sm leading-tight font-semibold">
            NSBE
            <span className="text-muted-foreground block text-xs font-normal">
              University of Colorado Denver
            </span>
          </span>
        </Link>
        <span className="border-primary border-b-2 pb-1 text-sm font-semibold">Events</span>
      </header>
      <main>
        <section className="bg-secondary text-secondary-foreground relative overflow-hidden">
          <div className="hero-orbit" aria-hidden="true" />
          <div className="relative mx-auto grid max-w-6xl gap-8 px-6 py-16 sm:px-10 sm:py-24 lg:grid-cols-[1.5fr_1fr] lg:items-end">
            <div>
              <p className="text-primary text-xs font-semibold tracking-[0.22em] uppercase">
                CU Denver · National Society of Black Engineers
              </p>
              <h1 className="mt-6 max-w-2xl text-5xl leading-[1.03] font-semibold tracking-tight sm:text-7xl">
                Make connections.
                <br />
                <span className="text-primary">Build what’s next.</span>
              </h1>
            </div>
            <div className="max-w-sm lg:pb-1">
              <p className="text-lg leading-8 text-white/80">
                A place to learn, connect, and grow. Find your next chapter meeting, workshop, or
                community experience.
              </p>
              <a
                href="#events"
                className="mt-7 inline-flex items-center gap-4 text-sm font-semibold"
              >
                Find your next event <span aria-hidden="true">↓</span>
              </a>
            </div>
          </div>
        </section>
        <section id="events" className="mx-auto max-w-6xl scroll-mt-6 px-6 py-12 sm:px-10 sm:py-16">
          <div className="flex flex-wrap items-end justify-between gap-6 border-b pb-7">
            <div>
              <p className="text-muted-foreground text-xs font-semibold tracking-[0.18em] uppercase">
                The chapter calendar
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                {period === 'past' ? 'A look back.' : 'See you there.'}
              </h2>
            </div>
            <div
              className="flex gap-1 rounded-xl bg-white p-1 ring-1 ring-black/10"
              role="group"
              aria-label="Event period"
            >
              {(['upcoming', 'past'] as const).map((value) => (
                <Button
                  key={value}
                  aria-pressed={period === value}
                  variant={period === value ? 'default' : 'ghost'}
                  className="h-10 px-5"
                  onClick={() => {
                    setParams({ period: value });
                  }}
                >
                  {value === 'upcoming' ? 'Upcoming' : 'Past events'}
                </Button>
              ))}
            </div>
          </div>
          <div className="mt-8" aria-live="polite" aria-busy={events.isFetching}>
            {events.isPending ? (
              <p role="status" className="text-muted-foreground py-16 text-center">
                Loading the chapter calendar…
              </p>
            ) : events.isError ? (
              <div role="alert" className="rounded-xl border bg-white p-8">
                <h3 className="text-lg font-semibold">The calendar is temporarily unavailable.</h3>
                <p className="text-muted-foreground mt-2">Please try again in a moment.</p>
                <Button
                  className="mt-5"
                  onClick={() => {
                    void events.refetch();
                  }}
                >
                  Try again
                </Button>
              </div>
            ) : events.data.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-12 text-center">
                <h3 className="text-xl font-semibold">
                  {period === 'past'
                    ? 'The archive is just getting started.'
                    : 'More good things are on the way.'}
                </h3>
                <p className="text-muted-foreground mx-auto mt-3 max-w-md text-sm leading-6">
                  {period === 'past'
                    ? 'Past chapter events will appear here.'
                    : 'There are no upcoming events posted yet. Check back soon for the next chance to connect.'}
                </p>
              </div>
            ) : (
              <div className="grid gap-5 lg:grid-cols-2">
                {events.data.map((event) => (
                  <EventCard key={event.id} event={event} past={period === 'past'} />
                ))}
              </div>
            )}
          </div>
          <p className="text-muted-foreground mt-6 text-xs">
            All event times are shown in Mountain Time.
          </p>
        </section>
      </main>
      <footer className="text-muted-foreground mx-auto flex max-w-6xl flex-wrap justify-between gap-3 border-t px-6 py-7 text-xs sm:px-10">
        <span>CU Denver NSBE</span>
        <span>Community. Opportunity. Impact.</span>
      </footer>
    </div>
  );
}
