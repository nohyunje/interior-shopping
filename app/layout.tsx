import './globals.css';
import type { Metadata } from 'next';
import { readDb } from '@/lib/store';

const siteTitle='ROOM VIEW | 공간을 먼저 보고, 가구를 선택하다';
const siteDescription='인테리어 공간을 먼저 참고하고, 어울리는 가구와 제품을 찾아볼 수 있는 공간 큐레이션 페이지입니다.';

export async function generateMetadata():Promise<Metadata>{
 const fallback={faviconUrl:'',ogImage:'/interior-living.png'};
 // Vercel also renders its internal not-found page during the build. Metadata
 // must not make that build depend on an external database being reachable.
 const settings=await readDb().then(db=>db.settings).catch(()=>fallback);
 return {metadataBase:new URL(process.env.NEXT_PUBLIC_SITE_URL||'http://localhost:3000'),title:siteTitle,description:siteDescription,applicationName:'ROOM VIEW',manifest:'/manifest.webmanifest',icons:settings.faviconUrl?{icon:settings.faviconUrl}:undefined,openGraph:{title:siteTitle,description:siteDescription,images:settings.ogImage?[settings.ogImage]:[]},twitter:{card:'summary_large_image',title:siteTitle,description:siteDescription,images:settings.ogImage?[settings.ogImage]:[]}}
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="ko"><body>{children}</body></html>;
}
