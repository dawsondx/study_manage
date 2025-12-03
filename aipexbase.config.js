import { createClient } from 'aipexbase-js';

// 确保在生产环境中正确获取环境变量
const baseUrl = typeof import.meta !== 'undefined' ? import.meta.env.VITE_AIPEX_API || '' : process.env.VITE_AIPEX_API || '';
const apiKey = typeof import.meta !== 'undefined' ? import.meta.env.VITE_AIPEX_API_KEY || undefined : process.env.VITE_AIPEX_API_KEY || undefined;

console.log('Aipexbase config:', {
  baseUrl: baseUrl,
  hasApiKey: !!apiKey,
  timestamp: new Date().toISOString()
});

export const client = createClient({
  baseUrl: baseUrl,
  apiKey: apiKey
});
export default client;
