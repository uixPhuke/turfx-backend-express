// Download/start the disposable test server before Jest's per-hook deadline begins.
// Never connect to the developer's MONGODB_URI or load .env here.
const { MongoMemoryServer } = require('mongodb-memory-server');
(async () => {
  const server = await MongoMemoryServer.create();
  try { console.log('Disposable MongoDB test runtime prepared'); }
  finally { await server.stop(); }
})().catch(() => { console.error('Disposable MongoDB test runtime could not start'); process.exitCode = 1; });
