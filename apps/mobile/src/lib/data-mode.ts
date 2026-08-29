/** Mock mode is the zero-configuration default; opt into live services explicitly. */
export function isMockMode(): boolean {
  return process.env.EXPO_PUBLIC_DATA_MODE !== 'supabase'
}
