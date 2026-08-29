import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const requestedNext = url.searchParams.get('next') ?? '/ka/onboarding'
  const next = /^\/(ka|en)\/(onboarding|plan)$/.test(requestedNext)
    ? requestedNext
    : '/ka/onboarding'

  if (code) {
    const supabase = await createClient()
    const result = await supabase.auth.exchangeCodeForSession(code)
    if (!result.error) return NextResponse.redirect(new URL(next, url.origin))
  }
  return NextResponse.redirect(new URL('/ka/sign-in?error=callback', url.origin))
}
