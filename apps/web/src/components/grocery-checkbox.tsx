'use client'

import { useState } from 'react'

import { createClient } from '@/lib/supabase/client'

export function GroceryCheckbox({ id, initialChecked }: { id: string; initialChecked: boolean }) {
  const [checked, setChecked] = useState(initialChecked)
  const [saving, setSaving] = useState(false)

  async function update(nextChecked: boolean) {
    setChecked(nextChecked)
    setSaving(true)
    const result = await createClient()
      .from('grocery_list_items')
      .update({ is_checked: nextChecked })
      .eq('id', id)
    if (result.error) setChecked(!nextChecked)
    setSaving(false)
  }

  return (
    <input
      aria-label="Mark grocery item complete"
      className="h-5 w-5 accent-[var(--wine)]"
      type="checkbox"
      checked={checked}
      disabled={saving}
      onChange={(event) => update(event.target.checked)}
    />
  )
}
