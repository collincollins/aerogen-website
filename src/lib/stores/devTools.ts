import { writable } from 'svelte/store';

// Store for developer tools settings
export const showContentToggle = writable(true); // Default to true to ensure content is visible
export const showExclusionZones = writable(false); // Add new store for exclusion zones 