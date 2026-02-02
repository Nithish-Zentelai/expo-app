// Minimal TMDB proxy for production deployment (Node 18+).
// Usage:
//   TMDB_API_KEY=xxx PORT=8787 node server/tmdb-proxy.js
// Client base URL:
//   EXPO_PUBLIC_TMDB_PROXY_URL=https://your-domain.com
//
// Routes:
//   GET /tmdb/*  -> https://api.themoviedb.org/3/*

const http = require('node:http');

const TMDB_API_KEY = process.env.TMDB_API_KEY || '';
const PORT = Number(process.env.PORT || 8787);
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

if (!TMDB_API_KEY) {
    console.error('Missing TMDB_API_KEY env var.');
    process.exit(1);
}

const server = http.createServer(async (req, res) => {
    try {
        if (!req.url || !req.method) {
            res.writeHead(400);
            res.end('Bad Request');
            return;
        }

        const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
        if (req.method !== 'GET' || !url.pathname.startsWith('/tmdb/')) {
            res.writeHead(404);
            res.end('Not Found');
            return;
        }

        const path = url.pathname.replace('/tmdb', '');
        const upstream = new URL(`https://api.themoviedb.org/3${path}`);

        // Copy query params, but always override api_key server-side.
        url.searchParams.forEach((value, key) => {
            if (key !== 'api_key') {
                upstream.searchParams.append(key, value);
            }
        });
        upstream.searchParams.set('api_key', TMDB_API_KEY);

        const upstreamRes = await fetch(upstream.toString(), {
            headers: {
                accept: req.headers.accept || 'application/json',
                'accept-language': req.headers['accept-language'] || 'en-US',
                'user-agent': req.headers['user-agent'] || 'tmdb-proxy',
            },
        });

        const body = Buffer.from(await upstreamRes.arrayBuffer());

        res.statusCode = upstreamRes.status;
        res.setHeader('Access-Control-Allow-Origin', CORS_ORIGIN);
        res.setHeader('Vary', 'Origin');
        res.setHeader('Content-Type', upstreamRes.headers.get('content-type') || 'application/json');

        const cacheControl = upstreamRes.headers.get('cache-control');
        if (cacheControl) {
            res.setHeader('Cache-Control', cacheControl);
        }

        res.end(body);
    } catch (error) {
        res.writeHead(502);
        res.end('Upstream Error');
    }
});

server.listen(PORT, () => {
    console.log(`TMDB proxy listening on http://localhost:${PORT}`);
});

