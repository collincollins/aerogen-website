<script lang="ts">
  import Cloud3D from "$lib/Cloud3D.svelte";
  import Cloud3DReverse from "$lib/Cloud3DReverse.svelte";
  import logo from "../images/logo.png";
  import { goto } from "$app/navigation";
  import { browser } from "$app/environment";
  import { onMount } from "svelte";
  import { currentSection, activeNavSections } from './stores/navigation';
  
  let logoCloudComponent: Cloud3D;
  let contactCloudComponent: Cloud3DReverse;
  let isLogoClicking = false;
  let isContactClicking = false;
  let logoContainerSize = "";
  let logoContainerPosition = "";
  let contactContainerSize = "";
  let contactContainerPosition = "";
  let envelopeIconSize = "";
  let disableTransitions = false;
  
  // reference to the cloud containers for direct dom manipulation
  let logoContainer: HTMLDivElement;
  let contactContainer: HTMLDivElement;
  
  const updateSize = (matches: boolean) => {
    // logo cloud sizing
    logoContainerSize = matches ? "w-[10rem] h-[10rem]" : "w-[6rem] h-[6rem]";
    logoContainerPosition = matches ? "top-[-2rem] left-[0rem]" : "top-[-1.5rem] left-[-0rem]";
    
    // contact cloud sizing (slightly smaller than logo)
    contactContainerSize = matches ? "w-[10rem] h-[10rem]" : "w-[6rem] h-[6rem]";
    contactContainerPosition = matches ? "top-[-2rem] right-[0rem]" : "top-[-1.5rem] right-[0rem]";
    
    // envelope icon sizing - larger on desktop for better visibility
    envelopeIconSize = matches ? "h-8 w-8" : "h-6 w-6";
  };

  // set initial size immediately based on window width if in browser
  if (browser) {
    updateSize(window.matchMedia('(min-width: 768px)').matches);
  }

  onMount(() => {
    if (browser) {
      const mediaQuery = window.matchMedia('(min-width: 768px)');
      // ensure correct initial state
      updateSize(mediaQuery.matches);
      
      // track previous window dimensions to detect snap events
      let prevWidth = window.innerWidth;
      let prevHeight = window.innerHeight;
      let lastResizeTime = 0;
      
      // handle window resize with snap detection
      const handleResize = () => {
        const now = performance.now();
        const deltaTime = now - lastResizeTime;
        const widthDelta = Math.abs(window.innerWidth - prevWidth);
        const heightDelta = Math.abs(window.innerHeight - prevHeight);
        
        // detect snap event: large size change in very short time
        // or resize after a period of inactivity
        const isSnapEvent = (widthDelta > 100 || heightDelta > 100) && 
                           (deltaTime < 50 || deltaTime > 500);
        
        if (isSnapEvent) {
          // for snap events, temporarily disable transitions
          disableTransitions = true;
          
          // force update immediately
          updateSize(mediaQuery.matches);
          
          // re-enable transitions after dom has updated
          setTimeout(() => {
            disableTransitions = false;
          }, 50);
        } else {
          // normal resize, use transitions
          updateSize(mediaQuery.matches);
        }
        
        // update tracking variables
        prevWidth = window.innerWidth;
        prevHeight = window.innerHeight;
        lastResizeTime = now;
      };
      
      // standard media query listener for style changes
      const handleMediaChange = (e: MediaQueryListEvent) => {
        updateSize(e.matches);
      };
      
      // add event listeners
      window.addEventListener('resize', handleResize);
      mediaQuery.addEventListener('change', handleMediaChange);
      
      return () => {
        window.removeEventListener('resize', handleResize);
        mediaQuery.removeEventListener('change', handleMediaChange);
      };
    }
  });
  
  const handleLogoClick = () => {
    // set clicking state immediately for visual feedback
    isLogoClicking = true;
    
    // change the page immediately
    currentSection.set('main');
    
    // start cloud spin immediately
    logoCloudComponent.spin().then(() => {
      // reset after animation completes
      setTimeout(() => {
        isLogoClicking = false;
      }, 50);
    });
  };

  const handleContactClick = () => {
    // set clicking state immediately for visual feedback
    isContactClicking = true;
    
    // change the page immediately
    currentSection.set('contact');
    
    // start cloud spin immediately
    contactCloudComponent.spin().then(() => {
      // reset after animation completes
      setTimeout(() => {
        isContactClicking = false;
      }, 50);
    });
  };
</script>

<!-- navbar with transparent background -->
<header class="fixed top-0 left-0 w-full z-50">
  <div class="flex justify-between items-center px-8 py-4">
    <!-- left side - logo cloud container -->
    <div bind:this={logoContainer} class="absolute {logoContainerPosition} {logoContainerSize}"
         class:transition-all={!disableTransitions} class:duration-200={!disableTransitions}>
      <Cloud3D bind:this={logoCloudComponent} />
      <div class="absolute inset-0 flex flex-col items-center justify-center"
           class:transition-all={!disableTransitions} class:duration-200={!disableTransitions}>
        <!-- shadow layer -->
        <img 
          src={logo} 
          alt="" 
          class="absolute h-7 md:h-10 w-auto mt-1 opacity-90 blur-sm transform translate-y-[6px]"
          class:scale-90={isLogoClicking}
        />
        <!-- main logo layer -->
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
    
    <!-- right side - contact cloud container -->
    <div bind:this={contactContainer} class="absolute {contactContainerPosition} {contactContainerSize}"
         class:transition-all={!disableTransitions} class:duration-200={!disableTransitions}>
      <Cloud3DReverse bind:this={contactCloudComponent} />
      <div class="absolute inset-0 flex flex-col items-center justify-center"
           class:transition-all={!disableTransitions} class:duration-200={!disableTransitions}>
        <button 
          class="relative border-0 p-0 text-primary font-aileron font-bold active:scale-90 transition-transform duration-50 flex items-center justify-center"
          class:opacity-90={$currentSection !== 'contact'}
          class:scale-90={isContactClicking}
          on:click={handleContactClick}
          aria-label="Contact section"
        >
          <!-- envelope svg icon -->
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" 
               class="{envelopeIconSize} transition-all duration-200 mt-3.5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
            <path d="M22 6l-10 7L2 6"></path>
          </svg>
        </button>
      </div>
    </div>
    
    <!-- hidden work button (preserved for future use) -->
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