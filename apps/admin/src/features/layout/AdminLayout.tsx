import { Button } from '@nsbe/ui/components/button';
import { Link, Outlet } from 'react-router';

import { useCurrentUser } from '../auth/useCurrentUser';
import { useLogout } from '../auth/useLogout';

// The frame around every admin page: a header with the signed-in user and Sign out.
// It sits inside RequireAuth, so the current user is already loaded.
export function AdminLayout() {
  const currentUser = useCurrentUser();
  const logout = useLogout();

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between gap-4 border-b px-4 py-3">
        <Link to="/" className="font-semibold">
          NSBE Admin
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground hidden text-sm sm:inline">
            {currentUser.data?.name}
          </span>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/change-password">Change password</Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={logout.isPending}
            onClick={() => {
              logout.mutate();
            }}
          >
            Sign out
          </Button>
        </div>
      </header>
      {logout.error && (
        <p role="alert" className="text-destructive px-4 pt-3 text-sm">
          Could not sign out. Please try again.
        </p>
      )}
      <Outlet />
    </div>
  );
}
