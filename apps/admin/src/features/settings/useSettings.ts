import { SiteSettingsResponseSchema } from '@nsbe/shared';
import { useQuery } from '@tanstack/react-query';

import { apiFetch } from '../../lib/api';
import { SETTINGS_QUERY_KEY } from './query-keys';

// Reads the same public endpoint the website's footer uses.
export function useSettings() {
  return useQuery({
    queryKey: SETTINGS_QUERY_KEY,
    queryFn: async () => {
      const data = await apiFetch('/api/settings', { schema: SiteSettingsResponseSchema });
      return data.settings;
    },
  });
}
