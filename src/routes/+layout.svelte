<script lang="ts">
  import "../app.css";
  import Navbar from "$lib/Navbar.svelte";
  import Footer from "$lib/Footer.svelte";
</script>

<Navbar />

<main class="min-h-screen bg-gradient-to-br from-[rgb(29,73,167)] to-[rgb(95,179,249)]">
  <slot />
  <Footer />
</main> 