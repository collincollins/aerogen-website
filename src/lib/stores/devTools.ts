import { writable } from 'svelte/store';

// Store for developer tools settings
export const showContentToggle = writable(false);
export const showExclusionZones = writable(false); // Add new store for exclusion zones 