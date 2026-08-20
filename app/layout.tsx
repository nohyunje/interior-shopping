import './globals.css';
import type { Metadata } from 'next';
import { readDb } from '@/lib/store';

export async function generateMetadata():Promise<Metadata>{
 const fallback={seoTitle:'MORUM | 공간을 쇼핑하다',seoDescription:'공간을 둘러보고 마음에 드는 가구를 바로 만나보세요.',faviconUrl:'',ogImage:'/interior-living.png'};
 // Vercel also renders its internal not-found page during the build. Metadata
 // must not make that build depend on an external database being reachable.
 const settings=await readDb().then(db=>db.settings).catch(()=>fallback);
 return {metadataBase:new URL(process.env.NEXT_PUBLIC_SITE_URL||'http://localhost:3000'),title:settings.seoTitle,description:settings.seoDescription,icons:settings.faviconUrl?{icon:settings.faviconUrl}:undefined,openGraph:{title:settings.seoTitle,description:settings.seoDescription,images:settings.ogImage?[settings.ogImage]:[]}}
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="ko"><body>{children}</body></html>;
}
