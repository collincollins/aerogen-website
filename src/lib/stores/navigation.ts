import { writable } from 'svelte/store';

export type Section = 'main' | 'about' | 'work';

export const currentSection = writable<Section>('main'); 