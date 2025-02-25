<script lang="ts">
  import { currentSection, activeNavSections, type Section } from './stores/navigation';
  import { slide } from 'svelte/transition';
  import { cubicInOut } from 'svelte/easing';

  const sections = {
    main: {
      component: null, // Will be rendered directly from +page.svelte
      position: 0
    },
    contact: {
      component: null, // We'll create these components next
      position: 100
    },
    // Keep work section for future use
    work: {
      component: null,
      position: 200
    }
  };

  $: transform = `translateX(-${sections[$currentSection].position}%)`;
  
  // Helper function to check if a section is active
  function isSectionActive(section: Section): boolean {
    return activeNavSections.includes(section);
  }
  
  // Prevent navigation to inactive sections
  $: if (!isSectionActive($currentSection)) {
    currentSection.set('main');
  }
</script>

<div class="relative w-full h-full overflow-hidden hide-scrollbar">
  <div
    class="flex transition-transform duration-500 ease-out hide-scrollbar"
    style="transform: {transform}"
  >
    <!-- Main content -->
    <div class="min-w-full hide-scrollbar">
      <div class="mx-[10%] hide-scrollbar">
        <slot name="main" />
      </div>
    </div>

    <!-- Contact content -->
    <div class="min-w-full hide-scrollbar">
      <div class="mx-[10%] hide-scrollbar">
        <slot name="contact" />
      </div>
    </div>

    <!-- Work content (preserved but hidden from navigation) -->
    <div class="min-w-full hide-scrollbar">
      <div class="mx-[10%] hide-scrollbar">
        <slot name="work" />
      </div>
    </div>
  </div>
</div> 