<script lang="ts">
  import logo from "../images/logo.png"; // Ensure this file exists
  let isMenuOpen = false;
  const toggleMenu = () => {
    isMenuOpen = !isMenuOpen;
  }
</script>

<!-- Clickable Logo Card at Top Left with White Glow -->
<a href="/" class="fixed top-4 left-4">
  <div class="bg-white rounded-lg shadow-[0_0_10px_rgba(255,255,255,0.8)] p-3 flex items-center space-x-2">
    <img src="{logo}" alt="Aerogen Logo" class="h-12 w-auto mr-0" />
    <span class="text-lg font-light text-[rgb(29,73,167)] font-aileron mt-6 ml-0">Aerogen Inc.</span>
  </div>
</a>

<!-- Hamburger Button at Top Right -->
<div class="fixed top-4 right-4">
  <button 
    on:click={toggleMenu}
    class="p-2 focus:outline-none shadow-[0_0_10px_rgba(255,255,255,0.8)]"
    aria-label={isMenuOpen ? 'Close Menu' : 'Open Menu'}>
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
  <div class="fixed top-0 right-0 h-full w-64 bg-white shadow-lg p-4 transition-transform duration-300">
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