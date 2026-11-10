import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import * as react from '../src/react/index'
import { MouseIcon, MicroscopeIcon } from '../src/react/index'
import { ZebrafishIcon } from '../src/react/index'
import icons from '../metadata/icons.json'

const pascal = (slug: string) =>
  slug.split('-').map((p) => p[0].toUpperCase() + p.slice(1)).join('') + 'Icon'
const speciesNames = icons.filter((i) => i.set === 'species').map((i) => pascal(i.slug))
const labNames = icons.filter((i) => i.set === 'lab').map((i) => pascal(i.slug))
const allNames = [...speciesNames, ...labNames]
const variants = ['outline', 'solid', 'duotone', 'inverse'] as const
const fixture = (n: string) => readFileSync(join(__dirname, 'fixtures', n), 'utf8')
const components = Object.entries(react).filter(([, v]) => typeof v === 'object' && v !== null) as [string, React.ComponentType][]

describe('react components', () => {
  it('exports one component per species and lab icon and none for views', () => {
    const names = components.map(([n]) => n)
    expect(speciesNames).toHaveLength(19)
    expect(labNames).toHaveLength(45)
    expect(new Set(allNames).size).toBe(64)
    expect([...names].sort()).toEqual([...allNames].sort())
    expect(Object.keys(react).sort()).toEqual([...allNames].sort())
  })

  it('species output is identical to 0.1.0', () => {
    expect(renderToStaticMarkup(<MouseIcon />)).toBe(fixture('mouse-0.1.0.html'))
    expect(renderToStaticMarkup(<ZebrafishIcon title="t" size={10} />)).toBe(fixture('zebrafish-titled-0.1.0.html'))
  })

  it('species ignore a variant prop and never put it in the DOM', () => {
    const html = renderToStaticMarkup(<MouseIcon {...({ variant: 'solid' } as any)} />)
    expect(html).toBe(fixture('mouse-0.1.0.html'))
    expect(html).not.toContain('variant')
  })

  it('lab icons default to outline root attributes', () => {
    const html = renderToStaticMarkup(<MicroscopeIcon />)
    expect(html).toContain('fill="none"')
    expect(html).toContain('stroke="currentColor"')
    expect(html).toContain('stroke-width="4"')
    expect(html).toContain('stroke-linecap="round"')
    expect(html).toContain('stroke-linejoin="round"')
    expect(html).not.toContain('variant')
    expect(html).toBe(renderToStaticMarkup(<MicroscopeIcon variant="outline" />))
  })

  it('solid and inverse use a filled root', () => {
    for (const v of ['solid', 'inverse'] as const) {
      const html = renderToStaticMarkup(<MicroscopeIcon variant={v} />)
      expect(html).toMatch(/^<svg[^>]* fill="currentColor"/)
      expect(html).not.toContain('stroke-width')
      expect(html).not.toContain('variant')
    }
  })

  it('duotone keeps the stroke root', () => {
    const html = renderToStaticMarkup(<MicroscopeIcon variant="duotone" />)
    expect(html).toContain('stroke-width="4"')
    expect(html).toContain('fill-opacity')
  })

  it('the four variants render different markup', () => {
    const out = variants.map((v) => renderToStaticMarkup(<MicroscopeIcon variant={v} />))
    expect(new Set(out).size).toBe(4)
  })

  it('an unknown variant falls back to outline', () => {
    const html = renderToStaticMarkup(<MicroscopeIcon {...({ variant: 'nope' } as any)} />)
    expect(html).toBe(renderToStaticMarkup(<MicroscopeIcon />))
  })

  it('consumer props still win over variant attributes', () => {
    const html = renderToStaticMarkup(<MicroscopeIcon strokeWidth={2} />)
    expect(html).toContain('stroke-width="2"')
    expect(html).not.toContain('stroke-width="4"')
  })

  it('defaults', () => {
    const html = renderToStaticMarkup(<MouseIcon />)
    expect(html).toContain('width="24"')
    expect(html).toContain('height="24"')
    expect(html).toContain('viewBox="0 0 64 64"')
    expect(html).toContain('fill="currentColor"')
    expect(html).toContain('aria-hidden="true"')
    expect(html).not.toContain('role=')
    expect(html).toContain('<path')
  })

  it('size', () => {
    const a = renderToStaticMarkup(<MouseIcon size={32} />)
    expect(a).toContain('width="32"')
    expect(a).toContain('height="32"')
    const b = renderToStaticMarkup(<MouseIcon size="1em" />)
    expect(b).toContain('width="1em"')
    expect(b).toContain('height="1em"')
  })

  it('title', () => {
    const html = renderToStaticMarkup(<MouseIcon title="Lab mouse" />)
    expect(html).toContain('role="img"')
    expect(html).toMatch(/<svg[^>]*><title>Lab mouse<\/title>/)
    expect(html).not.toContain('aria-hidden')
  })

  it('aria-label without title', () => {
    const html = renderToStaticMarkup(<MouseIcon aria-label="Mouse" />)
    expect(html).toContain('role="img"')
    expect(html).toContain('aria-label="Mouse"')
    expect(html).not.toContain('aria-hidden')
  })

  it('passthrough', () => {
    const html = renderToStaticMarkup(
      <MouseIcon className="x" style={{ color: 'red' }} data-testid="t" aria-hidden={false} />,
    )
    expect(html).toContain('class="x"')
    expect(html).toContain('style="color:red"')
    expect(html).toContain('data-testid="t"')
    expect(html).toContain('aria-hidden="false"')
  })

  it('server rendering', () => {
    for (const [, C] of components) {
      expect(() => renderToStaticMarkup(<C />)).not.toThrow()
    }
    for (const n of labNames) {
      const C = (react as any)[n]
      for (const v of variants) expect(() => renderToStaticMarkup(<C variant={v} />)).not.toThrow()
    }
    const dir = join(__dirname, '../src/react')
    const files = [join(dir, 'createIcon.tsx'), ...readdirSync(join(dir, 'generated')).map((f) => join(dir, 'generated', f))]
    for (const f of files) expect(readFileSync(f, 'utf8')).not.toContain('use client')
  })
})
