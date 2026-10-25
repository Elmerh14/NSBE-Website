import type { AdminUser } from '@nsbe/shared';
import { Badge } from '@nsbe/ui/components/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@nsbe/ui/components/table';

import { formatJoinedDate, ROLE_LABELS } from './user-text';
import type { UserAction } from './UserActionDialog';
import { UserActionsMenu } from './UserActionsMenu';

type UsersTableProps = {
  users: AdminUser[];
  currentUserId: number;
  onAction: (action: UserAction) => void;
};

// On phones the email moves under the name, and the Added column is hidden.
export function UsersTable({ users, currentUserId, onAction }: UsersTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead className="hidden md:table-cell">Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="hidden lg:table-cell">Added</TableHead>
          <TableHead>
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => {
          const isSelf = user.id === currentUserId;
          return (
            <TableRow key={user.id} className={user.isActive ? undefined : 'text-muted-foreground'}>
              <TableCell>
                <div className="font-medium">
                  {user.name}
                  {isSelf && <span className="text-muted-foreground font-normal"> (you)</span>}
                </div>
                <div className="text-muted-foreground text-xs md:hidden">{user.email}</div>
              </TableCell>
              <TableCell className="hidden md:table-cell">{user.email}</TableCell>
              <TableCell>
                <Badge variant={user.role === 'SUPER_ADMIN' ? 'default' : 'secondary'}>
                  {ROLE_LABELS[user.role]}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={user.isActive ? 'outline' : 'destructive'}>
                  {user.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                {formatJoinedDate(user.createdAt)}
              </TableCell>
              <TableCell className="text-right">
                {/* The API refuses every action on your own account, so there's no menu. */}
                {!isSelf && <UserActionsMenu user={user} onAction={onAction} />}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
