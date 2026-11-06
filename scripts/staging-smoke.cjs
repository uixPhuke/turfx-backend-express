const base = process.env.PLAYZA_SMOKE_URL;
if (!base || !/^https:\/\//.test(base) || !base.endsWith('/api/v2')) throw new Error('Set PLAYZA_SMOKE_URL to the staging HTTPS /api/v2 URL');
(async () => {
  for (const path of ['/live', '/ready', '/sports']) {
    const response = await fetch(base + path, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error(`Smoke check failed: ${path} ${response.status}`);
    if (!response.headers.get('x-content-type-options')) throw new Error('Missing security headers');
    console.log(`PASS ${path}`);
  }
})().catch(() => { console.error('Staging smoke verification failed'); process.exitCode = 1; });
