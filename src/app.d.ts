/// <reference types="@sveltejs/kit" />
/// <reference types="svelte" />

// See https://kit.svelte.dev/docs/types#app
declare namespace App {
	// interface Error {}
	// interface Locals {}
	// interface PageData {}
	// interface Platform {}
}

// Fixes the svelteHTML namespace error
declare namespace svelte.JSX {
	interface HTMLAttributes<T> {
		[key: string]: any;
	}
} 