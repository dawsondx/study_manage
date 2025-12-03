export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      const reqHeaders = request.headers.get('Access-Control-Request-Headers') || 'Content-Type, Authorization, CODE_FLYING';
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': reqHeaders,
          'Access-Control-Max-Age': '86400'
        }
      });
    }

    // Match both /baas-api and /api prefixes
    const match = url.pathname.match(/^\/(baas-api|api)(\/|$)/);
    if (!match) {
      return new Response('Not Found', { status: 404 });
    }

    // Remove the matched prefix and construct target
    const aipexbasePath = url.pathname.replace(/^\/(baas-api|api)/, '');
    const prefixRaw = (env?.AIPEXBASE_PATH_PREFIX || '/api').trim();
    const prefix = prefixRaw.startsWith('/') ? prefixRaw : `/${prefixRaw}`;
    const pathWithApi = aipexbasePath.startsWith(prefix) ? aipexbasePath : `${prefix}${aipexbasePath}`;
    const bases = Array.from(new Set([
      env?.AIPEXBASE_BASE,
      'https://api.aipexbase.com',
      'https://www.aipexbase.dev'
    ].filter(Boolean)));

    // Prepare headers
    const headers = new Headers(request.headers);
    headers.delete('host');
    headers.delete('cf-connecting-ip');
    headers.delete('cf-ipcountry');
    headers.delete('cf-ray');
    headers.delete('cf-visitor');
    headers.delete('x-forwarded-proto');

    const injectedKey = env?.AIPEXBASE_API_KEY || env?.VITE_AIPEX_API_KEY || '';
    if (!headers.get('CODE_FLYING') && injectedKey) {
      headers.set('CODE_FLYING', injectedKey);
    }

    // Try upstreams in order; prefer JSON responses
    let lastError = null;
    for (const base of bases) {
      const targetUrl = `${base}${pathWithApi}${url.search}`;
      try {
        const response = await fetch(targetUrl, {
          method: request.method,
          headers,
          body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
          redirect: 'manual'
        });
        const ct = response.headers.get('content-type') || '';
        const respHeaders = new Headers(response.headers);
        respHeaders.set('Access-Control-Allow-Origin', '*');
        respHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        const allowHeaders = request.headers.get('Access-Control-Request-Headers') || 'Content-Type, Authorization, CODE_FLYING';
        respHeaders.set('Access-Control-Allow-Headers', allowHeaders);

        // Prefer JSON; if not JSON and status indicates Cloudflare error page, try next upstream
        if (!ct.includes('application/json') && response.status >= 500) {
          continue;
        }
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: respHeaders
        });
      } catch (error) {
        lastError = error;
        continue;
      }
    }
    return new Response(JSON.stringify({ error: 'Proxy Error', details: String(lastError?.message || 'All upstreams failed') }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
