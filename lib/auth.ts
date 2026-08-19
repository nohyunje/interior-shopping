import { createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';
const COOKIE='morum_admin';
const secret=()=>process.env.SESSION_SECRET||'dev-only-change-session-secret';
export function createSession(){const expires=Date.now()+1000*60*60*24*14;const body=Buffer.from(JSON.stringify({role:'admin',expires})).toString('base64url');const sig=createHmac('sha256',secret()).update(body).digest('base64url');return `${body}.${sig}`}
export function verifySession(token?:string){if(!token)return false;try{const [body,sig]=token.split('.');const expected=createHmac('sha256',secret()).update(body).digest('base64url');if(!timingSafeEqual(Buffer.from(sig),Buffer.from(expected)))return false;const data=JSON.parse(Buffer.from(body,'base64url').toString());return data.role==='admin'&&data.expires>Date.now()}catch{return false}}
export async function isAdmin(){return verifySession((await cookies()).get(COOKIE)?.value)}
export const sessionCookie={name:COOKIE,options:{httpOnly:true,sameSite:'strict' as const,secure:process.env.NODE_ENV==='production',path:'/',maxAge:60*60*24*14}};
