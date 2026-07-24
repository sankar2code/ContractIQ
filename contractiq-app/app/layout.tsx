import type { Metadata } from 'next'
import { Newsreader, Instrument_Sans, JetBrains_Mono } from 'next/font/google'
import { Providers } from './providers'
import './globals.css'

const newsreader = Newsreader({
  subsets: ['latin'],
  style: ['italic', 'normal'],
  weight: ['500', '600'],
  variable: '--font-newsreader',
})

const instrumentSans = Instrument_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-instrument-sans',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['500'],
  variable: '--font-jetbrains-mono',
})

export const metadata: Metadata = {
  title: 'ContractIQ — AI-assisted NDA & MSA review',
  description:
    'Upload a contract. See what it says, where, and how sure we are — in under 30 seconds.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${newsreader.variable} ${instrumentSans.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-sans bg-paper text-ink-900 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
