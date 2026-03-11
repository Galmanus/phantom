import type { Metadata } from 'next'
import { syne, dmSans, jetbrainsMono } from './fonts'
import './globals.css'
import { Nav } from '../components/layout/Nav'
import { AmbientBackground } from '../components/ui/AmbientBackground'
import { Footer } from '../components/layout/Footer'

export const metadata: Metadata = {
  title: 'PHANTOM | ZK Private Execution Layer for BTCFi',
  description: 'Shield your Bitcoin with zero-knowledge proofs. The first ZK private execution layer for BTCFi on Starknet. Swap, earn yield, and maintain complete privacy.',
  keywords: ['ZK', 'privacy', 'Bitcoin', 'Starknet', 'DeFi', 'BTCFi', 'zero-knowledge'],
  authors: [{ name: 'PHANTOM Protocol' }],
  openGraph: {
    title: 'PHANTOM | ZK Private Execution Layer for BTCFi',
    description: 'Shield your Bitcoin with zero-knowledge proofs. The first ZK private execution layer for BTCFi.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PHANTOM | ZK Private Execution Layer for BTCFi',
    description: 'Shield your Bitcoin with zero-knowledge proofs.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${syne.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-void text-parchment antialiased">
        <AmbientBackground />
        <Nav />
        <main className="min-h-screen">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}
