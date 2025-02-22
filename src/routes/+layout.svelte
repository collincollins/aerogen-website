<script lang="ts">
  import "../app.css";
  import Navbar from "$lib/Navbar.svelte";
  import Footer from "$lib/Footer.svelte";
  import ContentSlider from "$lib/ContentSlider.svelte";
  import { currentSection } from "$lib/stores/navigation";
</script>

<!-- Fixed gradient background -->
<div class="fixed inset-0 bg-gradient-to-b from-[rgb(29,73,167)] via-[rgb(62,126,208)] to-[rgb(95,179,249)]" />

<!-- Scrollable content container -->
<div class="absolute inset-0 overflow-y-auto">
  <Navbar />
  <main class="relative">
    <ContentSlider>
      <div slot="main">
        <slot />
      </div>
      
      <div slot="about" class="min-h-screen flex items-center justify-center">
        <h2 class="text-3xl font-light text-white font-aileron">About Us</h2>
      </div>
      
      <div slot="work" class="min-h-screen flex items-center justify-center">
        <h2 class="text-3xl font-light text-white font-aileron">Our Work</h2>
      </div>
    </ContentSlider>
  </main>
  <Footer />
</div> 