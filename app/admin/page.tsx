import { isAdmin } from '@/lib/auth';import Login from './login';import Cms from './cms';
export const dynamic='force-dynamic';
export default async function AdminPage(){return await isAdmin()?<Cms/>:<Login/>}
