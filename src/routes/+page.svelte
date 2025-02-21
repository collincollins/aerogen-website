<script>
  import Cloud3D from "$lib/Cloud3D.svelte";
</script>

<div class="min-h-screen flex items-center justify-center relative">
  <!-- 3D Cloud rendered via Three.js -->
  <div class="absolute inset-0">
    <Cloud3D />
  </div>
  
  <!-- Overlay the title on top of the 3D cloud -->
  <div class="relative z-10 text-center">
    <h1 class="text-4xl font-light text-[rgb(29,73,167)] font-aileron">
      Welcome to Aerogen
    </h1>
    <p class="mt-4 text-gray-800 font-aileron">
      Basic Tailwind Test
    </p>
  </div>
</div>
