<script lang="ts">
  import { showContentToggle, showExclusionZones } from './stores/devTools';
  import { dev } from '$app/environment';
  import { browser } from '$app/environment';
  import { onMount, onDestroy } from 'svelte';
  
  let showContent = true;
  let showZones = false;
  let showPerformanceMonitor = false;
  
  // subscribe to the stores and update local state
  showContentToggle.subscribe(value => {
    showContent = value;
  });
  
  showExclusionZones.subscribe(value => {
    showZones = value;
  });
  
  // toggle content visibility - only in development mode
  const handleToggleContent = () => {
    if (!dev) return; // no-op in production
    
    showContent = !showContent;
    showContentToggle.set(showContent);
  };
  
  // toggle exclusion zones visibility - only in development mode
  const handleToggleZones = () => {
    if (!dev) return; // no-op in production
    
    showZones = !showZones;
    showExclusionZones.set(showZones);
  };
  
  // stats.js instance for performance monitoring
  let stats;
  
  // toggle performance monitor visibility
  function togglePerformanceMonitor() {
    showPerformanceMonitor = !showPerformanceMonitor;
    updateStatsVisibility();
  }
  
  // setup stats.js performance monitor
  function setupPerformanceMonitor() {
    if (!browser || !dev) return;
    
    // dynamically import stats.js
    import('stats.js').then(statsModule => {
      stats = new statsModule.default();
      
      // configure stats panels
      stats.showPanel(0); // FPS
      
      // style the container
      const statsElement = stats.dom;
      statsElement.style.position = 'fixed';
      statsElement.style.left = '10px';
      statsElement.style.bottom = '10px';
      statsElement.style.zIndex = '9999';
      
      // add to the document only if visible
      if (showPerformanceMonitor) {
        document.body.appendChild(statsElement);
      }
      
      // start monitoring
      requestAnimationFrame(function loop() {
        stats.update();
        requestAnimationFrame(loop);
      });
    }).catch(error => {
      console.error('Failed to load stats.js:', error);
    });
  }
  
  // update stats visibility
  function updateStatsVisibility() {
    if (!stats) return;
    
    if (showPerformanceMonitor) {
      document.body.appendChild(stats.dom);
    } else if (document.body.contains(stats.dom)) {
      document.body.removeChild(stats.dom);
    }
  }
  
  onMount(() => {
    if (browser && dev) {
      setupPerformanceMonitor();
    }
  });
  
  onDestroy(() => {
    if (stats && stats.dom && document.body.contains(stats.dom)) {
      document.body.removeChild(stats.dom);
    }
  });
</script>

<!-- only render in development mode -->
{#if dev}
  <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
    <!-- content visibility toggle -->
    <button
      class="bg-primary/90 hover:bg-primary text-white px-4 py-2 rounded-full shadow-lg backdrop-blur-sm transition-all duration-300 flex items-center gap-2 text-sm"
      on:click={handleToggleContent}
      on:keydown={(e) => e.key === 'Enter' && handleToggleContent()}
      tabindex="0"
      aria-label={showContent ? "Hide content" : "Show content"}
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        {#if showContent}
          <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7.028 7.028 0 00-2.79.588l.77.771A5.944 5.944 0 018 3.5c2.12 0 3.879 1.168 5.168 2.457A13.134 13.134 0 0114.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755-.165.165-.337.328-.517.486l.708.709z" />
          <path d="M11.297 9.176a3.5 3.5 0 00-4.474-4.474l.823.823a2.5 2.5 0 012.829 2.829l.822.822zm-2.943 1.299l.822.822a3.5 3.5 0 01-4.474-4.474l.823.823a2.5 2.5 0 002.829 2.829z" />
          <path d="M3.35 5.47c-.18.16-.353.322-.518.487A13.134 13.134 0 001.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7.029 7.029 0 018 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709z" />
          <path fill-rule="evenodd" d="M13.646 14.354l-12-12 .708-.708 12 12-.708.708z" clip-rule="evenodd" />
        {:else}
          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
          <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
        {/if}
      </svg>
      {showContent ? "Hide Content" : "Show Content"}
    </button>
    
    <!-- exclusion zones toggle -->
    <button
      class={showZones ? "bg-accent/90 hover:bg-accent text-white px-4 py-2 rounded-full shadow-lg backdrop-blur-sm transition-all duration-300 flex items-center gap-2 text-sm" : "bg-primary/90 hover:bg-primary text-white px-4 py-2 rounded-full shadow-lg backdrop-blur-sm transition-all duration-300 flex items-center gap-2 text-sm"}
      on:click={handleToggleZones}
      on:keydown={(e) => e.key === 'Enter' && handleToggleZones()}
      tabindex="0"
      aria-label={showZones ? "Hide exclusion zones" : "Show exclusion zones"}
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M5 2a2 2 0 00-2 2v14l3.5-2 3.5 2 3.5-2 3.5 2V4a2 2 0 00-2-2H5zm4.707 3.707a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L8.414 9H10a3 3 0 013 3v1a1 1 0 102 0v-1a5 5 0 00-5-5H8.414l1.293-1.293z" clip-rule="evenodd" />
      </svg>
      {showZones ? "Hide Exclusion Zones" : "Show Exclusion Zones"}
    </button>
    
    <!-- performance monitor toggle -->
    <button
      on:click={togglePerformanceMonitor}
      class:bg-green-500={showPerformanceMonitor}
      class="p-2 rounded bg-slate-700 hover:bg-slate-600 text-white transition-colors"
      tabindex="0"
      aria-label="Toggle performance monitor"
    >
      {showPerformanceMonitor ? 'Hide' : 'Show'} Performance
    </button>
  </div>
{/if} 