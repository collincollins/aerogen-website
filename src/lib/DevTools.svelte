<script lang="ts">
  import { showContentToggle, showExclusionZones } from './stores/devTools';
  import { dev } from '$app/environment';
  import { browser } from '$app/environment';
  import { onMount, onDestroy } from 'svelte';
  import { writable } from 'svelte/store';
  
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
  
  // Interfaces for Stats.js
  interface StatsPanel {
    dom: HTMLElement;
    update: () => void;
  }
  
  interface EnhancedStats extends StatsPanel {
    showPanel: (id: number) => void;
    msPanel?: StatsPanel;
    memPanel?: StatsPanel;
  }
  
  // Stats constructor type
  interface StatsConstructor {
    new(): EnhancedStats;
    default: new() => EnhancedStats;
  }
  
  // stats.js instances for performance monitoring
  let stats: EnhancedStats | null = null;
  let msPanel: EnhancedStats | null = null;
  let memPanel: EnhancedStats | null = null;
  
  // Improved styling for stats panels
  const statsPanelStyles = `
    .stats-panel {
      position: fixed;
      left: 10px;
      top: 50%;
      z-index: 998;
      pointer-events: none;
    }
    
    .stats-panel-fps {
      transform: translateY(-100px);
    }
    
    .stats-panel-ms {
      transform: translateY(0px);
    }
    
    .stats-panel-mb {
      transform: translateY(100px);
    }
    
    .stats-label {
      position: absolute;
      left: 85px;
      top: 0;
      width: 30px;
      height: 48px;
      color: #fff;
      font-family: 'aileron', sans-serif;
      font-size: 10px;
      line-height: 48px;
      font-weight: bold;
      text-align: left;
      text-shadow: 0 0 2px rgba(0,0,0,0.5);
      pointer-events: none;
    }
  `;
  
  // Function to enhance stats panel with label
  const addLabelToPanel = (panel: HTMLElement, label: string): void => {
    // Add unique class to each panel for positioning
    if (label === 'FPS') {
      panel.classList.add('stats-panel', 'stats-panel-fps');
    } else if (label === 'MS') {
      panel.classList.add('stats-panel', 'stats-panel-ms');
    } else if (label === 'MB') {
      panel.classList.add('stats-panel', 'stats-panel-mb');
    } else {
      panel.classList.add('stats-panel');
    }
    
    // Create and append label element
    const labelElement = document.createElement('div');
    labelElement.className = 'stats-label';
    labelElement.textContent = label;
    panel.appendChild(labelElement);
  };
  
  // toggle performance monitor visibility
  function togglePerformanceMonitor() {
    showPerformanceMonitor = !showPerformanceMonitor;
    console.log("Performance monitor toggled:", showPerformanceMonitor);
    updateStatsVisibility();
  }
  
  // setup stats.js performance monitor
  const setupPerformanceMonitor = async (): Promise<void> => {
    try {
      if (browser) {
        console.log("Setting up performance monitor");
        
        // Add custom styles for stats panel positioning
        const styleElement = document.createElement('style');
        styleElement.textContent = statsPanelStyles;
        document.head.appendChild(styleElement);
        
        // Import Stats dynamically only in browser
        const StatsModule = await import('stats.js');
        const Stats = StatsModule.default as unknown as StatsConstructor;
        
        // Create FPS panel and add label
        stats = new Stats();
        stats.showPanel(0); // 0: fps, 1: ms, 2: mb
        addLabelToPanel(stats.dom, 'FPS');
        
        // Create MS panel and add label
        msPanel = new Stats();
        msPanel.showPanel(1); // 1: ms
        addLabelToPanel(msPanel.dom, 'MS');
        
        // Create MB panel and add label
        memPanel = new Stats();
        memPanel.showPanel(2); // 2: mb
        addLabelToPanel(memPanel.dom, 'MB');
        
        // Start animation loop before setting visibility
        startStatsAnimation();
        
        // Set initial visibility
        updateStatsVisibility();
        
        console.log("Performance monitor setup complete");
      }
    } catch (error) {
      console.error('Failed to load Stats.js', error);
    }
  };
  
  // Function to update stats panels visibility
  const updateStatsVisibility = (): void => {
    if (!browser) return;
    
    console.log("Updating stats visibility:", showPerformanceMonitor);
    
    if (showPerformanceMonitor) {
      // Add FPS panel
      if (stats && !document.body.contains(stats.dom)) {
        document.body.appendChild(stats.dom);
        console.log("Added FPS panel to body");
      }
      
      // Add MS panel
      if (msPanel && !document.body.contains(msPanel.dom)) {
        document.body.appendChild(msPanel.dom);
        console.log("Added MS panel to body");
      }
      
      // Add MB panel
      if (memPanel && !document.body.contains(memPanel.dom)) {
        document.body.appendChild(memPanel.dom);
        console.log("Added MB panel to body");
      }
    } else {
      // Remove all panels
      if (stats && document.body.contains(stats.dom)) {
        document.body.removeChild(stats.dom);
      }
      
      if (msPanel && document.body.contains(msPanel.dom)) {
        document.body.removeChild(msPanel.dom);
      }
      
      if (memPanel && document.body.contains(memPanel.dom)) {
        document.body.removeChild(memPanel.dom);
      }
    }
  };
  
  // Animation loop for stats panels
  const startStatsAnimation = (): void => {
    if (!browser) return;
    
    requestAnimationFrame(function loop() {
      if (stats) stats.update();
      if (msPanel) msPanel.update();
      if (memPanel) memPanel.update();
      requestAnimationFrame(loop);
    });
  };
  
  onMount(() => {
    if (browser && dev) {
      setupPerformanceMonitor();
    }
  });
  
  onDestroy(() => {
    if (stats) {
      if (document.body.contains(stats.dom)) {
        document.body.removeChild(stats.dom);
      }
      if (stats.msPanel && document.body.contains(stats.msPanel.dom)) {
        document.body.removeChild(stats.msPanel.dom);
      }
      if (stats.memPanel && document.body.contains(stats.memPanel.dom)) {
        document.body.removeChild(stats.memPanel.dom);
      }
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
      on:keydown={(e) => e.key === 'Enter' && togglePerformanceMonitor()}
      class={showPerformanceMonitor ? "bg-accent/90 hover:bg-accent text-white px-4 py-2 rounded-full shadow-lg backdrop-blur-sm transition-all duration-300 flex items-center gap-2 text-sm" : "bg-primary/90 hover:bg-primary text-white px-4 py-2 rounded-full shadow-lg backdrop-blur-sm transition-all duration-300 flex items-center gap-2 text-sm"}
      tabindex="0"
      aria-label={showPerformanceMonitor ? "Hide performance monitor" : "Show performance monitor"}
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
      </svg>
      {showPerformanceMonitor ? "Hide Performance" : "Show Performance"}
    </button>
  </div>
{/if} 