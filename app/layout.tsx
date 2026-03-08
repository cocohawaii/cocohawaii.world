import type { Metadata } from 'next';
import './globals.css';
import Layout from '@/components/Layout';
import PageViewTracker from '@/components/PageViewTracker';
import { AuthProvider } from '@/components/AuthProvider';

export const metadata: Metadata = {
  title: 'COCO HAWAII - Hand-Designed Hats',
  description: 'Discover the finest Suede Hats embellished with wild art, jewelry & exotic accessories to make you free your spirit and glow anywhere you go.',
  keywords: ['hand-designed hats', 'custom hats', 'art hats', 'suede hats', 'fashion accessories', 'Valeria Velasquez', 'COCO HAWAII'],
  authors: [{ name: 'COCO HAWAII' }],
  creator: 'Valeria Velasquez',
  publisher: 'COCO HAWAII',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://cocohawaii-website.vercel.app',
    siteName: 'COCO HAWAII',
    title: 'COCO HAWAII - Hand-Designed Hats',
    description: 'Discover the finest Suede Hats embellished with wild art, jewelry & exotic accessories to make you free your spirit and glow anywhere you go.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'COCO HAWAII - Hand-Designed Hats',
    description: 'Discover the finest Suede Hats embellished with wild art, jewelry & exotic accessories.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  metadataBase: new URL('https://cocohawaii-website.vercel.app'),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <PageViewTracker />
          <Layout>{children}</Layout>
        </AuthProvider>
      </body>
    </html>
  );
}
