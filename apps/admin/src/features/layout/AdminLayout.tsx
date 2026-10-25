import { SidebarInset, SidebarProvider, SidebarTrigger } from '@nsbe/ui/components/sidebar';
import { TooltipProvider } from '@nsbe/ui/components/tooltip';
import { Outlet } from 'react-router';

import { useCurrentUser } from '../auth/useCurrentUser';
import { useLogout } from '../auth/useLogout';
import { AppSidebar } from './AppSidebar';

// The frame around every admin page: the sidebar, plus a slim bar with the button that
// opens it (phones) or collapses it to icons (desktop). It sits inside RequireAuth.
export function AdminLayout() {
  const currentUser = useCurrentUser();
  const logout = useLogout();

  // RequireAuth only renders this once the user has loaded.
  if (!currentUser.data) return null;

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar
          user={currentUser.data}
          signingOut={logout.isPending}
          onSignOut={() => {
            logout.mutate();
          }}
        />
        <SidebarInset>
          <div className="flex h-12 shrink-0 items-center border-b px-2">
            <SidebarTrigger />
          </div>
          {logout.error && (
            <p role="alert" className="text-destructive px-4 pt-3 text-sm">
              Could not sign out. Please try again.
            </p>
          )}
          <Outlet />
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
