<script lang="ts">
  import Cloud3D from "$lib/Cloud3D.svelte";
  import logo from "../images/logo.png";
  import { goto } from "$app/navigation";
  import { browser } from "$app/environment";
  import { onMount } from "svelte";
  import { currentSection } from './stores/navigation';
  
  let cloudComponent: Cloud3D;
  let isClicking = false;
  let containerSize = "";
  let containerPosition = "";
  
  const updateSize = (matches: boolean) => {
    containerSize = matches ? "w-[10rem] h-[10rem]" : "w-[6rem] h-[6rem]";
    containerPosition = matches ? "top-[-2rem] left-[0rem]" : "top-[-1.5rem] left-[-0rem]";
  };

  // Set initial size immediately based on window width if in browser
  if (browser) {
    updateSize(window.matchMedia('(min-width: 768px)').matches);
  }

  onMount(() => {
    if (browser) {
      const mediaQuery = window.matchMedia('(min-width: 768px)');
      // Ensure correct initial state
      updateSize(mediaQuery.matches);
      mediaQuery.addEventListener('change', (e) => updateSize(e.matches));
      
      return () => {
        mediaQuery.removeEventListener('change', (e) => updateSize(e.matches));
      };
    }
  });
  
  const handleLogoClick = async () => {
    isClicking = true;
    await cloudComponent.spin();
    isClicking = false;
    currentSection.set('main');
  };

  const handleSectionChange = (section: typeof $currentSection) => {
    if (section === $currentSection) return;
    currentSection.set(section);
  };
</script>

<!-- Navbar with transparent background -->
<header class="fixed top-0 left-0 w-full z-50">
  <div class="flex justify-between items-center px-8 py-4">
    <!-- Left side - existing logo container -->
    <div class="absolute {containerPosition} {containerSize} 
                transition-all duration-300 ease-in-out">
      <Cloud3D bind:this={cloudComponent} />
      <div class="absolute inset-0 flex flex-col items-center justify-center">
        <!-- Shadow layer -->
        <img 
          src={logo} 
          alt="" 
          class="absolute h-7 md:h-10 w-auto mt-1 opacity-90 blur-sm transform translate-y-[6px]
                transition-all duration-50 ease-in-out"
          class:scale-90={isClicking}
        />
        <!-- Main logo layer -->
        <button 
          class="relative bg-transparent border-0 p-0"
          on:click={handleLogoClick}
        >
          <img 
            src={logo} 
            alt="Aerogen Logo" 
            class="h-9 md:h-12 w-auto mt-2 cursor-pointer 
                   transition-all duration-50 ease-in-out"
            class:scale-90={isClicking}
          />
        </button>
      </div>
    </div>
    
    <!-- Right side - navigation buttons -->
    <div class="ml-auto flex gap-8">
      <button
        class="text-white font-aileron text-lg font-light transition-opacity duration-200"
        class:opacity-50={$currentSection !== 'about'}
        on:click={() => handleSectionChange('about')}
        aria-label="About section"
      >
        About
      </button>
      <button
        class="text-white font-aileron text-lg font-light transition-opacity duration-200"
        class:opacity-50={$currentSection !== 'work'}
        on:click={() => handleSectionChange('work')}
        aria-label="Work section"
      >
        Work
      </button>
    </div>
  </div>
</header> 