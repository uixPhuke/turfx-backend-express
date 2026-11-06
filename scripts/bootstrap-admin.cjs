// Explicit operator command. Grants a role only to an existing verified account.
require('dotenv/config');
const {PrismaClient}=require('@prisma/client');
const db=new PrismaClient();
(async()=>{
 const email=process.env.PLAYZA_ADMIN_EMAIL?.trim().toLowerCase();
 if(!email||!email.includes('@'))throw Error('Set PLAYZA_ADMIN_EMAIL to the existing operator account');
 await db.$transaction(async tx=>{
  const user=await tx.user.findUnique({where:{email}});
  if(!user||!user.isVerified||user.isBlocked||user.deletedAt)throw Error('An active verified operator account is required');
  await tx.userRole.upsert({where:{userId_role:{userId:user.id,role:'SUPER_ADMIN'}},create:{userId:user.id,role:'SUPER_ADMIN'},update:{}});
  await tx.auditLog.create({data:{actorId:user.id,action:'operator.bootstrap',entityType:'User',entityId:user.id,metadata:{source:'explicit_operator_command'}}});
 });
 console.log('Administrator role configured for the verified operator account');
})().catch(e=>{console.error(e.message);process.exitCode=1;}).finally(()=>db.$disconnect());
