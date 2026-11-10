#!/usr/bin/env node
// Optimise every icons/**/*.svg in place. Running it twice changes nothing.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { optimize } from 'svgo'
import config from '../svgo.config.mjs'

const SMALL_CANVAS = 100
const root = join(dirname(fileURLToPath(import.meta.url)), '..')

function optimizeOnce(source) {
  const rawViewBox = source.match(/<svg\b[^>]*?\sviewBox="([^"]+)"/)?.[1]
  if (!rawViewBox) throw new Error('icon has no viewBox')
  // Two decimals are plenty on a 1000+ unit canvas but visibly shift edges on the
  // 64 unit species canvas, so small canvases keep one more decimal.
  const size = Math.max(...rawViewBox.trim().split(/[\s,]+/).slice(2).map(Number))
  const { data } = optimize(source, { ...config, floatPrecision: size <= SMALL_CANVAS ? 3 : config.floatPrecision })
  const viewBox = data.match(/<svg\b[^>]*?\sviewBox="([^"]+)"/)[1]
  return data
    .replace(/<svg\b[^>]*>/, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" fill="currentColor">`)
    .replace(/(<(?!svg\b)[a-z][^>]*?)\sfill="currentColor"/g, '$1')
    .replace(/\n*$/, '\n')
}

// Rounding already-rounded numbers can still shrink a path, so repeat until the output
// stops changing. That is what makes a second `npm run optimize` a no-op.
export function optimizeSvg(source) {
  let current = source
  for (let pass = 0; pass < 10; pass++) {
    const next = optimizeOnce(current)
    if (next === current) return current
    current = next
  }
  throw new Error('optimiser did not converge')
}

function svgFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? svgFiles(join(dir, e.name)) : e.name.endsWith('.svg') ? [join(dir, e.name)] : [],
  )
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const files = svgFiles(join(root, 'icons'))
  for (const f of files) {
    const before = readFileSync(f, 'utf8')
    const after = optimizeSvg(before)
    if (after !== before) writeFileSync(f, after)
  }
  console.log(`optimised ${files.length} icons`)
}
