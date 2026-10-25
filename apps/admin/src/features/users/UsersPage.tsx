import type { TemporaryPasswordResponse } from '@nsbe/shared';
import { Button } from '@nsbe/ui/components/button';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Navigate } from 'react-router';

import { useCurrentUser } from '../auth/useCurrentUser';
import { AddUserDialog } from './AddUserDialog';
import { TemporaryPasswordDialog } from './TemporaryPasswordDialog';
import { type UserAction, UserActionDialog } from './UserActionDialog';
import { UsersTable } from './UsersTable';
import { useUsers } from './useUsers';

export function UsersPage() {
  const currentUser = useCurrentUser();
  const isSuperAdmin = currentUser.data?.role === 'SUPER_ADMIN';
  const users = useUsers(isSuperAdmin);

  const [adding, setAdding] = useState(false);
  const [action, setAction] = useState<UserAction | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState<TemporaryPasswordResponse | null>(
    null,
  );

  // The sidebar hides the link from other roles, but the URL can still be typed in.
  if (!currentUser.data || !isSuperAdmin) return <Navigate to="/" replace />;

  // Close whichever dialog produced the password, then show it.
  function showTemporaryPassword(result: TemporaryPasswordResponse) {
    setAdding(false);
    setAction(null);
    setTemporaryPassword(result);
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-muted-foreground mt-1 text-sm">Who can sign in to the admin app.</p>
        </div>
        <Button
          onClick={() => {
            setAdding(true);
          }}
        >
          <Plus />
          Add user
        </Button>
      </div>

      {users.isPending && <p className="text-muted-foreground text-sm">Loading users…</p>}

      {users.isError && (
        <div className="flex items-center gap-4">
          <p role="alert" className="text-destructive text-sm">
            Couldn&apos;t load users.
          </p>
          <Button variant="outline" size="sm" onClick={() => void users.refetch()}>
            Try again
          </Button>
        </div>
      )}

      {users.data && (
        <UsersTable users={users.data} currentUserId={currentUser.data.id} onAction={setAction} />
      )}

      {adding && (
        <AddUserDialog
          onClose={() => {
            setAdding(false);
          }}
          onCreated={showTemporaryPassword}
        />
      )}

      {action && (
        <UserActionDialog
          key={`${action.kind}-${String(action.user.id)}`}
          action={action}
          onClose={() => {
            setAction(null);
          }}
          onTemporaryPassword={showTemporaryPassword}
        />
      )}

      {temporaryPassword && (
        <TemporaryPasswordDialog
          result={temporaryPassword}
          onDone={() => {
            setTemporaryPassword(null);
          }}
        />
      )}
    </div>
  );
}
