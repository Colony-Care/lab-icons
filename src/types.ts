export type IconSet = 'species' | 'views'
export type IconView = 'dorsal' | 'ventral' | 'lateral'

export interface IconEntry {
  /** kebab-case, unique across both sets */
  slug: string
  set: IconSet
  /** species slug, e.g. 'guinea-pig' */
  species: string
  /** views only */
  view?: IconView
  /** repo-relative, e.g. 'icons/species/mouse.svg' */
  file: string
  name: { en: string; fr: string }
  tags: { en: string[]; fr: string[] }
}
