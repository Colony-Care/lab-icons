export type IconSet = 'species' | 'views' | 'lab'
export type IconStyle = 'outline' | 'solid' | 'duotone' | 'inverse'
export type IconCategory = 'organisms' | 'vivarium' | 'bench' | 'instruments' | 'biology'
export type IconView = 'dorsal' | 'ventral' | 'lateral' | 'left' | 'right'

export interface IconEntry {
  /** kebab-case, unique across all sets */
  slug: string
  set: IconSet
  /** lab icons only */
  category?: IconCategory
  /** Animal species slug. Present on species icons and anatomical views only. */
  species?: string
  /** views only */
  view?: IconView
  /** repo-relative, e.g. 'icons/species/mouse.svg' */
  file: string
  /** repo-relative file per style; always has `outline`. Species and lab icons have all four, views only `outline`. */
  styles: Partial<Record<IconStyle, string>>
  name: { en: string; fr: string }
  tags: { en: string[]; fr: string[] }
}
