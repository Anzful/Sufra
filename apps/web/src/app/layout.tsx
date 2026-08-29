import type { Metadata } from 'next'
import { cookies } from 'next/headers'

import './globals.css'

export const metadata: Metadata = {
  title: { default: 'Sufra · სუფრა', template: '%s · Sufra' },
  description: 'Georgia-first weekly meal plans for your budget, nutrition, and kitchen.',
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies()
  const locale = cookieStore.get('sufra-locale')?.value === 'en' ? 'en' : 'ka'
  return (
    <html lang={locale}>
      <body>{children}</body>
    </html>
  )
}
