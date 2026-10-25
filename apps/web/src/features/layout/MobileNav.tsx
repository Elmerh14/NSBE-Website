import { Button } from '@nsbe/ui/components/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@nsbe/ui/components/sheet';
import { cn } from '@nsbe/ui/lib/utils';
import { Menu } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation } from 'react-router';

import { JoinButton } from './JoinButton';
import { HEADER_NAV, PAGES, SITE_NAME, type SitePage } from './site';

// The ☰ menu on phones: every page in one list, with the About group's pages under a heading.
export function MobileNav() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  function close() {
    setOpen(false);
  }

  function renderLink(page: SitePage) {
    return (
      <Link
        key={page.path}
        to={page.path}
        onClick={close}
        aria-current={pathname === page.path ? 'page' : undefined}
        className={cn(
          'hover:bg-muted rounded-md px-3 py-2 text-base',
          pathname === page.path && 'bg-muted font-medium',
        )}
      >
        {page.title}
      </Link>
    );
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>{SITE_NAME}</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 px-4">
          {renderLink(PAGES.home)}
          {HEADER_NAV.map((entry) =>
            entry.kind === 'link' ? (
              renderLink(entry.page)
            ) : (
              <div key={entry.title} className="flex flex-col gap-1">
                <p className="text-muted-foreground px-3 pt-3 text-xs font-semibold uppercase">
                  {entry.title}
                </p>
                {entry.pages.map(renderLink)}
              </div>
            ),
          )}
        </nav>
        <div className="px-4">
          <JoinButton label="Join NSBE" className="w-full" onClick={close} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
