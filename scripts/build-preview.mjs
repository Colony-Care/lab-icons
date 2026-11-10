import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const icons = JSON.parse(readFileSync(join(root, 'metadata/icons.json'), 'utf8'))
const species = icons.filter((i) => i.set === 'species')

const W = 1280
const H = 400
const SIZE = 96
const PITCH = 120
const ROW_Y = [88, 216]
const rows = [species.slice(0, 10), species.slice(10)]

function banner(fg, bg) {
  let out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">`
  out += `<rect width="${W}" height="${H}" rx="24" fill="${bg}"/>`
  rows.forEach((row, r) => {
    const x0 = (W - row.length * PITCH + (PITCH - SIZE)) / 2
    row.forEach((icon, c) => {
      const svg = readFileSync(join(root, icon.file), 'utf8').trim()
      const m = svg.match(/^<svg\b[^>]*>([\s\S]*)<\/svg>$/)
      const x = x0 + c * PITCH
      out += `<g transform="translate(${x} ${ROW_Y[r]}) scale(${SIZE / 64})" fill="${fg}">${m[1]}</g>`
    })
  })
  return out + '</svg>\n'
}

writeFileSync(join(root, '.github/assets/preview-light.svg'), banner('#0069D1', '#FFFFFF'))
writeFileSync(join(root, '.github/assets/preview-dark.svg'), banner('#4DA6FF', '#0D1117'))

const table = [
  '| Slug | English | Français |',
  '| --- | --- | --- |',
  ...icons.map((i) => `| \`${i.slug}\` | ${i.name.en} | ${i.name.fr} |`),
].join('\n')

const readmePath = join(root, 'README.md')
const readme = readFileSync(readmePath, 'utf8')
const start = '<!-- icon-list:start -->'
const end = '<!-- icon-list:end -->'
const a = readme.indexOf(start)
const b = readme.indexOf(end)
if (a !== -1 && b !== -1) {
  writeFileSync(readmePath, readme.slice(0, a + start.length) + '\n\n' + table + '\n\n' + readme.slice(b))
}
console.log('Wrote previews and icon list')
