<script lang="ts">
  import Cloud3D from "$lib/Cloud3D.svelte";
  import logo from "../images/logo.png";
  import { goto } from "$app/navigation";
  
  let cloudComponent: Cloud3D;
  let isClicking = false;
  
  const handleLogoClick = async () => {
    isClicking = true;
    await cloudComponent.spin();
    isClicking = false;
    goto('/');
  };
</script>

<!-- Navbar with transparent background -->
<header class="fixed top-0 left-0 w-full z-50">
  <!-- Cloud container in upper left -->
  <div class="absolute top-[-5rem] left-[-3.5rem] w-[14rem] h-[14rem]">
    <Cloud3D bind:this={cloudComponent} />
    <div class="absolute inset-0 flex flex-col items-center justify-center">
      <!-- Shadow layer -->
      <img 
        src={logo} 
        alt="" 
        class="absolute h-7 w-auto mt-2.5 opacity-90 blur-sm transform translate-y-[3px]
              transition-transform duration-300"
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
          class="h-9 w-auto mt-1 cursor-pointer transition-transform duration-250"
          class:scale-90={isClicking}
        />
      </button>
    </div>
  </div>

  <!-- Hamburger Button at Top Right -->
  <!-- <div class="absolute top-4 right-4">
    <button 
      on:click={toggleMenu}
      class="p-2 focus:outline-none"
      aria-label={isMenuOpen ? "Close Menu" : "Open Menu"}>
      {#if isMenuOpen} -->
        <!-- White X Icon -->
        <!-- <svg class="h-8 w-8 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      {:else} -->
        <!-- White Hamburger Icon -->
        <!-- <svg class="h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      {/if}
    </button>
  </div> -->

  <!-- Sliding Panel from the Right -->
  <!-- {#if isMenuOpen}
    <div class="absolute top-0 right-0 h-screen w-64 bg-white shadow-lg p-4 transition-transform duration-300">
      <nav>
        <ul>
          <li class="mb-4">
            <a href="/about" class="text-lg text-gray-800 font-aileron">
              About
            </a>
          </li>
        </ul>
      </nav>
    </div>
  {/if} -->
</header> 