import { SiteSettingsResponseSchema } from '@nsbe/shared';
import { useQuery } from '@tanstack/react-query';

import { apiGet } from '../../lib/api';

// Contact email, join link and social links, edited on the admin Settings page.
export function useSiteSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async () => (await apiGet('/api/settings', SiteSettingsResponseSchema)).settings,
  });
}
