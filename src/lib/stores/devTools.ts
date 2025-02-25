import { writable } from 'svelte/store';
import { dev } from '$app/environment';

// store for developer tools settings
export const showContentToggle = writable(true); // default to true to ensure content is visible
export const showExclusionZones = writable(false); // store for exclusion zones visibility

// in production, always ensure content is visible
if (!dev) {
  showContentToggle.set(true);
} 