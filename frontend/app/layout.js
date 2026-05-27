import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], weight: ['300','400','500','600','700','800','900'] });

export const metadata = {
  title: 'AdPulse AI — AI-Powered Ad Intelligence',
  description: 'AdPulse AI analyzes your Meta and Google Ads daily using Gemini AI. Get smart daily & weekly reports, beautiful graphs, and actionable recommendations tailored to your business.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
