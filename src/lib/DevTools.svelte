<script lang="ts">
  import { showContentToggle, keepNavbarVisible } from './stores/devTools';
  import { dev } from '$app/environment';
  import { browser } from '$app/environment';
  import { onMount, onDestroy } from 'svelte';
  import { writable } from 'svelte/store';
  
  let showContent = true;
  let navbarAlwaysVisible = true;
  
  // subscribe to the stores and update local state
  showContentToggle.subscribe(value => {
    showContent = value;
  });
  
  keepNavbarVisible.subscribe(value => {
    navbarAlwaysVisible = value;
  });
  
  // toggle content visibility - only in development mode
  const handleToggleContent = () => {
    if (!dev) return; // no-op in production
    
    showContent = !showContent;
    showContentToggle.set(showContent);
  };
  
  // toggle navbar visibility when content is hidden
  const handleToggleNavbarVisibility = () => {
    if (!dev) return; // no-op in production
    
    navbarAlwaysVisible = !navbarAlwaysVisible;
    keepNavbarVisible.set(navbarAlwaysVisible);
  };
  
  // Only show dev tools in development mode
  let showDevTools = dev;
  
  // Keyboard shortcut to toggle dev tools
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === '`' && event.ctrlKey) {
      showDevTools = !showDevTools;
    }
  };
  
  onMount(() => {
    if (browser) {
      window.addEventListener('keydown', handleKeyDown);
    }
  });
  
  onDestroy(() => {
    if (browser) {
      window.removeEventListener('keydown', handleKeyDown);
    }
  });
</script>

{#if showDevTools}
  <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2 items-end">
    <!-- Content Toggle Button -->
    <button
      class={showContent ? "bg-accent/90 hover:bg-accent text-white px-4 py-2 rounded-full shadow-lg backdrop-blur-sm transition-all duration-300 flex items-center gap-2 text-sm" : "bg-primary/90 hover:bg-primary text-white px-4 py-2 rounded-full shadow-lg backdrop-blur-sm transition-all duration-300 flex items-center gap-2 text-sm"}
      on:click={handleToggleContent}
      on:keydown={(e) => e.key === 'Enter' && handleToggleContent()}
      aria-label={showContent ? "Hide content" : "Show content"}
      tabindex="0"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={showContent ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" : "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"} />
      </svg>
      {showContent ? "Hide Content" : "Show Content"}
    </button>
    
    <!-- Navbar Visibility Toggle Button -->
    <button
      class={navbarAlwaysVisible ? "bg-accent/90 hover:bg-accent text-white px-4 py-2 rounded-full shadow-lg backdrop-blur-sm transition-all duration-300 flex items-center gap-2 text-sm" : "bg-primary/90 hover:bg-primary text-white px-4 py-2 rounded-full shadow-lg backdrop-blur-sm transition-all duration-300 flex items-center gap-2 text-sm"}
      on:click={handleToggleNavbarVisibility}
      on:keydown={(e) => e.key === 'Enter' && handleToggleNavbarVisibility()}
      aria-label={navbarAlwaysVisible ? "Hide navbar when content is hidden" : "Always show navbar"}
      tabindex="0"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
      {navbarAlwaysVisible ? "Navbar Always Visible" : "Hide Navbar with Content"}
    </button>
  </div>
{/if}

<style>
</style> 