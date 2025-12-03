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
    const extraPrefixesRaw = (env?.AIPEXBASE_PATH_PREFIXES || '').trim();
    const prefixList = [prefix].concat(extraPrefixesRaw ? extraPrefixesRaw.split(',').map(p => p.trim()) : []);
    const normalizedPrefixes = Array.from(new Set(prefixList.filter(Boolean).map(p => p.startsWith('/') ? p : `/${p}`).concat([''])));
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
    headers.delete('origin');
    headers.delete('referer');

    const injectedKey = env?.AIPEXBASE_API_KEY || env?.VITE_AIPEX_API_KEY || '';
    if (!headers.get('CODE_FLYING') && injectedKey) {
      headers.set('CODE_FLYING', injectedKey);
    }
    if (!headers.get('X-API-Key') && injectedKey) {
      headers.set('X-API-Key', injectedKey);
      headers.set('x-api-key', injectedKey);
    }
    const appId = env?.AIPEXBASE_APP_ID || env?.VITE_APP_ID || '';
    if (appId && !headers.get('APP_ID')) {
      headers.set('APP_ID', appId);
    }

    let bodyBuf = undefined;
    if (!(request.method === 'GET' || request.method === 'HEAD')) {
      try { bodyBuf = await request.arrayBuffer(); } catch (_) {}
    }

    // Try upstreams in order; prefer JSON responses
    let lastError = null;
    for (const base of bases) {
      let lastStatus = 0;
      let lastCt = '';
      let lastTarget = '';
      let lastPrefix = '';
      let lastPreview = '';
      for (const pfx of normalizedPrefixes) {
        const targetUrl = `${base}${aipexbasePath.startsWith(pfx) ? aipexbasePath : `${pfx}${aipexbasePath}`}${url.search}`;
        try {
          const upstream = new URL(targetUrl);
          const h = new Headers(headers);
          const overrideHost = env?.AIPEXBASE_HOST;
          const isIp = /^\d+\.\d+\.\d+\.\d+$/.test(upstream.hostname);
          const fallbackHost = isIp ? (env?.AIPEXBASE_FALLBACK_HOST || 'api.aipexbase.com') : upstream.host;
          h.set('host', overrideHost || fallbackHost);
          h.set('accept', 'application/json');
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
          respHeaders.set('X-Proxy-Prefix', pfx || '/');
          respHeaders.set('X-Proxy-Host-Used', h.get('host') || '');

          if (!ct.includes('application/json') && (response.status === 401 || response.status === 403 || response.status >= 500)) {
            lastStatus = response.status;
            lastCt = ct;
            lastTarget = targetUrl;
            lastPrefix = pfx || '/';
            try { lastPreview = (await response.text()).slice(0, 240); } catch (_) {}
            continue;
          }
          if (!ct.includes('application/json') && response.status >= 300 && response.status < 400) {
            lastStatus = response.status;
            lastCt = ct;
            lastTarget = targetUrl;
            lastPrefix = pfx || '/';
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
      if (lastStatus) {
        const allowHeaders2 = request.headers.get('Access-Control-Request-Headers') || 'Content-Type, Authorization, CODE_FLYING';
        const payload = { code: lastStatus, success: false, message: `UpstreamRejected`, data: null, details: { status: lastStatus, contentType: lastCt, target: lastTarget, prefix: lastPrefix, preview: lastPreview } };
        const h2 = new Headers({ 'Content-Type': 'application/json' });
        h2.set('Access-Control-Allow-Origin', '*');
        h2.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        h2.set('Access-Control-Allow-Headers', allowHeaders2);
        h2.set('X-Proxy-Upstream', base);
        return new Response(JSON.stringify(payload), { status: 502, headers: h2 });
      }
    }
    return new Response(JSON.stringify({ error: 'Proxy Error', details: String(lastError?.message || 'All upstreams failed') }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
