import 'expo-sqlite/localStorage/install'

import {
  createDefaultMockPersistedState,
  createMockSufraSnapshot,
  mockGeneratePlan,
  mockSaveProfile,
  mockSignIn,
  mockSignUp,
  profileInputSchema,
  type MockPersistedState,
  type ProfileInput,
} from '@sufra/shared'

const STORAGE_KEY = 'sufra.mock.state.v1'
const listeners = new Set<() => void>()

function loadState(): MockPersistedState {
  const fallback = createDefaultMockPersistedState()
  try {
    const value = globalThis.localStorage?.getItem(STORAGE_KEY)
    if (!value) return fallback
    const parsed = JSON.parse(value) as Partial<MockPersistedState>
    const profile = profileInputSchema.safeParse(parsed.profile)
    return {
      ...fallback,
      ...parsed,
      session:
        parsed.session?.user?.id && parsed.session.user.email
          ? {
              user: {
                id: String(parsed.session.user.id),
                email: String(parsed.session.user.email),
              },
            }
          : null,
      profile: profile.success ? profile.data : fallback.profile,
      onboardingComplete: Boolean(parsed.onboardingComplete),
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

let state = loadState()

function commit(next: MockPersistedState) {
  state = next
  globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(next))
  listeners.forEach((listener) => listener())
}

export function getMockState(): MockPersistedState {
  return state
}

export function getMockSnapshot() {
  return createMockSufraSnapshot(state)
}

export function subscribeMockState(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function signInMock(email: string): void {
  commit(mockSignIn(state, email))
}

export function signUpMock(email: string): void {
  commit(mockSignUp(state, email))
}

export function signOutMock(): void {
  commit({ ...state, session: null })
}

export function saveProfileMock(profile: ProfileInput): void {
  commit(mockSaveProfile(state, profile))
}

export function generatePlanMock(): void {
  commit(mockGeneratePlan(state))
}

export function setGroceryCheckedMock(itemId: string, checked: boolean): void {
  const ids = new Set(state.checkedGroceryItemIds)
  if (checked) ids.add(itemId)
  else ids.delete(itemId)
  commit({ ...state, checkedGroceryItemIds: [...ids] })
}
