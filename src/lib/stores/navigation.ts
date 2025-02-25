import { writable } from 'svelte/store';

// keep 'work' in the type for future use
export type Section = 'main' | 'contact' | 'work';

// active sections (work is removed but type is preserved)
export const activeNavSections: Section[] = ['main', 'contact'];

export const currentSection = writable<Section>('main');

// Control visual effects (clouds, contrails, airplane)
export const fun_mode = writable(false); 

// Specifically control airplane contrails (independent of fun_mode)
// Set to false to disable only the airplane contrails
export const airplane_contrail = writable(false); 