<script lang="ts">
  import { currentSection } from './stores/navigation';
  import { slide } from 'svelte/transition';
  import { cubicInOut } from 'svelte/easing';

  const sections = {
    main: {
      component: null, // Will be rendered directly from +page.svelte
      position: 0
    },
    about: {
      component: null, // We'll create these components next
      position: 100
    },
    work: {
      component: null,
      position: 200
    }
  };

  $: transform = `translateX(-${sections[$currentSection].position}%)`;
</script>

<div class="relative w-full h-full overflow-hidden">
  <div
    class="flex transition-transform duration-300 ease-in-out"
    style="transform: {transform}"
  >
    <!-- Main content -->
    <div class="min-w-full">
      <slot name="main" />
    </div>

    <!-- About content -->
    <div class="min-w-full">
      <slot name="about" />
    </div>

    <!-- Work content -->
    <div class="min-w-full">
      <slot name="work" />
    </div>
  </div>
</div> 