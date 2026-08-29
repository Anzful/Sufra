import 'server-only'

import {
  createDefaultMockPersistedState,
  createMockSufraSnapshot,
  profileInputSchema,
  type MockPersistedState,
  type MockSufraSnapshot,
} from '@sufra/shared'
import { cookies } from 'next/headers'

const COOKIE_NAME = 'sufra-mock-state'

function decodeState(value: string | undefined): MockPersistedState {
  const fallback = createDefaultMockPersistedState()
  if (!value) return fallback
  try {
    const parsed = JSON.parse(decodeURIComponent(value)) as Partial<MockPersistedState>
    const profile = profileInputSchema.safeParse(parsed.profile)
    return {
      session:
        parsed.session?.user?.id && parsed.session.user.email
          ? {
              user: {
                id: String(parsed.session.user.id),
                email: String(parsed.session.user.email),
              },
            }
          : null,
      onboardingComplete: Boolean(parsed.onboardingComplete),
      profile: profile.success ? profile.data : fallback.profile,
      planReady: Boolean(parsed.planReady),
      planRevision:
        typeof parsed.planRevision === 'number' && Number.isInteger(parsed.planRevision)
          ? parsed.planRevision
          : 0,
      checkedGroceryItemIds: Array.isArray(parsed.checkedGroceryItemIds)
        ? parsed.checkedGroceryItemIds.filter((id): id is string => typeof id === 'string')
        : [],
    }
  } catch {
    return fallback
  }
}

export async function readMockState(): Promise<MockPersistedState> {
  const cookieStore = await cookies()
  return decodeState(cookieStore.get(COOKIE_NAME)?.value)
}

export async function readMockSnapshot(): Promise<MockSufraSnapshot> {
  return createMockSufraSnapshot(await readMockState())
}

export async function writeMockState(state: MockPersistedState): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, encodeURIComponent(JSON.stringify(state)), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })
}

export async function clearMockState(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}
