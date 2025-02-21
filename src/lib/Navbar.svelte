<script lang="ts">
  import Cloud3D from "$lib/Cloud3D.svelte";
  import logo from "../images/logo.png"; // Ensure this file exists
  let isMenuOpen = false;
  
  const toggleMenu = () => {
    isMenuOpen = !isMenuOpen;
  }
</script>

<!-- Navbar with transparent background -->
<header class="fixed top-0 left-0 w-full z-50">
  <!-- Cloud container in upper left -->
  <div class="absolute top-[-10rem] left-[-8rem] w-[30rem] h-[30rem]">
    <Cloud3D />
    <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
      <img src={logo} alt="Aerogen Logo" class="h-16 w-auto" />
    </div>
  </div>

  <!-- Hamburger Button at Top Right -->
  <div class="absolute top-4 right-4">
    <button 
      on:click={toggleMenu}
      class="p-2 focus:outline-none"
      aria-label={isMenuOpen ? "Close Menu" : "Open Menu"}>
      {#if isMenuOpen}
        <!-- White X Icon -->
        <svg class="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      {:else}
        <!-- White Hamburger Icon -->
        <svg class="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      {/if}
    </button>
  </div>

  <!-- Sliding Panel from the Right -->
  {#if isMenuOpen}
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
  {/if}
</header> 