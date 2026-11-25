import { createContext, useContext } from 'react'

export type Layout = 'classic' | 'day'

export const LayoutContext = createContext<Layout>('day')
export const useLayout = () => useContext(LayoutContext)

const KEY = 'chi-layout'

export function loadLayout(): Layout {
  try {
    // Day is the default; Classic only when the visitor picked it.
    return window.localStorage.getItem(KEY) === 'classic' ? 'classic' : 'day'
  } catch {
    return 'day'
  }
}

export function saveLayout(layout: Layout) {
  try {
    window.localStorage.setItem(KEY, layout)
  } catch {
    /* storage may be unavailable; the layout just won't persist */
  }
}
