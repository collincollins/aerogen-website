import { writable } from 'svelte/store';
import { dev } from '$app/environment';
import { airplane_contrail } from './navigation';

// store for developer tools settings
export const showContentToggle = writable(true); // default to true to ensure content is visible
// export const showExclusionZones = writable(false); // store for exclusion zones visibility - DEPRECATED
export const keepNavbarVisible = writable(true); // always keep navbar visible even when content is hidden
export const airplaneContrailToggle = writable(false); // toggle for airplane contrails - default to false

// in production, always ensure content is visible
if (!dev) {
  showContentToggle.set(true);
}

// Sync the airplane_contrail toggle with our DevTools toggle
airplaneContrailToggle.subscribe(value => {
  airplane_contrail.set(value);
}); 