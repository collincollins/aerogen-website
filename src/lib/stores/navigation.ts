import { writable } from 'svelte/store';

// Keep 'work' in the type for future use
export type Section = 'main' | 'contact' | 'work';

// Active sections (work is removed but type is preserved)
export const activeNavSections: Section[] = ['main', 'contact'];

export const currentSection = writable<Section>('main'); 