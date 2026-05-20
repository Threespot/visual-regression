const { getHttpAuth, authAppliesTo, authHeader } = require('./auth');

async function warmupUrls(urls) {
  const unique = Array.from(new Set(urls));
  if (unique.length === 0) return;

  const auth = getHttpAuth();

  process.stdout.write(`[vrt] Warming up ${unique.length} URL(s)...\n`);

  await Promise.all(
    unique.map(async (url) => {
      const start = Date.now();
      const headers = authAppliesTo(url, auth) ? { Authorization: authHeader(auth) } : undefined;
      try {
        const res = await fetch(url, { method: 'GET', redirect: 'follow', headers });
        process.stdout.write(`[vrt]   ${res.status}  ${url}  (${Date.now() - start}ms)\n`);
      } catch (err) {
        process.stdout.write(`[vrt]   ERR  ${url}  (${err.message})\n`);
      }
    })
  );
}

module.exports = { warmupUrls };
