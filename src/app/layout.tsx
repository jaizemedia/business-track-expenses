import type { Metadata } from "next";
import { GoogleAnalytics } from '@next/third-parties/google';
import { Analytics } from "@vercel/analytics/next"
import { Source_Sans_3, Manrope } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next"

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { siteDetails } from '@/data/siteDetails';

import "./globals.css";

const manrope = Manrope({ subsets: ['latin'] });
const sourceSans = Source_Sans_3({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: siteDetails.metadata.title,
  description: siteDetails.metadata.description,
  openGraph: {
    title: siteDetails.metadata.title,
    description: siteDetails.metadata.description,
    url: siteDetails.siteUrl,
    type: 'website',
    images: [
      {
        url: '/images/social-preview.png', // Replace with your image path
        width: 1200,
        height: 675,
        alt: siteDetails.siteName,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteDetails.metadata.title,
    description: siteDetails.metadata.description,
    images: ['/images/social-preview.png'], // Replace with your image path
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${manrope.className} ${sourceSans.className} antialiased`}
      >
        {siteDetails.googleAnalyticsId && <GoogleAnalytics gaId={siteDetails.googleAnalyticsId} />}
        <Header />
        <main>
          {children}
        </main>
        <Footer />
        <Analytics />
        <SpeedInsights/>
      </body>
    </html>
  );
}
