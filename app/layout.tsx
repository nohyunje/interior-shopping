import './globals.css';
import type { Metadata } from 'next';
import { readDb } from '@/lib/store';

export async function generateMetadata():Promise<Metadata>{const {settings}=await readDb();return {metadataBase:new URL(process.env.NEXT_PUBLIC_SITE_URL||'http://localhost:3000'),title:settings.seoTitle,description:settings.seoDescription,icons:settings.faviconUrl?{icon:settings.faviconUrl}:undefined,openGraph:{title:settings.seoTitle,description:settings.seoDescription,images:settings.ogImage?[settings.ogImage]:[]}}}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="ko"><body>{children}</body></html>;
}
