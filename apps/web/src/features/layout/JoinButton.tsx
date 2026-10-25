import { Button } from '@nsbe/ui/components/button';

import { useSiteSettings } from '../settings/useSiteSettings';

type JoinButtonProps = {
  label?: string;
  className?: string;
  onClick?: () => void;
};

// Links to the join link from the admin Settings page. Hidden when no join link is set.
export function JoinButton({ label = 'Join', className, onClick }: JoinButtonProps) {
  const settings = useSiteSettings();
  const joinUrl = settings.data?.joinUrl;
  if (!joinUrl) return null;

  return (
    <Button asChild className={className}>
      <a href={joinUrl} target="_blank" rel="noopener noreferrer" onClick={onClick}>
        {label}
      </a>
    </Button>
  );
}
