import type { Event } from '@nsbe/shared';
import { Button } from '@nsbe/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@nsbe/ui/components/dialog';
import { Input } from '@nsbe/ui/components/input';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@nsbe/ui/components/table';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { ApiError, loadEvents, removeEvent, saveEvent } from './api';
import { EventForm } from './EventForm';
import { SignInPanel } from './SignInPanel';

const dateFormat = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'America/Denver',
});

export function AdminEventsPage() {
  const client = useQueryClient();
  const events = useQuery({
    queryKey: ['admin-events'],
    queryFn: ({ signal }) => loadEvents(signal),
    retry: (count, error) =>
      !(error instanceof ApiError && (error.status === 401 || error.status === 403)) && count < 2,
    staleTime: 30_000,
  });
  const [search, setSearch] = useState('');
  const [editor, setEditor] = useState<Event | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Event | null>(null);
  const [notice, setNotice] = useState('');
  const refresh = () => {
    void client.invalidateQueries({ queryKey: ['admin-events'] });
  };
  const save = useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: number | undefined;
      input: Parameters<typeof saveEvent>[1];
    }) => saveEvent(id, input),
    onSuccess: () => {
      setEditor(null);
      setNotice('Event saved.');
      refresh();
    },
    onError: (error) => {
      if (error instanceof ApiError && [401, 403, 404, 409].includes(error.status)) refresh();
    },
  });
  const remove = useMutation({
    mutationFn: removeEvent,
    onSuccess: () => {
      setDeleting(null);
      setNotice('Event deleted.');
      refresh();
    },
    onError: (error) => {
      if (error instanceof ApiError && [401, 403, 404].includes(error.status)) refresh();
    },
  });
  const unauthorized = events.error instanceof ApiError && events.error.status === 401;
  const forbidden = events.error instanceof ApiError && events.error.status === 403;
  const rows =
    events.data?.filter((event) =>
      `${event.title} ${event.location}`.toLowerCase().includes(search.toLowerCase()),
    ) ?? [];
  const openEditor = (event: Event | 'new') => {
    save.reset();
    setNotice('');
    setEditor(event);
  };

  return (
    <div className="min-h-screen">
      <header className="bg-secondary text-secondary-foreground border-b">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5 sm:px-10">
          <a href="/events" className="text-lg font-bold tracking-tight">
            NSBE<span className="text-primary">.</span>{' '}
            <span className="ml-3 text-sm font-normal text-white/65">CU Denver</span>
          </a>
          <span className="text-xs font-semibold tracking-[0.18em] text-white/70 uppercase">
            Chapter workspace
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-12 sm:px-10 sm:py-16">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-muted-foreground text-xs font-semibold tracking-[0.18em] uppercase">
              Content management
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">Events</h1>
            <p className="text-muted-foreground mt-3 max-w-lg text-sm leading-6">
              Bring the chapter together. Manage what’s coming up and keep your community in the
              loop.
            </p>
          </div>
          {events.isSuccess && (
            <Button
              className="h-11 px-5"
              onClick={() => {
                openEditor('new');
              }}
            >
              <span aria-hidden="true">＋</span> Create event
            </Button>
          )}
        </div>
        {unauthorized ? (
          <SignInPanel
            onSuccess={() => {
              void client.resetQueries({ queryKey: ['admin-events'] });
            }}
          />
        ) : forbidden ? (
          <section role="alert" className="rounded-xl border bg-white p-8">
            <h2 className="text-xl font-semibold">Your account needs attention.</h2>
            <p className="text-muted-foreground mt-3 text-sm">
              {events.error?.message} Contact your chapter administrator if you need help updating
              your account.
            </p>
            <Button
              className="mt-5"
              onClick={() => {
                void events.refetch();
              }}
            >
              Check access again
            </Button>
          </section>
        ) : events.isPending ? (
          <p role="status" className="text-muted-foreground py-16 text-center">
            Loading events…
          </p>
        ) : events.isError ? (
          <section role="alert" className="rounded-xl border bg-white p-8">
            <h2 className="font-semibold">Events could not be loaded.</h2>
            <p className="text-muted-foreground mt-2 text-sm">
              Please check your connection and try again.
            </p>
            <Button
              className="mt-5"
              onClick={() => {
                void events.refetch();
              }}
            >
              Try again
            </Button>
          </section>
        ) : (
          <>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
              <p className="text-muted-foreground text-sm">
                {events.data.length} {events.data.length === 1 ? 'event' : 'events'} · Times shown
                in Mountain Time
              </p>
              <div className="w-full sm:w-72">
                <label htmlFor="event-search" className="sr-only">
                  Search events by title or location
                </label>
                <Input
                  id="event-search"
                  type="search"
                  placeholder="Search events or locations…"
                  className="h-10 bg-white"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                  }}
                />
              </div>
            </div>
            <p role="status" className="mb-4 text-sm font-medium">
              {notice}
            </p>
            {rows.length === 0 ? (
              <div className="rounded-xl border border-dashed p-12 text-center">
                <h2 className="text-xl font-semibold">
                  {search ? 'No matching events.' : 'Your next event starts here.'}
                </h2>
                <p className="text-muted-foreground mt-3 text-sm">
                  {search
                    ? 'Try a different title or location.'
                    : 'Create an event to add it to the public chapter calendar.'}
                </p>
                {search ? (
                  <Button
                    variant="outline"
                    className="mt-5"
                    onClick={() => {
                      setSearch('');
                    }}
                  >
                    Clear search
                  </Button>
                ) : (
                  <Button
                    className="mt-5"
                    onClick={() => {
                      openEditor('new');
                    }}
                  >
                    Create your first event
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border bg-white">
                <Table className="w-full min-w-[640px] text-left text-sm">
                  <TableCaption className="sr-only">
                    Chapter events, with edit and delete actions
                  </TableCaption>
                  <TableHeader className="bg-muted/50 text-muted-foreground border-b text-xs uppercase">
                    <TableRow>
                      <TableHead className="px-6 py-4">Event</TableHead>
                      <TableHead className="px-6 py-4">Starts · Mountain Time</TableHead>
                      <TableHead className="px-6 py-4">Location</TableHead>
                      <TableHead className="px-6 py-4 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((event) => (
                      <TableRow key={event.id} className="border-b last:border-0">
                        <TableHead
                          scope="row"
                          className="max-w-72 px-6 py-5 font-semibold break-words"
                        >
                          {event.title}
                        </TableHead>
                        <TableCell className="px-6 py-5 whitespace-nowrap">
                          <time dateTime={event.startsAt}>
                            {dateFormat.format(new Date(event.startsAt))}
                          </time>
                        </TableCell>
                        <TableCell className="text-muted-foreground max-w-48 px-6 py-5 break-words">
                          {event.location}
                        </TableCell>
                        <TableCell className="px-6 py-5">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              onClick={() => {
                                openEditor(event);
                              }}
                              aria-label={`Edit ${event.title}`}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => {
                                remove.reset();
                                setDeleting(event);
                              }}
                              aria-label={`Delete ${event.title}`}
                            >
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </>
        )}
        <Dialog
          open={editor !== null}
          onOpenChange={(open) => {
            if (!open && !save.isPending) setEditor(null);
          }}
        >
          <DialogContent
            showCloseButton={!save.isPending}
            className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl"
          >
            <DialogHeader>
              <DialogTitle className="text-2xl">
                {editor === 'new' ? 'Create an event' : 'Edit event'}
              </DialogTitle>
              <DialogDescription>
                Saved events appear on the public chapter calendar.
              </DialogDescription>
            </DialogHeader>
            {editor !== null && (
              <EventForm
                key={editor === 'new' ? 'new' : editor.id}
                event={editor === 'new' ? undefined : editor}
                pending={save.isPending}
                error={save.error?.message}
                onCancel={() => {
                  setEditor(null);
                }}
                onSave={(input) => {
                  save.mutate({ id: editor === 'new' ? undefined : editor.id, input });
                }}
              />
            )}
          </DialogContent>
        </Dialog>
        <Dialog
          open={deleting !== null}
          onOpenChange={(open) => {
            if (!open && !remove.isPending) setDeleting(null);
          }}
        >
          <DialogContent showCloseButton={!remove.isPending}>
            <DialogHeader>
              <DialogTitle>Delete this event?</DialogTitle>
              <DialogDescription>
                “{deleting?.title}” will be removed from the public calendar. This cannot be undone.
              </DialogDescription>
            </DialogHeader>
            {remove.isError && (
              <p role="alert" className="text-destructive text-sm">
                {remove.error.message}
              </p>
            )}
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                disabled={remove.isPending}
                onClick={() => {
                  setDeleting(null);
                }}
              >
                Keep event
              </Button>
              <Button
                variant="destructive"
                disabled={remove.isPending}
                onClick={() => {
                  if (deleting) remove.mutate(deleting.id);
                }}
              >
                {remove.isPending ? 'Deleting…' : 'Delete event'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
