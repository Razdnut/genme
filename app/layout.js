import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'GitHub README Generator',
  description: 'Generate premium READMEs for your GitHub repositories using AI.',
}

/**
 * Root layout wiring global styles, fonts, and metadata.
 */
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
