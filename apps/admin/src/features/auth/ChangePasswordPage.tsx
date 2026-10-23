import { Button } from '@nsbe/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@nsbe/ui/components/card';
import { Link, Navigate } from 'react-router';

import { ChangePasswordForm } from './ChangePasswordForm';
import { useCurrentUser } from './useCurrentUser';
import { useLogout } from './useLogout';

// Not inside RequireAuth, because RequireAuth sends users with a temporary password here.
// It still needs a logged-in user, so it does its own check.
export function ChangePasswordPage() {
  const currentUser = useCurrentUser();
  const logout = useLogout();

  if (currentUser.isPending) {
    return <p>Loading...</p>;
  }

  if (currentUser.error) {
    return <Navigate to="/login" replace />;
  }

  const forced = currentUser.data.mustChangePassword;

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Choose a new password</CardTitle>
          <CardDescription>
            {forced
              ? 'You need to replace your temporary password first.'
              : `Signed in as ${currentUser.data.email}.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          {/* A user with a temporary password can't use the dashboard yet, so only offer it to others. */}
          {!forced && (
            <Button variant="link" asChild>
              <Link to="/">Back to dashboard</Link>
            </Button>
          )}
          <Button
            variant="link"
            disabled={logout.isPending}
            onClick={() => {
              logout.mutate();
            }}
          >
            Sign out
          </Button>
          {logout.error && (
            <p role="alert" className="text-destructive text-sm">
              Could not sign out. Please try again.
            </p>
          )}
        </CardFooter>
      </Card>
    </main>
  );
}
