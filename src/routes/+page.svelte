<script lang="ts">
  // Page-specific logic (if any)

  // Social media links excluding Instagram
  const socialLinks = [
    {
      name: 'Twitter',
      url: 'https://twitter.com',
      svg: `<svg class="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M22.46 6c-.77.35-1.5.59-2.3.69a4.12 4.12 0 0 0 1.8-2.27 8.14 8.14 0 0 1-2.6 1 4.1 4.1 0 0 0-7 3.75 11.64 11.64 0 0 1-8.45-4.3 4.1 4.1 0 0 0 1.27 5.48 4 4 0 0 1-1.86-.51v.05a4.1 4.1 0 0 0 3.28 4 4.1 4.1 0 0 1-1.85.07 4.1 4.1 0 0 0 3.83 2.85A8.21 8.21 0 0 1 2 18.57a11.6 11.6 0 0 0 6.29 1.84c7.55 0 11.68-6.26 11.68-11.68q0-.27-.01-.55A8.34 8.34 0 0 0 24 4.56a8.2 8.2 0 0 1-2.34.64z"></path>
           </svg>`
    },
    {
      name: 'LinkedIn',
      url: 'https://linkedin.com',
      svg: `<svg class="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7c0-1-1-2-2-2s-2 1-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
              <rect x="2" y="9" width="4" height="12"/>
              <circle cx="4" cy="4" r="2"/>
           </svg>`
    }
  ];
</script>

<!-- Add multiple sections to demonstrate the scroll effect -->
<div class="min-h-screen flex items-center justify-center">
  <div class="glass-panel px-16 py-12 flex flex-col items-center justify-center">
    <h1 class="text-xl font-light text-primary font-aileron">
      Aerogen Inc.
    </h1>
    <h2 class="text-sm font-light text-primary font-aileron mt-2">
      (In Progress...)
    </h2>
  </div>
</div>

<!-- Add more sections to demonstrate scroll -->
<div class="min-h-screen flex items-center justify-center">
  <div class="glass-panel px-16 py-12">
    <h2 class="text-xl font-light text-primary font-aileron">Section 2</h2>
    <p class="text-sm text-primary/80 mt-4">Scroll for more content...</p>
  </div>
</div>

<!-- Footer content -->
<div class="py-4 mt-8 mb-20">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center">
    <div class="flex space-x-4 mb-2">
      {#each socialLinks as link}
        <a 
          href={link.url} 
          target="_blank" 
          aria-label={link.name} 
          rel="noopener noreferrer"
        >
          {@html link.svg}
        </a>
      {/each}
    </div>
    <p class="text-sm text-white font-aileron">
      &copy; {new Date().getFullYear()} Aerogen Inc. All rights reserved.
    </p>
  </div>
</div>
