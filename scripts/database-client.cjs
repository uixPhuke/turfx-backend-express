// Keep database credentials out of process command arguments.
const {spawnSync}=require('node:child_process');
try {
 const url=new URL(process.env.DATABASE_URL);
 if(!['postgres:','postgresql:'].includes(url.protocol))throw Error();
 const env={...process.env,PGHOST:url.hostname,PGPORT:url.port||'5432',PGDATABASE:decodeURIComponent(url.pathname.slice(1)),PGUSER:decodeURIComponent(url.username),PGPASSWORD:decodeURIComponent(url.password)};
 for(const [query,key] of [['sslmode','PGSSLMODE'],['sslrootcert','PGSSLROOTCERT'],['connect_timeout','PGCONNECT_TIMEOUT']])if(url.searchParams.has(query))env[key]=url.searchParams.get(query);
 const command=process.argv[2];if(!['psql','pg_dump','pg_restore'].includes(command))throw Error();
 const result=spawnSync(command,[...(command === "pg_restore" ? ["--dbname",env.PGDATABASE] : []),...process.argv.slice(3)],{env,stdio:'inherit'});process.exitCode=result.status??1;
} catch {console.error('Invalid database client configuration');process.exitCode=1;}
