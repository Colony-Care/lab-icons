import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
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
    // icons/species/ keeps the original file next to icons/outline/ for 0.1 and 0.2 compatibility
    const declared = [...new Set(entries.flatMap((e) => [e.file, ...Object.values(e.styles)]))].sort()
    expect(declared).toEqual(files)
  })

  it('counts', () => {
    expect(entries.filter((e) => e.set === 'species')).toHaveLength(19)
    expect(entries.filter((e) => e.set === 'views')).toHaveLength(43)
    expect(entries.filter((e) => e.set === 'lab')).toHaveLength(44)
    expect(entries).toHaveLength(106)
  })

  it('lab entries carry a category and all four styles pointing to existing files', () => {
    const cats = ['organisms', 'vivarium', 'bench', 'instruments', 'biology']
    for (const e of entries.filter((x) => x.set === 'lab')) {
      expect(cats).toContain(e.category)
      expect(Object.keys(e.styles).sort()).toEqual(['duotone', 'inverse', 'outline', 'solid'])
      expect(e.file).toBe(e.styles.outline)
      for (const style of ['outline', 'solid', 'duotone', 'inverse'] as const) {
        expect(e.styles[style]).toBe(`icons/${style}/${e.slug}.svg`)
      }
    }
  })

  it('species entries carry all four styles and keep their original file', () => {
    for (const e of entries.filter((x) => x.set === 'species')) {
      expect(e.file).toBe(`icons/species/${e.slug}.svg`)
      expect(e.styles).toEqual({
        outline: `icons/outline/${e.slug}.svg`,
        solid: `icons/solid/${e.slug}.svg`,
        duotone: `icons/duotone/${e.slug}.svg`,
        inverse: `icons/inverse/${e.slug}.svg`,
      })
      expect(readFileSync(join(root, e.styles.outline), 'utf8')).toBe(readFileSync(join(root, e.file), 'utf8'))
    }
  })

  it('every styles path exists and views only have styles.outline', () => {
    for (const e of entries) {
      expect(e.styles.outline).toBeDefined()
      for (const p of Object.values(e.styles)) expect(existsSync(join(root, p))).toBe(true)
      if (e.set === 'views') expect(e.styles).toEqual({ outline: e.file })
    }
    const mouse = entries.find((e) => e.slug === 'mouse')
    expect(mouse?.file).toBe('icons/species/mouse.svg')
    expect(mouse?.category).toBeUndefined()
  })

  it('is sorted by set, then slug', () => {
    const order = ['lab', 'species', 'views']
    const keys = entries.map((e) => `${order.indexOf(e.set)}:${e.slug}`)
    expect(keys).toEqual([...keys].sort())
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

  it('species is present on species and views entries only', () => {
    for (const e of entries) {
      if (e.set === 'lab') expect('species' in e).toBe(false)
      else expect(typeof e.species).toBe('string')
    }
  })

  it('names and tags are filled in both languages', () => {
    for (const e of entries) {
      expect(e.name.en.length).toBeGreaterThan(0)
      expect(e.name.fr.length).toBeGreaterThan(0)
      if (e.set === 'lab') continue
      expect(e.tags.en).toContain('lab animal')
      expect(e.tags.fr).toContain('animal de laboratoire')
    }
  })

  it('French names keep their accents', () => {
    expect(entries.find((e) => e.slug === 'goat')?.name.fr).toBe('Chèvre')
    expect(entries.find((e) => e.slug === 'zebrafish')?.name.fr).toBe('Poisson-zèbre')
  })
})
