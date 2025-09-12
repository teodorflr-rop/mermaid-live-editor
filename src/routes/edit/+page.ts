import type { PageLoad } from './$types';

export const load: PageLoad = ({ url }) => {
  // Extract the mode parameter from URL
  const mode = url.searchParams.get('mode') || 'edit'; // default to 'edit'

  return {
    mode: mode as 'edit' | 'view'
  };
};
