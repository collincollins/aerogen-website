<script lang="ts">
  import Cloud3D from "$lib/Cloud3D.svelte";
  import Cloud3DReverse from "$lib/Cloud3DReverse.svelte";
  import logo from "../images/logo.png";
  import { goto } from "$app/navigation";
  import { browser } from "$app/environment";
  import { onMount } from "svelte";
  import { currentSection, activeNavSections } from './stores/navigation';
  
  let logoCloudComponent: Cloud3D;
  let aboutCloudComponent: Cloud3DReverse;
  let isLogoClicking = false;
  let isAboutClicking = false;
  let logoContainerSize = "";
  let logoContainerPosition = "";
  let aboutContainerSize = "";
  let aboutContainerPosition = "";
  let questionMarkSize = "";
  
  const updateSize = (matches: boolean) => {
    // Logo cloud sizing
    logoContainerSize = matches ? "w-[10rem] h-[10rem]" : "w-[6rem] h-[6rem]";
    logoContainerPosition = matches ? "top-[-2rem] left-[0rem]" : "top-[-1.5rem] left-[-0rem]";
    
    // About cloud sizing (slightly smaller than logo)
    aboutContainerSize = matches ? "w-[8rem] h-[8rem]" : "w-[5rem] h-[5rem]";
    aboutContainerPosition = matches ? "top-[-1rem] right-[2rem]" : "top-[-1rem] right-[1rem]";
    
    // Question mark sizing
    questionMarkSize = matches ? "text-3xl mt-3" : "text-xl mt-3";
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
  
  const handleLogoClick = () => {
    // Set clicking state immediately for visual feedback
    isLogoClicking = true;
    
    // Change the page immediately
    currentSection.set('main');
    
    // Start cloud spin immediately
    logoCloudComponent.spin().then(() => {
      // Reset after animation completes
      setTimeout(() => {
        isLogoClicking = false;
      }, 50);
    });
  };

  const handleAboutClick = () => {
    // Set clicking state immediately for visual feedback
    isAboutClicking = true;
    
    // Change the page immediately
    currentSection.set('about');
    
    // Start cloud spin immediately
    aboutCloudComponent.spin().then(() => {
      // Reset after animation completes
      setTimeout(() => {
        isAboutClicking = false;
      }, 50);
    });
  };
</script>

<!-- Navbar with transparent background -->
<header class="fixed top-0 left-0 w-full z-50">
  <div class="flex justify-between items-center px-8 py-4">
    <!-- Left side - logo cloud container -->
    <div class="absolute {logoContainerPosition} {logoContainerSize} 
                transition-all duration-200 ease-in-out">
      <Cloud3D bind:this={logoCloudComponent} />
      <div class="absolute inset-0 flex flex-col items-center justify-center">
        <!-- Shadow layer -->
        <img 
          src={logo} 
          alt="" 
          class="absolute h-7 md:h-10 w-auto mt-1 opacity-90 blur-sm transform translate-y-[6px]"
          class:scale-90={isLogoClicking}
        />
        <!-- Main logo layer -->
        <button 
          class="relative bg-transparent border-0 p-0 active:scale-90 transition-transform duration-50"
          on:click={handleLogoClick}
        >
          <img 
            src={logo} 
            alt="Aerogen Logo" 
            class="h-9 md:h-12 w-auto mt-2 cursor-pointer transition-transform duration-50"
            class:scale-90={isLogoClicking}
          />
        </button>
      </div>
    </div>
    
    <!-- Right side - About cloud container -->
    <div class="absolute {aboutContainerPosition} {aboutContainerSize} 
                transition-all duration-300 ease-in-out">
      <Cloud3DReverse bind:this={aboutCloudComponent} />
      <div class="absolute inset-0 flex flex-col items-center justify-center">
        <button 
          class="relative border-0 p-0 {questionMarkSize} text-primary font-aileron font-bold active:scale-90 transition-transform duration-50"
          class:opacity-90={$currentSection !== 'about'}
          class:scale-90={isAboutClicking}
          on:click={handleAboutClick}
          aria-label="About section"
        >
          ?
        </button>
      </div>
    </div>
    
    <!-- Hidden Work button (preserved for future use) -->
    <!-- 
    <div class="ml-auto flex gap-8 invisible">
      <button
        class="text-white font-aileron text-lg font-light transition-opacity duration-200"
        class:opacity-50={$currentSection !== 'work'}
        on:click={() => currentSection.set('work')}
        aria-label="Work section"
      >
        Work
      </button>
    </div>
    -->
  </div>
</header> 