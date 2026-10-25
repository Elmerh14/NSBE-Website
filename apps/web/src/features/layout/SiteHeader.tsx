import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@nsbe/ui/components/navigation-menu';
import { Link, useLocation } from 'react-router';

import { JoinButton } from './JoinButton';
import { MobileNav } from './MobileNav';
import { HEADER_NAV, SITE_NAME } from './site';

// Desktop: the nav menu with About as a dropdown. Phones: a ☰ button that opens MobileNav.
export function SiteHeader() {
  const { pathname } = useLocation();

  return (
    <header className="bg-background/95 supports-backdrop-filter:bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link to="/" className="text-lg font-bold">
          {SITE_NAME}
        </Link>

        <div className="flex items-center gap-2">
          <NavigationMenu viewport={false} className="hidden md:flex">
            <NavigationMenuList>
              {HEADER_NAV.map((entry) =>
                entry.kind === 'link' ? (
                  <NavigationMenuItem key={entry.page.path}>
                    <NavigationMenuLink
                      asChild
                      active={pathname === entry.page.path}
                      className={navigationMenuTriggerStyle()}
                    >
                      <Link to={entry.page.path}>{entry.page.title}</Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                ) : (
                  <NavigationMenuItem key={entry.title}>
                    <NavigationMenuTrigger>{entry.title}</NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="grid w-48 gap-1">
                        {entry.pages.map((page) => (
                          <li key={page.path}>
                            <NavigationMenuLink asChild active={pathname === page.path}>
                              <Link to={page.path}>{page.title}</Link>
                            </NavigationMenuLink>
                          </li>
                        ))}
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                ),
              )}
            </NavigationMenuList>
          </NavigationMenu>

          <JoinButton />
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
