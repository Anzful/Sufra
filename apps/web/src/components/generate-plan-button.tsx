'use client'

import { createSufraApi, getWeekStartDate, type Locale, type SufraTransport } from '@sufra/shared'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { createClient } from '@/lib/supabase/client'

export function GeneratePlanButton({ locale }: { locale: Locale }) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')

  async function generate() {
    setPending(true)
    setMessage('')
    const api = createSufraApi(createClient() as unknown as SufraTransport)
    try {
      await api.generateWeeklyPlan({
        weekStartDate: getWeekStartDate(),
        locale,
        idempotencyKey: crypto.randomUUID(),
      })
    } catch {
      setMessage(
        locale === 'ka'
          ? 'გეგმის შექმნა ვერ მოხერხდა. გადაამოწმე პარამეტრები და ხელახლა სცადე.'
          : 'The plan could not be generated. Review your settings and try again.',
      )
      setPending(false)
      return
    }
    setMessage(locale === 'ka' ? 'გეგმა მზადაა.' : 'Your plan is ready.')
    router.refresh()
    setPending(false)
  }

  return (
    <div>
      <button className="primary-button" type="button" onClick={generate} disabled={pending}>
        {pending
          ? locale === 'ka'
            ? 'სუფრა იგეგმება…'
            : 'Planning your table…'
          : locale === 'ka'
            ? 'კვირის გეგმის შექმნა'
            : 'Generate weekly plan'}
      </button>
      {message ? (
        <p className="mt-3 max-w-lg text-sm text-[var(--muted)]" role="status">
          {message}
        </p>
      ) : null}
    </div>
  )
}
