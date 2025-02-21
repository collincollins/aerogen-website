<script lang="ts">
  import "../app.css";
  import Navbar from "$lib/Navbar.svelte";
  import Footer from "$lib/Footer.svelte";
</script>

<!-- Fixed gradient background -->
<div class="fixed inset-0 bg-gradient-to-br from-[rgb(29,73,167)] to-[rgb(95,179,249)]" />

<!-- Scrollable content container -->
<div class="relative min-h-screen">
  <Navbar />
  <main class="relative">
    <slot />
  </main>
  <Footer />
</div> 