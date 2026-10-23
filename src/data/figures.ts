import manifest from './manifest.json'

export type FigureKind = 'result' | 'input' | 'plot' | 'decorative'

export interface FigureEntry {
  id: string
  src: string
  w: number
  h: number
  kind: FigureKind
  source: string
  section?: string
  title?: string
  alt?: string
  full?: string
  t?: number
  sigma?: number
  seed?: number
  cfg?: number
  prompt?: string
  promptA?: string
  promptB?: string
  promptFar?: string
  promptNear?: string
  group?: string
  groupTitle?: string
  inputSource?: string
  view?: string
  featured?: boolean
}

const BASE = import.meta.env.BASE_URL

const byId = new Map<string, FigureEntry>()
for (const entry of manifest as FigureEntry[]) byId.set(entry.id, entry)

/** Look up a figure by manifest id. Throws during development if an id is missing. */
export function fig(id: string): FigureEntry {
  const entry = byId.get(id)
  if (!entry) throw new Error(`Unknown figure id: ${id}`)
  return entry
}

/** Resolve a path inside public/ against the deployed base path. */
export function asset(path: string): string {
  return BASE + path.replace(/^\//, '')
}

export const STARTS = ['0.02', '0.04', '0.06', '0.10', '0.14', '0.25', '0.50'] as const

export function editSeries(section: '3.1' | '3.2', group: string) {
  const prefix = section === '3.1' ? 'a31' : 'a32'
  return {
    input: fig(`${prefix}-${group}-original`),
    steps: STARTS.map((t) => fig(`${prefix}-${group}-${t}`)),
  }
}
