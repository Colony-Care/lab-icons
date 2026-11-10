import { describe, expect, it } from 'vitest'
import { icons } from '../src/index'
import type { IconCategory, IconEntry, IconSet, IconStyle, IconView } from '../src/index'

describe('public types', () => {
  it('exports every metadata type from the entry point', () => {
    const style: IconStyle = 'duotone'
    const category: IconCategory = 'bench'
    const set: IconSet = 'lab'
    const view: IconView = 'dorsal'
    const entry: IconEntry = icons.find((i) => i.set === 'lab')!
    expect([style, category, set, view]).toHaveLength(4)
    expect(entry.species).toBeUndefined()
  })
})
