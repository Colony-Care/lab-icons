import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
// @ts-expect-error plain ESM script without type declarations
import { optimizeSvg } from '../scripts/optimize.mjs'

const root = join(__dirname, '..')
const STROKE_ROOT =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">'
const FILL_ROOT = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="currentColor">'
// maxBytes are set from the measured post-optimise sizes (see the task report)
const sets = [
  { name: 'species', maxBytes: 8 * 1024, lab: false },
  { name: 'views', maxBytes: 450 * 1024, lab: false },
  { name: 'outline', maxBytes: 4 * 1024, lab: true, rootTag: STROKE_ROOT },
  { name: 'solid', maxBytes: 16 * 1024, lab: true, rootTag: FILL_ROOT },
  { name: 'duotone', maxBytes: 4 * 1024, lab: true, rootTag: STROKE_ROOT },
  { name: 'inverse', maxBytes: 16 * 1024, lab: true, rootTag: FILL_ROOT },
]

const ALLOWED_PAINT = new Set(['currentColor', 'none'])

describe.each(sets)('$name icons', ({ name, maxBytes, lab, rootTag: expectedRoot }) => {
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
    if (expectedRoot) expect(rootTag).toBe(expectedRoot)
    else expect(rootTag).toContain('fill="currentColor"')
    expect(svg).not.toMatch(/<mask|\sid=/i)
    if (lab) expect(rootTag).toContain('viewBox="0 0 64 64"')
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
      expect(optimizeSvg(svg, rel.split('/')[1])).toBe(svg)
    },
  )

  it('is idempotent on a raw source', () => {
    const raw = `<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10"><!-- c --><g fill="currentColor"><path d="M1 1h8v8H1z"/></g></svg>`
    const out = optimizeSvg(raw)
    expect(out).not.toContain('width=')
    expect(optimizeSvg(out)).toBe(out)
  })
})
