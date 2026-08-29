'use client'

import { useState } from 'react'

import { setMockGroceryCheckedAction } from '@/app/mock-actions'
import { isMockMode } from '@/lib/data-mode'
import { createClient } from '@/lib/supabase/client'

export function GroceryCheckbox({ id, initialChecked }: { id: string; initialChecked: boolean }) {
  const [checked, setChecked] = useState(initialChecked)
  const [saving, setSaving] = useState(false)

  async function update(nextChecked: boolean) {
    setChecked(nextChecked)
    setSaving(true)
    try {
      if (isMockMode()) {
        await setMockGroceryCheckedAction(id, nextChecked)
      } else {
        const result = await createClient()
          .from('grocery_list_items')
          .update({ is_checked: nextChecked })
          .eq('id', id)
        if (result.error) throw result.error
      }
    } catch {
      setChecked(!nextChecked)
    }
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
