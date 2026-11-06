const fs=require('node:fs');
const dotenv=require('dotenv');
const source=process.argv[2];const env=source?dotenv.parse(fs.readFileSync(source)):process.env;
const required=['DATABASE_URL','REDIS_URL','JWT_SECRET','REFRESH_TOKEN_SECRET','OTP_SECRET','EMAIL_USER','EMAIL_PASS','RAZORPAY_KEY_ID','RAZORPAY_KEY_SECRET','RAZORPAY_WEBHOOK_SECRET','CLOUDINARY_CLOUD_NAME','CLOUDINARY_API_KEY','CLOUDINARY_API_SECRET','ALLOWED_ORIGINS'];
const mode=env.APP_ENV;
const problems=required.filter(key=>!env[key]?.trim()).map(key=>`Missing ${key}`);
for(const key of ['JWT_SECRET','REFRESH_TOKEN_SECRET','OTP_SECRET'])if(env[key]&&env[key].length<32)problems.push(`${key} must have at least 32 characters`);
if(new Set(['JWT_SECRET','REFRESH_TOKEN_SECRET','OTP_SECRET'].map(key=>env[key]).filter(Boolean)).size<3)problems.push('Authentication secrets must be distinct');
for(const origin of (env.ALLOWED_ORIGINS||'').split(',').filter(Boolean)){try{const url=new URL(origin.trim());if(url.protocol!=='https:')problems.push('Production origins must use HTTPS');}catch{problems.push('Invalid allowed origin');}}
for(const key of ['BOOKING_TAX_BPS','BOOKING_FEE_MINOR'])if(env[key]!==undefined&&(!/^\d+$/.test(env[key])||(key==='BOOKING_TAX_BPS'&&Number(env[key])>10000)))problems.push(`Invalid ${key}`);
if(!['staging','production'].includes(mode))problems.push('APP_ENV must be staging or production');
if(env.RAZORPAY_KEY_ID&&!env.RAZORPAY_KEY_ID.startsWith(mode==='production'?'rzp_live_':'rzp_test_'))problems.push('Razorpay key mode mismatch');
for(const [key, protocols] of [['DATABASE_URL',['postgres:','postgresql:']],['REDIS_URL',['redis:','rediss:']]]) {try{if(!protocols.includes(new URL(env[key]).protocol))problems.push(`Invalid ${key} protocol`);}catch{problems.push(`Invalid ${key}`);}}
if(problems.length){for(const problem of problems)console.error(problem);process.exitCode=1;}else console.log('Required backend release configuration is present; external provider verification remains a separate gate.');
