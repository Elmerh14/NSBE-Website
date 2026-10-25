import type { AuthUser } from '@nsbe/shared';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@nsbe/ui/components/sidebar';
import { Link, useLocation } from 'react-router';

import { isNavItemActive, NAV_ITEMS, visibleNavItems } from './nav-items';
import { NavUser } from './NavUser';

type AppSidebarProps = {
  user: AuthUser;
  signingOut: boolean;
  onSignOut: () => void;
};

// Collapses to icons on desktop and slides in as a sheet on phones.
export function AppSidebar({ user, signingOut, onSignOut }: AppSidebarProps) {
  const { pathname } = useLocation();
  const { isMobile, setOpenMobile } = useSidebar();
  const items = visibleNavItems(NAV_ITEMS, user.role);

  // On phones the sidebar covers the page, so close it once a link is picked.
  function closeOnMobile() {
    if (isMobile) setOpenMobile(false);
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/" onClick={closeOnMobile}>
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg font-bold">
                  N
                </div>
                <span className="truncate font-semibold">NSBE Admin</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton
                    asChild
                    isActive={isNavItemActive(pathname, item.to)}
                    tooltip={item.title}
                  >
                    <Link to={item.to} onClick={closeOnMobile}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} signingOut={signingOut} onSignOut={onSignOut} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
