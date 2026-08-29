import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const migrationDirectory = join(root, 'supabase', 'migrations')
const migrationFiles = readdirSync(migrationDirectory)
  .filter((file) => file.endsWith('.sql'))
  .sort()
const migrations = migrationFiles
  .map((file) => readFileSync(join(migrationDirectory, file), 'utf8'))
  .join('\n')
const rlsMigration = readFileSync(join(migrationDirectory, '20260829175047_rls_grants.sql'), 'utf8')

const publicTables = new Set(
  [...migrations.matchAll(/create table public\.([a-z_]+)/g)].map((match) => match[1]),
)
const rlsArray = rlsMigration.match(/foreach table_name in array array\[([\s\S]*?)\]\s*loop/)?.[1]
if (!rlsArray) throw new Error('Could not locate the RLS table inventory.')
const rlsTables = new Set([...rlsArray.matchAll(/'([a-z_]+)'/g)].map((match) => match[1]))
const missingRls = [...publicTables].filter((table) => !rlsTables.has(table))
const unknownRls = [...rlsTables].filter((table) => !publicTables.has(table))

const failures = []
if (missingRls.length) failures.push(`Tables missing RLS inventory: ${missingRls.join(', ')}`)
if (unknownRls.length) failures.push(`Unknown tables in RLS inventory: ${unknownRls.join(', ')}`)
if (/auth\.role\s*\(/.test(migrations)) failures.push('auth.role() is not allowed in policies.')
if (!migrations.includes('force row level security'))
  failures.push('FORCE ROW LEVEL SECURITY is missing.')
if (!migrations.includes('revoke all on all tables in schema public from anon, authenticated')) {
  failures.push('The explicit public-table privilege reset is missing.')
}
if (!migrations.includes("set search_path = ''")) {
  failures.push('Locked search_path declarations are missing from database functions.')
}

for (const directory of ['apps/web', 'apps/mobile']) {
  const queue = [join(root, directory)]
  while (queue.length) {
    const current = queue.pop()
    if (!current) continue
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      if (['node_modules', '.next', 'dist', '.expo'].includes(entry.name)) continue
      const path = join(current, entry.name)
      if (entry.isDirectory()) queue.push(path)
      else if (/\.(?:ts|tsx|js|jsx|json)$/.test(entry.name)) {
        const source = readFileSync(path, 'utf8')
        if (/SUPABASE_(?:SERVICE_ROLE|SECRET)_KEY/.test(source)) {
          failures.push(`Privileged Supabase key reference found in client code: ${path}`)
        }
      }
    }
  }
}

if (failures.length) {
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exitCode = 1
} else {
  console.log(
    `Migration security audit passed: ${publicTables.size} public tables are inventoried for forced RLS; no privileged key references were found in clients.`,
  )
}
