export type IconSet = 'species' | 'views' | 'lab'
export type IconStyle = 'outline' | 'solid' | 'duotone' | 'inverse'
export type IconCategory = 'organisms' | 'vivarium' | 'bench' | 'instruments' | 'biology'
export type IconView = 'dorsal' | 'ventral' | 'lateral'

export interface IconEntry {
  /** kebab-case, unique across all sets */
  slug: string
  set: IconSet
  /** lab icons only */
  category?: IconCategory
  /** species slug, e.g. 'guinea-pig' */
  species: string
  /** views only */
  view?: IconView
  /** repo-relative, e.g. 'icons/species/mouse.svg' */
  file: string
  /** repo-relative file per style; always has `outline` */
  styles: Partial<Record<IconStyle, string>>
  name: { en: string; fr: string }
  tags: { en: string[]; fr: string[] }
}
