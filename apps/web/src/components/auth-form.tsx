'use client'

import { translate, type Locale } from '@sufra/shared'
import { useActionState } from 'react'

import { authAction, type AuthActionState } from '@/app/auth-actions'
import { isMockMode } from '@/lib/data-mode'

const initialState: AuthActionState = { status: 'idle', message: '' }

export function AuthForm({ locale }: { locale: Locale }) {
  const [state, action, pending] = useActionState(authAction, initialState)
  const mockMode = isMockMode()
  return (
    <form action={action} className="space-y-4">
      {mockMode ? (
        <p className="rounded-xl bg-[var(--paper-deep)] px-3 py-2 text-xs leading-5 text-[var(--muted)]">
          {locale === 'ka'
            ? 'დემო რეჟიმი — მონაცემები შენს მოწყობილობაზე რჩება. ნებისმიერი 8+ სიმბოლოიანი პაროლი იმუშავებს.'
            : 'Demo mode — data stays on your device. Any password with 8+ characters works.'}
        </p>
      ) : null}
      <input name="locale" type="hidden" value={locale} />
      <label className="block text-sm font-semibold">
        {translate(locale, 'email')}
        <input
          className="field mt-1.5"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={mockMode ? 'demo@sufra.ge' : ''}
          required
        />
      </label>
      <label className="block text-sm font-semibold">
        {translate(locale, 'password')}
        <input
          className="field mt-1.5"
          name="password"
          type="password"
          minLength={8}
          autoComplete="current-password"
          defaultValue={mockMode ? 'sufra-demo' : ''}
          required
        />
      </label>
      {state.message ? (
        <p
          className={`rounded-xl px-3 py-2 text-sm ${
            state.status === 'error' ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'
          }`}
          role="status"
        >
          {state.message}
        </p>
      ) : null}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <button className="primary-button" name="intent" value="signin" disabled={pending}>
          {translate(locale, 'signIn')}
        </button>
        <button className="quiet-button" name="intent" value="signup" disabled={pending}>
          {translate(locale, 'signUp')}
        </button>
      </div>
    </form>
  )
}
