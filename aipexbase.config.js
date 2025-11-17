import { createClient } from 'aipexbase-js';

export const client = createClient({
  baseUrl: import.meta.env.VITE_AIPEX_API || '',
  apiKey: import.meta.env.VITE_AIPEX_API_KEY || undefined
});
export default client;
