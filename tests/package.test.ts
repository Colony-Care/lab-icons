import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { beforeAll, describe, expect, it } from 'vitest'

const require = createRequire(import.meta.url)

// The package tests exercise the built output, so they build it first.
// It calls tsup directly: the generate step already ran in pretest, and re-running it here would race the react tests.
// This keeps `npm ci && npm test && npm run build` valid from a clean clone.
beforeAll(() => {
  execSync('npx tsup', { stdio: 'pipe' })
}, 120_000)

describe('built package', () => {
  it('ESM import works', async () => {
    const mod = await import('../dist/react/index.js')
    expect(mod.MouseIcon).toBeTruthy()
  })

  it('CJS require works', () => {
    const react = require('../dist/react/index.cjs')
    expect(react.MouseIcon).toBeTruthy()
    expect(typeof react.MouseIcon.render).toBe('function')
    const root = require('../dist/index.cjs')
    expect(root.icons).toHaveLength(60)
  })

  it('types are emitted', () => {
    expect(existsSync('dist/index.d.ts')).toBe(true)
    expect(existsSync('dist/react/index.d.ts')).toBe(true)
  })

  it('tarball content', () => {
    const out = execSync('npm pack --dry-run --json', { stdio: ['ignore', 'pipe', 'ignore'] }).toString()
    const files: string[] = JSON.parse(out)[0].files.map((f: { path: string }) => f.path)
    for (const p of ['LICENSE', 'LICENSE-CODE', 'README.md', 'icons/species/mouse.svg', 'metadata/icons.json']) {
      expect(files).toContain(p)
    }
    const bad = files.filter((p) => /^(tests|scripts|src)\/|^\.[^/]+\//.test(p))
    expect(bad).toEqual([])
  })
})
