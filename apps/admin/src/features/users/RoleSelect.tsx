import { type Role, RoleSchema } from '@nsbe/shared';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@nsbe/ui/components/select';

import { ROLE_LABELS, ROLE_OPTIONS } from './user-text';

type RoleSelectProps = {
  id: string;
  value: Role;
  onChange: (role: Role) => void;
  disabled?: boolean;
};

export function RoleSelect({ id, value, onChange, disabled }: RoleSelectProps) {
  return (
    <Select
      value={value}
      disabled={disabled}
      onValueChange={(next) => {
        const role = RoleSchema.safeParse(next);
        if (role.success) onChange(role.data);
      }}
    >
      <SelectTrigger id={id} className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ROLE_OPTIONS.map((role) => (
          <SelectItem key={role} value={role}>
            {ROLE_LABELS[role]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
