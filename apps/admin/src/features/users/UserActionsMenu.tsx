import type { AdminUser } from '@nsbe/shared';
import { Button } from '@nsbe/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@nsbe/ui/components/dropdown-menu';
import { Ellipsis, KeyRound, RotateCcw, UserCog, UserX } from 'lucide-react';

import type { UserAction } from './UserActionDialog';

type UserActionsMenuProps = {
  user: AdminUser;
  onAction: (action: UserAction) => void;
};

// The ⋯ menu on a row. A deactivated user can only be reactivated; the API rejects the rest.
export function UserActionsMenu({ user, onAction }: UserActionsMenuProps) {
  return (
    // Not modal: a modal menu closing while a dialog opens can leave the page unclickable.
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Actions for ${user.name}`}>
          <Ellipsis />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {user.isActive ? (
          <>
            <DropdownMenuItem
              onSelect={() => {
                onAction({ kind: 'changeRole', user });
              }}
            >
              <UserCog />
              Change role
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => {
                onAction({ kind: 'resetPassword', user });
              }}
            >
              <KeyRound />
              Reset password
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => {
                onAction({ kind: 'deactivate', user });
              }}
            >
              <UserX />
              Deactivate
            </DropdownMenuItem>
          </>
        ) : (
          <DropdownMenuItem
            onSelect={() => {
              onAction({ kind: 'reactivate', user });
            }}
          >
            <RotateCcw />
            Reactivate
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
