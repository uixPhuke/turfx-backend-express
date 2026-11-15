const fs=require('node:fs'),{spawnSync,execFileSync}=require('node:child_process'),crypto=require('node:crypto'),dotenv=require('dotenv');
const file='.env.docker';
if(!fs.existsSync(file)){
 let values;
 try{const current=JSON.parse(execFileSync('docker',['inspect','playza-staging-validation-api-1'],{encoding:'utf8'}))[0];values=Object.fromEntries(current.Config.Env.map(s=>{const i=s.indexOf('=');return[s.slice(0,i),s.slice(i+1)]}));values.POSTGRES_PASSWORD=decodeURIComponent(new URL(values.DATABASE_URL).password);}catch{values={POSTGRES_PASSWORD:crypto.randomBytes(32).toString('hex')};for(const k of ['JWT_SECRET','REFRESH_TOKEN_SECRET','OTP_SECRET'])values[k]=crypto.randomBytes(32).toString('hex');}
 const existing=fs.existsSync('.env')?dotenv.parse(fs.readFileSync('.env')):{};
 for(const key of ['EMAIL_USER','EMAIL_PASS','CLOUDINARY_CLOUD_NAME','CLOUDINARY_API_KEY','CLOUDINARY_API_SECRET','RAZORPAY_KEY_ID','RAZORPAY_KEY_SECRET'])if(existing[key])values[key]=existing[key];
 const keys=['POSTGRES_PASSWORD','JWT_SECRET','REFRESH_TOKEN_SECRET','OTP_SECRET','EMAIL_USER','EMAIL_PASS','CLOUDINARY_CLOUD_NAME','CLOUDINARY_API_KEY','CLOUDINARY_API_SECRET','RAZORPAY_KEY_ID','RAZORPAY_KEY_SECRET'];
 const selected=Object.fromEntries(keys.filter(k=>values[k]).map(k=>[k,values[k]]));if(selected.RAZORPAY_KEY_ID&&!selected.RAZORPAY_KEY_ID.startsWith('rzp_test_'))throw Error('Local stack requires Razorpay test keys');
 Object.assign(selected,{APP_ENV:'local',ALLOWED_ORIGINS:'http://localhost:8081,http://localhost:8094',RAZORPAY_WEBHOOK_SECRET:values.RAZORPAY_WEBHOOK_SECRET||crypto.randomBytes(32).toString('hex')});
 fs.writeFileSync(file,Object.entries(selected).map(([k,v])=>k+'='+JSON.stringify(v)).join('\n')+'\n',{mode:0o600});
}
const checked=dotenv.parse(fs.readFileSync(file));
if(checked.RAZORPAY_KEY_ID&&!checked.RAZORPAY_KEY_ID.startsWith("rzp_test_"))throw Error("Local stack refuses live Razorpay keys");
const env={...process.env,PLAYZA_ENV_FILE:file};const args=['compose','--project-name','playza-staging-validation','--env-file',file,'-f','compose.release.yaml','-f','compose.local.yaml',...(process.argv.slice(2).length?process.argv.slice(2):['up','--build','-d'])];
const result=spawnSync('docker',args,{env,stdio:'inherit'});process.exitCode=result.status??1;
