<script lang="ts">
  import "../app.css";
  import Navbar from "$lib/Navbar.svelte";
  import Footer from "$lib/Footer.svelte";
</script>

<!-- Fixed gradient background -->
<div class="fixed inset-0 bg-gradient-to-b from-[rgb(29,73,167)] via-[rgb(62,126,208)] to-[rgb(95,179,249)]" />

<!-- Scrollable content container -->
<div class="absolute inset-0 overflow-y-auto">
  <Navbar />
  <main class="relative">
    <slot />
  </main>
  <Footer />
</div> 