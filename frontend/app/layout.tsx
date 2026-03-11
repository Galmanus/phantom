import type { Metadata } from 'next'
import { syne, jetbrainsMono } from './fonts'
import { AmbientBackground } from '@/components/ui/AmbientBackground'
import { Nav } from '@/components/layout/Nav'
import { Footer } from '@/components/layout/Footer'
import { StarknetProvider } from './providers/StarknetProvider'
import { WalletSyncMount } from '@/components/layout/WalletSyncMount'
import { WrongNetworkBanner } from '@/components/wallet/WrongNetworkBanner'
import './globals.css'

export const metadata: Metadata = {
  title: 'PHANTOM — ZK Private Execution Layer for BTCFi',
  description: 'The first ZK private execution layer purpose-built for Bitcoin assets on Starknet. Shield your positions, execute private swaps, earn shielded yield.',
  keywords: ['starknet', 'zk-proof', 'privacy', 'bitcoin', 'defi', 'btcfi'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${syne.variable} ${jetbrainsMono.variable}`}>
      <body className="font-syne antialiased bg-[--void] text-[--text] min-h-screen flex flex-col">
        <StarknetProvider>
          <WalletSyncMount />
          <AmbientBackground />
          <WrongNetworkBanner />
          <Nav />
          <main className="flex-1 pt-16">
            {children}
          </main>
          <Footer />
        </StarknetProvider>
      </body>
    </html>
  )
}
