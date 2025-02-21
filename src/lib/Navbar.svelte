<script lang="ts">
  import logo from "../images/logo.png"; // ensure the logo file exists at this location
  let isMenuOpen = false;
  const toggleMenu = () => {
    isMenuOpen = !isMenuOpen;
  }
</script>

<header class="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-sm border-b border-white/20">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
    <!-- Logo & Branding -->
    <div class="flex items-center">
      <img src="{logo}" alt="Aerogen Logo" class="h-12 w-auto mr-2" />
      <span class="text-xl font-light text-[rgb(29,73,167)] font-aileron mt-6">Aerogen Inc.</span>
    </div>
    <!-- Hamburger Icon -->
    <button
      on:click={toggleMenu}
      class="p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[rgb(29,73,167)]"
      aria-label={isMenuOpen ? 'Close Menu' : 'Open Menu'}>
      {#if isMenuOpen}
        <!-- X Icon -->
        <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      {:else}
        <!-- Hamburger Icon -->
        <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      {/if}
    </button>
  </div>
  {#if isMenuOpen}
    <!-- Dropdown Navigation -->
    <nav class="bg-white/90">
      <ul class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <li>
          <a href="/about" class="block text-lg text-[rgb(29,73,167)] font-aileron hover:text-[rgb(29,73,167)]">
            About
          </a>
        </li>
      </ul>
    </nav>
  {/if}
</header> 