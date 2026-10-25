import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@nsbe/ui/components/alert-dialog';
import { Button } from '@nsbe/ui/components/button';

import { userErrorMessage } from './user-text';

type ConfirmDialogProps = {
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  isPending: boolean;
  error: unknown;
  onConfirm: () => void;
  onClose: () => void;
};

// "Are you sure?" for reset password and deactivate. The caller owns the request.
export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  destructive = false,
  isPending,
  error,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <AlertDialog
      open
      onOpenChange={(open) => {
        if (!open && !isPending) onClose();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        {error !== null && (
          <p role="alert" className="text-destructive text-sm">
            {userErrorMessage(error)}
          </p>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          {/* A plain Button, not AlertDialogAction, which would close before the request finishes. */}
          <Button
            variant={destructive ? 'destructive' : 'default'}
            disabled={isPending}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
