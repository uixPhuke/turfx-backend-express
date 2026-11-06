const {spawn}=require('node:child_process');const {randomBytes}=require('node:crypto');
const pause=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{if(!process.env.PLAYZA_TEST_DATABASE_URL?.includes('127.0.0.1:55439/'))throw Error('Set isolated PLAYZA_TEST_DATABASE_URL');
 const cache=spawn(process.env.REDIS_SERVER_BIN||'redis-server',['--port','56389','--bind','127.0.0.1','--save','','--appendonly','no'],{stdio:'ignore'});let api;
 try{await pause(500);api=spawn(process.execPath,['.playza-build/postgres/server.js'],{env:{...process.env,NODE_ENV:'development',APP_ENV:'local',ALLOWED_ORIGINS:'http://localhost:8081',DATABASE_URL:process.env.PLAYZA_TEST_DATABASE_URL,REDIS_URL:'redis://127.0.0.1:56389',POSTGRES_API_PORT:'18119',JWT_SECRET:randomBytes(32).toString('hex'),REFRESH_TOKEN_SECRET:randomBytes(32).toString('hex'),OTP_SECRET:randomBytes(32).toString('hex')},stdio:'ignore'});
 let ready=false;for(let i=0;i<40;i++){await pause(200);try{ready=(await fetch('http://127.0.0.1:18119/api/v2/ready')).ok;if(ready)break;}catch{}}
 if(!ready)throw Error('Startup readiness failed');console.log('PASS actual API startup with PostgreSQL and Redis');
 cache.kill('SIGTERM');await pause(700);if((await fetch('http://127.0.0.1:18119/api/v2/ready')).status!==503)throw Error('Redis outage readiness failed');console.log('PASS actual Redis outage readiness 503');
 const exited=new Promise(resolve=>api.once('exit',resolve));api.kill('SIGTERM');if(await Promise.race([exited,pause(12000).then(()=>-1)])!==0)throw Error('Graceful SIGTERM failed');console.log('PASS clean SIGTERM exit');
 }finally{cache.kill('SIGTERM');api?.kill('SIGTERM');}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
