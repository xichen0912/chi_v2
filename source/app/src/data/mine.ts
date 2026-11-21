/**
 * Starting "My" data (fictional) for a first visit. After that, the visitor's own choices
 * are kept in localStorage through lib/store.ts and shared with every page of the site.
 */
export const defaultSavedContentIds: string[] = [
  'ai-shared-control-paper-2',
  'access-beyond-compliance-paper-2',
  'creative-tools-paper-1',
  'learning-together-paper-2',
  'privacy-practice-paper-1',
]

// Sessions the visitor has planned to attend on a first visit.
export const defaultPlannedSessionIds: string[] = ['access-beyond-compliance', 'learning-together']
