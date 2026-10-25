import type { AdminUser, TemporaryPasswordResponse } from '@nsbe/shared';

import { ConfirmDialog } from './ConfirmDialog';
import { RoleDialog } from './RoleDialog';
import { useChangeUserRole } from './useChangeUserRole';
import { useDeactivateUser } from './useDeactivateUser';
import { useReactivateUser } from './useReactivateUser';
import { useResetUserPassword } from './useResetUserPassword';

export type UserAction = {
  kind: 'changeRole' | 'resetPassword' | 'deactivate' | 'reactivate';
  user: AdminUser;
};

type UserActionDialogProps = {
  action: UserAction;
  onClose: () => void;
  onTemporaryPassword: (result: TemporaryPasswordResponse) => void;
};

// The dialog for one ⋯ menu action. The page mounts a fresh one per action, so no error or
// pending state carries over from the last one.
export function UserActionDialog({ action, onClose, onTemporaryPassword }: UserActionDialogProps) {
  const { kind, user } = action;
  const changeRole = useChangeUserRole(user.id);
  const resetPassword = useResetUserPassword(user.id);
  const deactivate = useDeactivateUser(user.id);
  const reactivate = useReactivateUser(user.id);

  switch (kind) {
    case 'changeRole':
      return (
        <RoleDialog
          title={`Change role for ${user.name}`}
          description="Super admins can also manage users. Admins can manage everything else."
          submitLabel={changeRole.isPending ? 'Saving…' : 'Save'}
          defaultRole={user.role}
          isPending={changeRole.isPending}
          error={changeRole.error}
          onSubmit={(role) => {
            changeRole.mutate(role, { onSuccess: onClose });
          }}
          onClose={onClose}
        />
      );
    case 'reactivate':
      return (
        <RoleDialog
          title={`Reactivate ${user.name}`}
          description="Choose their role again. They get a new temporary password."
          submitLabel={reactivate.isPending ? 'Reactivating…' : 'Reactivate'}
          defaultRole="USER"
          isPending={reactivate.isPending}
          error={reactivate.error}
          onSubmit={(role) => {
            reactivate.mutate(role, { onSuccess: onTemporaryPassword });
          }}
          onClose={onClose}
        />
      );
    case 'resetPassword':
      return (
        <ConfirmDialog
          title={`Reset password for ${user.name}?`}
          description="Their current password stops working and they are signed out everywhere. You'll get a new temporary password to send them."
          confirmLabel={resetPassword.isPending ? 'Resetting…' : 'Reset password'}
          isPending={resetPassword.isPending}
          error={resetPassword.error}
          onConfirm={() => {
            resetPassword.mutate(undefined, { onSuccess: onTemporaryPassword });
          }}
          onClose={onClose}
        />
      );
    case 'deactivate':
      return (
        <ConfirmDialog
          title={`Deactivate ${user.name}?`}
          description="They are signed out everywhere and can't log in. You can reactivate them later."
          confirmLabel={deactivate.isPending ? 'Deactivating…' : 'Deactivate'}
          destructive
          isPending={deactivate.isPending}
          error={deactivate.error}
          onConfirm={() => {
            deactivate.mutate(undefined, { onSuccess: onClose });
          }}
          onClose={onClose}
        />
      );
  }
}
