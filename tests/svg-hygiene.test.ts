import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
// @ts-expect-error plain ESM script without type declarations
import { optimizeSvg } from '../scripts/optimize.mjs'

const root = join(__dirname, '..')
const sets = [
  { name: 'species', maxBytes: 8 * 1024 },
  { name: 'views', maxBytes: 450 * 1024 },
]

const ALLOWED_PAINT = new Set(['currentColor', 'none'])

describe.each(sets)('$name icons', ({ name, maxBytes }) => {
  const dir = join(root, 'icons', name)
  const files = readdirSync(dir).filter((f) => f.endsWith('.svg'))

  it('has icons', () => {
    expect(files.length).toBeGreaterThan(0)
  })

  it.each(files)('%s is clean', (file) => {
    const path = join(dir, file)
    const svg = readFileSync(path, 'utf8')
    const rootTag = svg.match(/<svg\b[^>]*>/)?.[0] ?? ''

    expect(svg).not.toContain('<!--')
    expect(svg).not.toContain('<metadata')
    expect(svg).not.toContain('<!DOCTYPE')
    expect(svg).not.toContain('<?xml')
    // bodies are injected with dangerouslySetInnerHTML, so no active or external content
    expect(svg).not.toMatch(/<style|<script|\sstyle=|href/i)
    expect(rootTag).not.toMatch(/\s(width|height)=/)
    expect(rootTag).toMatch(/\sviewBox="/)
    expect(rootTag).toContain('fill="currentColor"')
    if (name === 'species') expect(rootTag).toContain('viewBox="0 0 64 64"')

    for (const m of svg.matchAll(/\s(?:fill|stroke)="([^"]*)"/g)) {
      expect(ALLOWED_PAINT.has(m[1])).toBe(true)
    }
    expect(statSync(path).size).toBeLessThan(maxBytes)
  })
})

describe('optimize', () => {
  it('is idempotent', () => {
    const once = readFileSync(join(root, 'icons/species/mouse.svg'), 'utf8')
    expect(optimizeSvg(once)).toBe(once)
  })

  it.each(sets.flatMap(({ name }) => readdirSync(join(root, 'icons', name)).map((f) => join('icons', name, f))))(
    'leaves %s unchanged',
    (rel) => {
      const svg = readFileSync(join(root, rel), 'utf8')
      expect(optimizeSvg(svg)).toBe(svg)
    },
  )

  it('is idempotent on a raw source', () => {
    const raw = `<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10"><!-- c --><g fill="currentColor"><path d="M1 1h8v8H1z"/></g></svg>`
    const out = optimizeSvg(raw)
    expect(out).not.toContain('width=')
    expect(optimizeSvg(out)).toBe(out)
  })
})
