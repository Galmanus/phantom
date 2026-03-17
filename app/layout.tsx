import type { Metadata } from 'next'

import { syne, dmSans, jetbrainsMono } from './fonts'
import './globals.css'
import { Nav } from '@/components/layout/Nav'
import { Footer } from '@/components/layout/Footer'
import { Providers } from './Providers'
import { WalletSyncMount } from '@/components/layout/WalletSyncMount'
import { WrongNetworkBanner } from '@/components/wallet/WrongNetworkBanner'

export const metadata: Metadata = {
  title: 'MIDAS | Private BTC Yield',
  description: 'Shield your Bitcoin with zero-knowledge proofs. The first ZK private execution layer for BTCFi on Starknet.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${syne.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-void text-parchment antialiased">
        <Providers>
          <WalletSyncMount />
          <WrongNetworkBanner />
          <Nav />
          <main className="min-h-screen">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}
