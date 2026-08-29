'use server'

import { createDefaultMockPersistedState, mockSignIn, mockSignUp } from '@sufra/shared'
import { isLocale } from '@/lib/locale'
import { isMockMode } from '@/lib/data-mode'
import { clearMockState, readMockState, writeMockState } from '@/lib/mock-server'
import { createClient } from '@/lib/supabase/server'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'

export interface AuthActionState {
  status: 'idle' | 'error' | 'success'
  message: string
}

export async function authAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const requestedLocale = String(formData.get('locale') ?? 'ka')
  const locale = isLocale(requestedLocale) ? requestedLocale : 'ka'
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const intent = formData.get('intent') === 'signup' ? 'signup' : 'signin'

  if (!email || password.length < 8) {
    return {
      status: 'error',
      message:
        locale === 'ka'
          ? 'შეიყვანე ელფოსტა და მინიმუმ 8-ნიშნა პაროლი.'
          : 'Enter an email and a password of at least 8 characters.',
    }
  }

  if (isMockMode()) {
    const state = await readMockState()
    await writeMockState(
      intent === 'signup'
        ? mockSignUp(state, email)
        : mockSignIn(state ?? createDefaultMockPersistedState(), email),
    )
    redirect(intent === 'signup' ? `/${locale}/onboarding` : `/${locale}/plan`)
  }

  const supabase = await createClient()
  if (intent === 'signin') {
    const result = await supabase.auth.signInWithPassword({ email, password })
    if (result.error) {
      return {
        status: 'error',
        message:
          locale === 'ka' ? 'ელფოსტა ან პაროლი არასწორია.' : 'Email or password is incorrect.',
      }
    }

    const profileResult = await supabase.from('profiles').select('onboarding_completed_at').single()
    redirect(
      profileResult.data?.onboarding_completed_at ? `/${locale}/plan` : `/${locale}/onboarding`,
    )
  }

  const headerStore = await headers()
  const origin = headerStore.get('origin') ?? 'http://127.0.0.1:3000'
  const result = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { locale },
      emailRedirectTo: `${origin}/auth/callback?next=/${locale}/onboarding`,
    },
  })
  if (result.error) {
    return {
      status: 'error',
      message:
        locale === 'ka'
          ? 'ანგარიშის შექმნა ვერ მოხერხდა. სცადე სხვა ელფოსტა.'
          : 'Could not create the account. Try another email.',
    }
  }
  if (result.data.session) redirect(`/${locale}/onboarding`)
  return {
    status: 'success',
    message:
      locale === 'ka'
        ? 'შეამოწმე ელფოსტა ანგარიშის დასადასტურებლად.'
        : 'Check your email to confirm your account.',
  }
}

export async function signOutAction(formData: FormData) {
  const requestedLocale = String(formData.get('locale') ?? 'ka')
  const locale = isLocale(requestedLocale) ? requestedLocale : 'ka'
  if (isMockMode()) {
    await clearMockState()
    redirect(`/${locale}`)
  }
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect(`/${locale}`)
}

export async function rememberLocale(locale: 'ka' | 'en') {
  const cookieStore = await cookies()
  cookieStore.set('sufra-locale', locale, { sameSite: 'lax', path: '/', maxAge: 31_536_000 })
}
