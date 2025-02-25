<script lang="ts">
  import "../app.css";
  import Navbar from "$lib/Navbar.svelte";
  import Footer from "$lib/Footer.svelte";
  import ContentSlider from "$lib/ContentSlider.svelte";
  import CloudBackground from "$lib/CloudBackground.svelte";
  import GlassCard from "$lib/GlassCard.svelte";
  import { currentSection } from "$lib/stores/navigation";
</script>

<!-- Fixed gradient background -->
<div class="fixed inset-0 bg-gradient-to-b from-[rgb(29,73,167)] via-[rgb(62,126,208)] to-[rgb(95,179,249)]" />

<!-- Cloud background -->
<CloudBackground />

<!-- Scrollable content container -->
<div class="absolute inset-0 overflow-y-auto">
  <Navbar />
  <main class="relative">
    <ContentSlider>
      <div slot="main" class="min-h-screen flex items-center justify-center py-24">
        <GlassCard>
          <slot />
        </GlassCard>
      </div>
      
      <div slot="about" class="min-h-screen flex items-center justify-center py-24">
        <GlassCard>
          <h2 class="text-3xl font-light text-primary font-aileron mb-6">About Us</h2>
          <p class="text-gray-700 leading-relaxed">
            Welcome to Aerogen Inc. We specialize in cloud-based solutions that elevate your business to new heights.
            Our team of experts is dedicated to creating innovative, scalable, and reliable cloud infrastructure.
          </p>
        </GlassCard>
      </div>
      
      <!-- Work section (inactive but preserved for future use) -->
      <div slot="work" class="min-h-screen flex items-center justify-center py-24">
        <GlassCard>
          <h2 class="text-3xl font-light text-primary font-aileron mb-6">Our Work</h2>
          <p class="text-gray-700 leading-relaxed">
            Explore our portfolio of successful cloud implementations across various industries.
            From startups to enterprise solutions, we've helped businesses transform their digital presence.
          </p>
        </GlassCard>
      </div>
    </ContentSlider>
  </main>
  <Footer />
</div> 