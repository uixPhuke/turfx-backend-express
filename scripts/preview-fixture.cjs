// Explicit local QA only. Never use these credentials or this startup in production.
const {PrismaClient}=require('@prisma/client'),bcrypt=require('bcryptjs');
const {createPostgresApp}=require('../.playza-build/postgres/app.js');
const url=process.env.PLAYZA_PREVIEW_DATABASE_URL;
if(!url||new URL(url).hostname!=='127.0.0.1'||new URL(url).port!=='55439'||new URL(url).pathname!=='/playza_preview')throw Error('Only the isolated playza_preview database on loopback:55439 is permitted');
const db=new PrismaClient({datasourceUrl:url});
(async()=>{
 const email='qa@playza.example.test',password='Local-QA-only-2026!';
 const user=await db.user.upsert({where:{email},create:{email,name:'PLAYZA QA',passwordHash:await bcrypt.hash(password,12),isVerified:true},update:{}});
 for(const role of ['CUSTOMER','OWNER','SUPER_ADMIN'])await db.userRole.upsert({where:{userId_role:{userId:user.id,role}},create:{userId:user.id,role},update:{}});
 const sport=await db.sport.upsert({where:{slug:'football'},create:{name:'Football',slug:'football'},update:{}});
 let venue=await db.venue.findFirst({where:{ownerId:user.id}});
 if(!venue){venue=await db.venue.create({data:{name:'Midtown Goal Park · QA fixture',description:'Local-only QA venue for checking discovery, booking and owner management. No real reservation or payment is accepted.',ownerId:user.id,address:{street:'480 W 34th St',city:'Manhattan',region:'New York'},latitude:40.7533,longitude:-73.9995,timezone:'America/New_York',status:'APPROVED'}});await db.venueMember.create({data:{userId:user.id,venueId:venue.id,role:'OWNER'}});const facility=await db.facility.create({data:{venueId:venue.id,name:'Football turf',amenities:{parking:true,floodlights:true}}});const resource=await db.resource.create({data:{facilityId:facility.id,name:'Main pitch',mode:'EXCLUSIVE',capacity:16,slotMinutes:60,currency:'USD'}});await db.resourceSport.create({data:{resourceId:resource.id,sportId:sport.id}});await db.operatingHour.createMany({data:Array.from({length:7},(_,weekday)=>({resourceId:resource.id,weekday,opensMinute:360,closesMinute:1320}))});await db.pricingRule.create({data:{resourceId:resource.id,amountMinor:2600,configuration:{}}});}
 const app=createPostgresApp(db,{accessSecret:'local-qa-access-secret-not-production-000',refreshSecret:'local-qa-refresh-secret-not-production-000',challengeSecret:'local-qa-challenge-secret-not-production-000',allowedOrigins:['http://localhost:8094'],deliverChallenge:async()=>{}});
 const server=app.listen(8001,'127.0.0.1',()=>console.log('Local-only QA API on 8001; synthetic login qa@playza.example.test / Local-QA-only-2026!; payment and external email disabled'));
 process.on('SIGTERM',()=>server.close(()=>void db.$disconnect()));process.on('SIGINT',()=>server.close(()=>void db.$disconnect()));
})().catch(async()=>{console.error('Local QA fixture startup failed');await db.$disconnect();process.exitCode=1;});
