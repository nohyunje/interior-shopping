import { promises as fs } from 'fs';
import path from 'path';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import type { Database } from './types';
import { hasSupabaseConfig,readSupabaseDb,writeSupabaseDb } from './supabase';

const dataDir=path.join(process.cwd(),'data');
const dataFile=path.join(dataDir,'cms.json');
const defaultImage='/interior-living.png';
const isVercel=process.env.VERCEL==='1';
export class StorageUnavailableError extends Error{constructor(){super('Persistent CMS storage is not configured for Vercel.');this.name='StorageUnavailableError'}}
export function hashPassword(value:string,salt=randomBytes(16).toString('hex')){return `${salt}:${scryptSync(value,salt,64).toString('hex')}`}
export function verifyPassword(value:string,stored:string){try{const [salt,key]=stored.split(':');return timingSafeEqual(Buffer.from(key,'hex'),scryptSync(value,salt,64))}catch{return false}}
const initial:Database={
 categories:['거실','주방','침실','홈오피스','다이닝','베란다','조명','소품'].map((name,order)=>({id:`cat-${order+1}`,name,order})),
 settings:{siteName:'ROOM VIEW',logoUrl:'',faviconUrl:'',heroTitle:'마음에 드는 공간을 둘러보고',heroDescription:'마음에 드는 가구를 바로 만나보세요.',seoTitle:'ROOM VIEW | 공간을 먼저 보고, 가구를 선택하다',seoDescription:'인테리어 공간을 먼저 참고하고, 어울리는 가구와 제품을 찾아볼 수 있는 공간 큐레이션 페이지입니다.',ogImage:defaultImage,footerText:'공간을 보고, 가구를 발견하는 새로운 방식',serviceStatus:'live',adminId:process.env.ADMIN_ID||'admin',adminPasswordHash:hashPassword(process.env.ADMIN_PASSWORD||'change-me-now')},
 projects:[{id:'project-1',title:'빛이 머무는 신혼집 거실',subtitle:'내추럴 우드와 부클레로 완성한 온화한 공간',categoryId:'cat-1',eyebrow:'WARM MINIMAL · 32평',videoUrl:'https://youtube.com',published:true,createdAt:new Date().toISOString(),images:[{id:'image-1',url:defaultImage,alt:'따뜻한 미니멀 거실',order:0,hotspots:[
  {id:'spot-1',x:52,y:66,size:32,color:'#21211f',name:'누아 모듈 소파 4인',brand:'FRITZ HANSEN',price:'3,890,000원',description:'부드러운 곡선과 깊은 좌방석의 모듈 소파',url:'https://ohou.se'},
  {id:'spot-2',x:40,y:78,size:32,color:'#b15b35',name:'월넛 로우 테이블',brand:'MENU',price:'1,240,000원',description:'묵직한 월넛 결이 살아 있는 낮은 테이블',url:'https://ohou.se'},
  {id:'spot-3',x:80,y:69,size:32,color:'#d87545',name:'카멜 레더 라운지 체어',brand:'HAY',price:'980,000원',description:'시간이 지날수록 멋스러운 천연 가죽 체어',url:'https://ohou.se'},
  {id:'spot-4',x:87,y:24,size:32,color:'#c99b63',name:'와시 페이퍼 펜던트',brand:'&TRADITION',price:'460,000원',description:'공간에 은은한 빛을 더하는 종이 조명',url:'https://ohou.se'}]}]},
 ...['고요한 호텔 감성 침실','오래 머무는 다이닝','작지만 깊이 있는 홈오피스','질감으로 채운 모던 주방','햇살 좋은 작은 베란다'].map((title,i)=>({id:`project-${i+2}`,title,subtitle:['하루의 끝을 위한 차분한 레이어','대화가 자연스럽게 이어지는 테이블','집중과 휴식 사이의 작은 서재','스테인리스와 오크의 선명한 균형','도심 속에 만든 초록빛 쉼표'][i],categoryId:`cat-${[3,5,4,2,6][i]}`,eyebrow:'CURATED SPACE',videoUrl:'https://youtube.com',published:true,createdAt:new Date().toISOString(),images:[{id:`image-${i+2}`,url:defaultImage,alt:title,order:0,hotspots:[]}]}))]
};
let queue=Promise.resolve();
const tempFile=dataFile+'.tmp';
const backupFile=dataFile+'.bak';
async function removeIfPresent(file:string){try{await fs.rm(file,{force:true})}catch{/* Windows may briefly lock a stale helper file; it is harmless. */}}
async function isValidDatabase(file:string){try{const parsed=JSON.parse(await fs.readFile(file,'utf8')) as Database;return Array.isArray(parsed.projects)&&Array.isArray(parsed.categories)&&Boolean(parsed.settings)}catch{return false}}
async function ensure(){
 await fs.mkdir(dataDir,{recursive:true});
 try{await fs.access(dataFile)}catch{await fs.writeFile(dataFile,JSON.stringify(initial,null,2),'utf8')}
 // Recover a valid failed save from the previous rename-based implementation.
 try{const [current,temp]=await Promise.all([fs.stat(dataFile),fs.stat(tempFile)]);if(temp.mtimeMs>=current.mtimeMs&&await isValidDatabase(tempFile)){await fs.copyFile(tempFile,dataFile);await removeIfPresent(tempFile)}}catch{/* No recovery file exists. */}
}
export async function readDb(){if(hasSupabaseConfig())return readSupabaseDb();if(isVercel)throw new StorageUnavailableError();await ensure();return JSON.parse(await fs.readFile(dataFile,'utf8')) as Database}
export async function writeDb(db:Database){
 if(hasSupabaseConfig())return writeSupabaseDb(db);
 if(isVercel)throw new StorageUnavailableError();
 // Serialize every CMS mutation so projects, images and hotspots share one safe path.
 // copyFile overwrites an existing destination on Windows, macOS and Linux without
 // relying on rename-over-existing semantics (the source of Windows EPERM errors).
 queue=queue.catch(()=>undefined).then(async()=>{
  await ensure();
  const json=JSON.stringify(db,null,2);
  JSON.parse(json);
  await fs.writeFile(tempFile,json,'utf8');
  if(!await isValidDatabase(tempFile))throw new Error('CMS temporary data verification failed.');
  let hasBackup=false;
  try{
   await fs.copyFile(dataFile,backupFile);hasBackup=true;
   await fs.copyFile(tempFile,dataFile);
   if(!await isValidDatabase(dataFile))throw new Error('CMS data verification failed after writing.');
  }catch(error){
   if(hasBackup)await fs.copyFile(backupFile,dataFile);
   throw error;
  }finally{
   await removeIfPresent(tempFile);
   await removeIfPresent(backupFile);
  }
 });
 await queue;
 return db;
}
