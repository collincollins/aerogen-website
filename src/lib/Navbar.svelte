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
        class="absolute h-7 w-auto mt-1 opacity-90 blur-sm transform translate-y-[6px]
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
</header> 