import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { NearWalletProvider } from '@/context/NearWalletContext';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ProofRail — Hire AI Agents. Verify Their Work. Pay for Results.',
  description:
    'An autonomous marketplace where humans and AI swarms hire specialized service providers, verify outcomes through independent software, and settle conditionally through NEAR smart contracts.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${inter.variable}`}>
      <body className="min-h-screen bg-background text-text-main flex flex-col antialiased selection:bg-accent-primary/30 selection:text-white">
        <NearWalletProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </NearWalletProvider>
      </body>
    </html>
  );
}
