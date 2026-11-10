import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import * as react from '../src/react/index'
import { MouseIcon } from '../src/react/index'
import icons from '../metadata/icons.json'

const pascal = (slug: string) =>
  slug.split('-').map((p) => p[0].toUpperCase() + p.slice(1)).join('') + 'Icon'
const speciesNames = icons.filter((i) => i.set === 'species').map((i) => pascal(i.slug))
const components = Object.entries(react).filter(([, v]) => typeof v === 'object' && v !== null) as [string, React.ComponentType][]

describe('react components', () => {
  it('exports one component per species and none for views', () => {
    const names = components.map(([n]) => n)
    expect(speciesNames).toHaveLength(19)
    expect(new Set(speciesNames).size).toBe(19)
    expect([...names].sort()).toEqual([...speciesNames].sort())
    expect(Object.keys(react).sort()).toEqual([...speciesNames].sort())
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
    const dir = join(__dirname, '../src/react')
    const files = [join(dir, 'createIcon.tsx'), ...readdirSync(join(dir, 'generated')).map((f) => join(dir, 'generated', f))]
    for (const f of files) expect(readFileSync(f, 'utf8')).not.toContain('use client')
  })
})
