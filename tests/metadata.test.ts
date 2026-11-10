import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import type { IconEntry } from '../src/types'

const root = join(__dirname, '..')
const entries: IconEntry[] = JSON.parse(
  readFileSync(join(root, 'metadata/icons.json'), 'utf8'),
)

function svgFiles(): string[] {
  const out: string[] = []
  const walk = (dir: string) => {
    for (const d of readdirSync(join(root, dir), { withFileTypes: true })) {
      const rel = `${dir}/${d.name}`
      if (d.isDirectory()) walk(rel)
      else if (d.name.endsWith('.svg')) out.push(rel)
    }
  }
  walk('icons')
  return out
}

describe('metadata', () => {
  it('every icon file has exactly one metadata entry and vice versa', () => {
    const files = svgFiles().sort()
    const declared = entries.map((e) => e.file).sort()
    expect(new Set(declared).size).toBe(declared.length)
    expect(declared).toEqual(files)
  })

  it('counts', () => {
    expect(entries.filter((e) => e.set === 'species')).toHaveLength(19)
    expect(entries.filter((e) => e.set === 'views')).toHaveLength(41)
  })

  it('slugs are unique kebab-case', () => {
    const slugs = entries.map((e) => e.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
  })

  it('views carry a view and a matching slug', () => {
    for (const e of entries) {
      if (e.set === 'views') {
        expect(e.view).toBeDefined()
        expect(e.slug).toBe(`${e.species}-${e.view}`)
      } else {
        expect(e.view).toBeUndefined()
      }
    }
  })

  it('names and tags are filled in both languages', () => {
    for (const e of entries) {
      expect(e.name.en.length).toBeGreaterThan(0)
      expect(e.name.fr.length).toBeGreaterThan(0)
      expect(e.tags.en).toContain('lab animal')
      expect(e.tags.fr).toContain('animal de laboratoire')
    }
  })

  it('French names keep their accents', () => {
    expect(entries.find((e) => e.slug === 'goat')?.name.fr).toBe('Chèvre')
    expect(entries.find((e) => e.slug === 'zebrafish')?.name.fr).toBe('Poisson-zèbre')
  })
})
