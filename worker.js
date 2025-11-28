export default {
    async fetch(request) {
        const url = new URL(request.url);

        // 1. Handle CORS preflight requests
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                status: 204,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                    'Access-Control-Allow-Headers': '*',
                    'Access-Control-Max-Age': '86400',
                }
            });
        }

        // 2. Check path prefix
        if (!url.pathname.startsWith('/baas-api/')) {
            return new Response('Not Found', { status: 404 });
        }

        // 3. Construct target URL
        // We KEEP the /baas-api prefix as per user instruction and Aipexbase convention
        // Target: http://backend.dawsondx.top/baas-api/...
        const targetUrl = 'http://backend.dawsondx.top' + url.pathname + url.search;

        // 4. Prepare headers
        const headers = new Headers(request.headers);
        // Remove headers that might confuse the backend or are specific to the proxy
        headers.delete('host');
        headers.delete('cf-connecting-ip');
        headers.delete('cf-ipcountry');
        headers.delete('cf-ray');
        headers.delete('cf-visitor');
        headers.delete('x-forwarded-proto');

        // 5. Forward request
        try {
            const response = await fetch(targetUrl, {
                method: request.method,
                headers: headers,
                body: request.body,
                redirect: 'manual' // Let the client handle redirects if needed
            });

            // 6. Prepare response headers (CORS)
            const responseHeaders = new Headers(response.headers);
            responseHeaders.set('Access-Control-Allow-Origin', '*');
            responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            responseHeaders.set('Access-Control-Allow-Headers', '*');

            return new Response(response.body, {
                status: response.status,
                statusText: response.statusText,
                headers: responseHeaders
            });
        } catch (error) {
            return new Response(JSON.stringify({ error: 'Proxy Error', details: error.message }), {
                status: 502,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }
};
