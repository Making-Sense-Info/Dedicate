export type MainTab = 'home' | 'conformity' | 'turtle' | 'hierarchy' | 'graph-table' | 'bubbles'

export const TAB_PATH: Record<MainTab, string> = {
  home: '/',
  conformity: '/conformity',
  turtle: '/turtle',
  hierarchy: '/hierarchy',
  'graph-table': '/graph-table',
  bubbles: '/bubbles',
}

const PATH_TAB: Record<string, MainTab> = {
  '/': 'home',
  '/home': 'home',
  '/conformity': 'conformity',
  '/turtle': 'turtle',
  '/hierarchy': 'hierarchy',
  '/graph-table': 'graph-table',
  '/bubbles': 'bubbles',
}

export function tabFromPath(pathname: string): MainTab {
  const normalized = pathname.replace(/\/+$/, '') || '/'
  return PATH_TAB[normalized] ?? 'home'
}

export function pathForTab(tab: MainTab): string {
  return TAB_PATH[tab]
}
