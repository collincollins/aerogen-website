<script lang="ts">
  import { fun_mode } from './stores/navigation';
  
  // social media links excluding instagram
  const socialLinks = [
    {
      name: 'X',
      url: 'https://x.com',
      svg: `<svg class="h-5 w-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
           </svg>`
    },
    {
      name: 'LinkedIn',
      url: 'https://www.linkedin.com/company/aerogen-inc/',
      svg: `<svg class="h-6 w-6 text-primary" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7c0-1-1-2-2-2s-2 1-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
              <rect x="2" y="9" width="4" height="12"/>
              <circle cx="4" cy="4" r="2"/>
           </svg>`
    }
  ];
  
  // Toggle fun_mode
  const toggleFunMode = () => {
    fun_mode.update(value => !value);
  };
  
  // Subscribe to fun_mode to get current value
  let funModeEnabled = true;
  fun_mode.subscribe(value => {
    funModeEnabled = value;
  });
</script>

<footer class="py-8 mt-8">
  <div class="w-full max-w-lg mx-auto p-4 relative">

    <!-- glass card -->
    <div class="glass-panel w-full h-full p-6 relative overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>
      
      <div class="relative z-10 flex flex-col items-center">
        <div class="flex space-x-6 mb-4">
          {#each socialLinks as link}
            <a 
              href={link.url} 
              target="_blank" 
              aria-label={link.name} 
              rel="noopener noreferrer"
              class="hover:opacity-80 transition-opacity flex items-center justify-center"
            >
              {@html link.svg}
            </a>
          {/each}
          
          <!-- Fun Mode Toggle -->
          <!-- <button 
            on:click={toggleFunMode}
            on:keydown={(e) => e.key === 'Enter' && toggleFunMode()}
            tabindex="0"
            aria-label={funModeEnabled ? "Disable visual effects" : "Enable visual effects"}
            class="p-1 rounded-md hover:bg-white/10 transition-colors flex items-center"
          >
            <svg class="h-6 w-6" fill="none" stroke={funModeEnabled ? "#5EB3F9" : "#1D49A7"} viewBox="0 0 24 24" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
            </svg>
          </button> -->
        </div>
        <p class="text-sm text-primary-dark font-aileron font-light">&copy; {new Date().getFullYear()} Aerogen Inc. All rights reserved.</p>
      </div>
    </div>
  </div>
</footer> 