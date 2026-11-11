import { execSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
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
    expect(root.icons).toHaveLength(106)
  })

  it('marks every icon as pure so bundlers can tree-shake', () => {
    for (const f of ['dist/react/index.js', 'dist/react/index.cjs']) {
      const code = readFileSync(f, 'utf8')
      expect(code.match(/(?:@__PURE__|#__PURE__) \*\/ createIcon\(/g)).toHaveLength(63)
    }
  })

  it('a single-icon import bundles only that icon', async () => {
    const { build } = await import('esbuild')
    const result = await build({
      stdin: { contents: "import { MouseIcon } from './dist/react/index.js'\nconsole.log(MouseIcon)", resolveDir: process.cwd() },
      bundle: true,
      write: false,
      format: 'esm',
      external: ['react', 'react/jsx-runtime'],
    })
    const out = result.outputFiles[0].text
    expect(out).toContain('MouseIcon')
    expect(out).not.toContain('ZebrafishIcon')
  })

  it('a single lab icon import does not pull other lab icons', async () => {
    const { build } = await import('esbuild')
    const result = await build({
      stdin: { contents: "import { MicroscopeIcon } from './dist/react/index.js'\nconsole.log(MicroscopeIcon)", resolveDir: process.cwd() },
      bundle: true,
      write: false,
      format: 'esm',
      external: ['react', 'react/jsx-runtime'],
    })
    const out = result.outputFiles[0].text
    expect(out).toContain('MicroscopeIcon')
    expect(out).not.toContain('CentrifugeIcon')
    expect(out).not.toContain('MouseIcon')
  })

  it('types are emitted', () => {
    expect(existsSync('dist/index.d.ts')).toBe(true)
    expect(existsSync('dist/react/index.d.ts')).toBe(true)
  })

  it('tarball content', () => {
    const out = execSync('npm pack --dry-run --json', { stdio: ['ignore', 'pipe', 'ignore'] }).toString()
    const files: string[] = JSON.parse(out)[0].files.map((f: { path: string }) => f.path)
    for (const p of ['LICENSE', 'LICENSE-CODE', 'README.md', 'icons/species/mouse.svg', 'icons/outline/mouse.svg', 'icons/solid/mouse.svg', 'icons/duotone/mouse.svg', 'icons/inverse/mouse.svg', 'metadata/icons.json']) {
      expect(files).toContain(p)
    }
    for (const style of ['outline', 'solid', 'duotone', 'inverse']) {
      expect(files.some((f) => f.startsWith(`icons/${style}/`))).toBe(true)
    }
    const bad = files.filter((p) => /^(tests|scripts|src)\/|^\.[^/]+\//.test(p))
    expect(bad).toEqual([])
  })
})
