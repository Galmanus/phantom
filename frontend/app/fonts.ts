import { Syne, JetBrains_Mono } from 'next/font/google'

// Syne for display/headings - using Google Fonts as fallback
export const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
})

// JetBrains Mono for data/code
export const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
})
