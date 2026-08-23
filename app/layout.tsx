import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'FoodOrder — Pesan Makanan Favoritmu',
  description: 'Aplikasi pemesanan makanan sederhana yang cepat, jelas, dan mudah digunakan.',
  icons: {
    icon: '/foodorder-icon.svg',
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
