// Read-only collection/index inventory. Does not export documents or change either database.
require('dotenv').config({quiet:true});
const {MongoClient}=require('mongodb');
(async()=>{
 if(process.env.PLAYZA_MIGRATION_READ_ONLY!=='yes')throw Error('Set PLAYZA_MIGRATION_READ_ONLY=yes for an authorized source inventory');
 if(!process.env.MONGODB_URI||!process.env.DB_NAME)throw Error('Set source MongoDB configuration');
 const client=new MongoClient(process.env.MONGODB_URI,{serverSelectionTimeoutMS:10000,connectTimeoutMS:10000});
 try{await client.connect();const db=client.db(process.env.DB_NAME);const collections=await db.listCollections({},{nameOnly:true}).toArray();const output=[];
 for(const {name} of collections){if(name.startsWith('system.'))continue;const collection=db.collection(name);output.push({collection:name,count:await collection.countDocuments({},{maxTimeMS:10000}),indexes:(await collection.indexes()).map(({name,key,unique})=>({name,key,unique:!!unique}))});}
 console.log(JSON.stringify({capturedAt:new Date().toISOString(),readOnly:true,collections:output},null,2));
 }finally{await client.close();}
})().catch(()=>{console.error('Read-only migration inventory failed; verify source access. No document data was printed.');process.exitCode=1;});
