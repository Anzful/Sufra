import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { isMockMode } from '@/lib/data-mode'
import { updateSession } from '@/lib/supabase/proxy'

export function proxy(request: NextRequest) {
  if (isMockMode()) return NextResponse.next()
  return updateSession(request)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
