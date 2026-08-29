import type { Locale } from '@sufra/shared/schemas'
import Link from 'next/link'

export function Brand({ locale }: { locale: Locale }) {
  return (
    <Link className="flex items-center gap-3" href={`/${locale}`} aria-label="Sufra home">
      <span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--wine)] text-lg text-white">
        ს
      </span>
      <span>
        <span className="display-face block text-xl leading-none">სუფრა</span>
        <span className="text-[0.65rem] font-bold tracking-[0.22em] text-[var(--muted)] uppercase">
          Sufra
        </span>
      </span>
    </Link>
  )
}
