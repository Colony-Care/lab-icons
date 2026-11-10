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

const LAB_PICK = [
  'zebra-finch', 'drosophila', 'c-elegans',
  'ivc-cage', 'running-wheel', 'rfid-tag',
  'petri-dish', 'micropipette', 'erlenmeyer',
  'microscope', 'centrifuge', 'thermocycler',
  'neuron', 'dna', 'brain', 'heart', 'virus', 'cell',
]
const labBySlug = new Map(icons.filter((i) => i.set === 'lab').map((i) => [i.slug, i]))
const labPicked = LAB_PICK.map((s) => {
  const icon = labBySlug.get(s)
  if (!icon) throw new Error(`Unknown lab icon: ${s}`)
  return icon
})
const labRows = [labPicked.slice(0, 9), labPicked.slice(9)]

function banner(fg, bg, bannerRows = rows, outline = false) {
  let out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">`
  out += `<rect width="${W}" height="${H}" rx="24" fill="${bg}"/>`
  bannerRows.forEach((row, r) => {
    const x0 = (W - row.length * PITCH + (PITCH - SIZE)) / 2
    row.forEach((icon, c) => {
      const svg = readFileSync(join(root, icon.file), 'utf8').trim()
      const m = svg.match(/^<svg\b[^>]*>([\s\S]*)<\/svg>$/)
      const x = x0 + c * PITCH
      const paint = outline
        ? `fill="none" stroke="${fg}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"`
        : `fill="${fg}"`
      const body = outline ? m[1].replaceAll('currentColor', fg) : m[1]
      out += `<g transform="translate(${x} ${ROW_Y[r]}) scale(${SIZE / 64})" ${paint}>${body}</g>`
    })
  })
  return out + '</svg>\n'
}

writeFileSync(join(root, '.github/assets/preview-light.svg'), banner('#0069D1', '#FFFFFF'))
writeFileSync(join(root, '.github/assets/preview-dark.svg'), banner('#4DA6FF', '#0D1117'))
writeFileSync(join(root, '.github/assets/preview-lab-light.svg'), banner('#0069D1', '#FFFFFF', labRows, true))
writeFileSync(join(root, '.github/assets/preview-lab-dark.svg'), banner('#4DA6FF', '#0D1117', labRows, true))

const GROUPS = [
  { title: { en: 'Species', fr: 'Espèces' }, pick: (i) => i.set === 'species' },
  { title: { en: 'Anatomical views', fr: 'Vues anatomiques' }, pick: (i) => i.set === 'views' },
  { title: { en: 'Model organisms', fr: 'Organismes modèles' }, pick: (i) => i.category === 'organisms' },
  { title: { en: 'Vivarium', fr: 'Animalerie' }, pick: (i) => i.category === 'vivarium' },
  { title: { en: 'Bench equipment', fr: 'Matériel de paillasse' }, pick: (i) => i.category === 'bench' },
  { title: { en: 'Instruments', fr: 'Instruments' }, pick: (i) => i.category === 'instruments' },
  { title: { en: 'Organs and cells', fr: 'Organes et cellules' }, pick: (i) => i.category === 'biology' },
]
const STYLES = 'outline, solid, duotone, inverse'
const HEAD = {
  en: ['Slug', 'English', 'Français'],
  fr: ['Identifiant', 'English', 'Français'],
}

function list(lang) {
  const parts = []
  for (const g of GROUPS) {
    const items = icons.filter(g.pick).sort((x, y) => x.slug.localeCompare(y.slug))
    if (!items.length) continue
    const lab = items.every((i) => i.set !== 'views') // species and lab icons have four styles
    const head = [...HEAD[lang], ...(lab ? ['Styles'] : [])]
    parts.push(
      `${lang === 'en' ? '###' : '####'} ${g.title[lang]}`,
      '',
      `| ${head.join(' | ')} |`,
      `| ${head.map(() => '---').join(' | ')} |`,
      ...items.map((i) => `| \`${i.slug}\` | ${i.name.en} | ${i.name.fr}${lab ? ` | ${STYLES}` : ''} |`),
      '',
    )
  }
  return parts.join('\n').trimEnd()
}

const readmePath = join(root, 'README.md')
let readme = readFileSync(readmePath, 'utf8')
for (const [name, lang] of [['icon-list', 'en'], ['icon-list-fr', 'fr']]) {
  const start = `<!-- ${name}:start -->`
  const end = `<!-- ${name}:end -->`
  const a = readme.indexOf(start)
  const b = readme.indexOf(end)
  if (a !== -1 && b !== -1) {
    readme = readme.slice(0, a + start.length) + '\n\n' + list(lang) + '\n\n' + readme.slice(b)
  }
}
writeFileSync(readmePath, readme)
console.log('Wrote previews and icon list')
