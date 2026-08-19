import { NextResponse } from 'next/server';import { readDb } from '@/lib/store';
export const dynamic='force-dynamic';
export async function GET(){const db=await readDb();return NextResponse.json({categories:db.categories.sort((a,b)=>a.order-b.order),projects:db.projects.filter(p=>p.published),settings:{...db.settings,adminId:undefined,adminPasswordHash:undefined}},{headers:{'Cache-Control':'no-store'}})}
