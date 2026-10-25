import type { AuthUser } from '@nsbe/shared';
import { Avatar, AvatarFallback } from '@nsbe/ui/components/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@nsbe/ui/components/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@nsbe/ui/components/sidebar';
import { ChevronsUpDown, KeyRound, LogOut } from 'lucide-react';
import { Link } from 'react-router';

import { userInitial } from './nav-items';

type NavUserProps = {
  user: AuthUser;
  signingOut: boolean;
  onSignOut: () => void;
};

// The signed-in user at the bottom of the sidebar. Clicking it opens the account menu.
export function NavUser({ user, signingOut, onSignOut }: NavUserProps) {
  const { isMobile } = useSidebar();
  const initial = userInitial(user.name);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar>
                <AvatarFallback>{initial}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="text-muted-foreground truncate text-xs">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-56"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="truncate font-normal">{user.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/change-password">
                <KeyRound />
                Change password
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem disabled={signingOut} onSelect={onSignOut}>
              <LogOut />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
