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

    if (/^\/(baas-api|api)\/__health__$/i.test(url.pathname)) {
      return new Response(JSON.stringify({ status: 'ok' }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
        }
      });
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
    headers.delete('cf-connecting-ip');
    headers.delete('cf-ipcountry');
    headers.delete('cf-ray');
    headers.delete('cf-visitor');
    headers.delete('x-forwarded-proto');

    const injectedKey = env?.AIPEXBASE_API_KEY || env?.VITE_AIPEX_API_KEY || '';
    if (!headers.get('CODE_FLYING') && injectedKey) {
      headers.set('CODE_FLYING', injectedKey);
    }

    let bodyBuf = undefined;
    if (!(request.method === 'GET' || request.method === 'HEAD')) {
      try { bodyBuf = await request.arrayBuffer(); } catch (_) {}
    }

    // Try upstreams in order; prefer JSON responses
    let lastError = null;
    for (const base of bases) {
      const targetUrl = `${base}${pathWithApi}${url.search}`;
      try {
        const upstream = new URL(targetUrl);
        const h = new Headers(headers);
        h.set('host', upstream.host);
        const response = await fetch(targetUrl, {
          method: request.method,
          headers: h,
          body: bodyBuf,
          redirect: 'manual'
        });
        const ct = response.headers.get('content-type') || '';
        const respHeaders = new Headers(response.headers);
        respHeaders.set('Access-Control-Allow-Origin', '*');
        respHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        const allowHeaders = request.headers.get('Access-Control-Request-Headers') || 'Content-Type, Authorization, CODE_FLYING';
        respHeaders.set('Access-Control-Allow-Headers', allowHeaders);
        respHeaders.set('X-Proxy-Upstream', base);
        respHeaders.set('X-Proxy-Target', targetUrl);
        respHeaders.set('X-Proxy-Status', String(response.status));

        if (!ct.includes('application/json') && (response.status === 401 || response.status === 403 || response.status >= 500)) {
          const payload = { code: response.status, success: false, message: `UpstreamRejected: status=${response.status}, ct=${ct}`, data: null };
          const h2 = new Headers({ 'Content-Type': 'application/json' });
          h2.set('Access-Control-Allow-Origin', '*');
          h2.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
          h2.set('Access-Control-Allow-Headers', allowHeaders);
          h2.set('X-Proxy-Upstream', base);
          h2.set('X-Proxy-Target', targetUrl);
          return new Response(JSON.stringify(payload), { status: 502, headers: h2 });
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
