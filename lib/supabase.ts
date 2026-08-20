import { randomUUID } from 'crypto';
import type { Database } from './types';

const projectUrl=()=>process.env.SUPABASE_URL?.replace(/\/$/,'');
const serviceKey=()=>process.env.SUPABASE_SERVICE_ROLE_KEY;
export const storageBucket=()=>process.env.SUPABASE_STORAGE_BUCKET||'cms-assets';

export function hasSupabaseConfig(){return Boolean(projectUrl()&&serviceKey())}

function config(){
 const url=projectUrl(),key=serviceKey();
 if(!url||!key)throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
 return {url,key};
}

async function request<T>(path:string,init:RequestInit={}){
 const {url,key}=config();
 const headers=new Headers(init.headers);headers.set('apikey',key);headers.set('Authorization',`Bearer ${key}`);
 const response=await fetch(`${url}${path}`,{...init,headers,cache:'no-store'});
 if(!response.ok)throw new Error(`Supabase request failed (${response.status}): ${await response.text()}`);
 if(response.status===204)return undefined as T;
 return await response.json() as T;
}

type CategoryRow={id:string;name:string;sort_order:number};
type ProjectRow={id:string;title:string;subtitle:string;category_id:string;eyebrow:string;video_url:string;published:boolean;created_at:string};
type ImageRow={id:string;project_id:string;url:string;alt:string;sort_order:number};
type HotspotRow={id:string;image_id:string;x:number;y:number;size:number;color:string;name:string;brand:string;price:string;description:string;purchase_url:string};
type SettingsRow={site_name:string;logo_url:string;favicon_url:string;hero_title:string;hero_description:string;seo_title:string;seo_description:string;og_image:string;footer_text:string;service_status:'live'|'maintenance'};

export async function readSupabaseDb():Promise<Database>{
 const [categories,projects,images,hotspots,settingsRows]=await Promise.all([
  request<CategoryRow[]>('/rest/v1/categories?select=*&order=sort_order.asc'),
  request<ProjectRow[]>('/rest/v1/projects?select=*&order=created_at.desc'),
  request<ImageRow[]>('/rest/v1/project_images?select=*&order=sort_order.asc'),
  request<HotspotRow[]>('/rest/v1/hotspots?select=*'),
  request<SettingsRow[]>('/rest/v1/site_settings?select=*&id=eq.singleton&limit=1')
 ]);
 const settings=settingsRows[0];
 if(!settings)throw new Error('Supabase CMS schema is not initialized. Run the included migration first.');
 return {
  categories:categories.map(row=>({id:row.id,name:row.name,order:row.sort_order})),
  projects:projects.map(row=>({id:row.id,title:row.title,subtitle:row.subtitle,categoryId:row.category_id,eyebrow:row.eyebrow,videoUrl:row.video_url,published:row.published,createdAt:row.created_at,images:images.filter(image=>image.project_id===row.id).map(image=>({id:image.id,url:image.url,alt:image.alt,order:image.sort_order,hotspots:hotspots.filter(spot=>spot.image_id===image.id).map(spot=>({id:spot.id,x:spot.x,y:spot.y,size:spot.size,color:spot.color,name:spot.name,brand:spot.brand,price:spot.price,description:spot.description,url:spot.purchase_url}))}))})),
  settings:{siteName:settings.site_name,logoUrl:settings.logo_url,faviconUrl:settings.favicon_url,heroTitle:settings.hero_title,heroDescription:settings.hero_description,seoTitle:settings.seo_title,seoDescription:settings.seo_description,ogImage:settings.og_image,footerText:settings.footer_text,serviceStatus:settings.service_status,adminId:process.env.ADMIN_ID||'admin',adminPasswordHash:''}
 };
}

export async function writeSupabaseDb(database:Database){
 await request('/rest/v1/rpc/cms_replace',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({p_payload:database})});
 return database;
}

export async function uploadSupabaseAsset(file:File){
 const {url,key}=config();
 const extension=(file.name.split('.').pop()||'bin').toLowerCase().replace(/[^a-z0-9]/g,'');
 const objectPath=`${new Date().toISOString().slice(0,10)}/${randomUUID()}.${extension}`;
 const response=await fetch(`${url}/storage/v1/object/${storageBucket()}/${objectPath}`,{method:'POST',headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':file.type,'Cache-Control':'31536000','x-upsert':'false'},body:Buffer.from(await file.arrayBuffer())});
 if(!response.ok)throw new Error(`Supabase upload failed (${response.status}): ${await response.text()}`);
 return `${url}/storage/v1/object/public/${storageBucket()}/${objectPath}`;
}

export function assetPathFromUrl(assetUrl:string){
 const {url}=config();
 const prefix=`${url}/storage/v1/object/public/${storageBucket()}/`;
 return assetUrl.startsWith(prefix)?decodeURIComponent(assetUrl.slice(prefix.length)):null;
}

export async function deleteSupabaseAssets(assetUrls:string[]){
 const paths=assetUrls.map(assetPathFromUrl).filter((path):path is string=>Boolean(path));
 if(!paths.length)return;
 await request(`/storage/v1/object/${storageBucket()}`,{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({prefixes:paths})});
}
