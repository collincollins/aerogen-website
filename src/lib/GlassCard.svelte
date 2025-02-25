<script lang="ts">
  export let width = "w-full max-w-4xl";
  export let padding = "p-8";
  export let interactive = true;
  
  let isHovered = false;
  
  function handleMouseEnter() {
    if (interactive) isHovered = true;
  }
  
  function handleMouseLeave() {
    if (interactive) isHovered = false;
  }
</script>

<div 
  class="{width} mx-auto {padding} relative" 
  on:mouseenter={handleMouseEnter} 
  on:mouseleave={handleMouseLeave}
  role="region"
  aria-label="Interactive card"
>
  <div 
    class="glass-panel w-full h-full p-6 md:p-8 relative overflow-hidden transition-all duration-300 {isHovered ? 'shadow-2xl bg-white/75' : 'bg-white/60'}"
  >
    <div class="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none"></div>
    <div class="relative z-10">
      <slot />
    </div>
  </div>
</div>