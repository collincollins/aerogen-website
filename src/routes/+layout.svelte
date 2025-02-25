<script lang="ts">
  import "../app.css";
  import Navbar from "$lib/Navbar.svelte";
  import Footer from "$lib/Footer.svelte";
  import ContentSlider from "$lib/ContentSlider.svelte";
  import CloudBackground from "$lib/CloudBackground.svelte";
  import GlassCard from "$lib/GlassCard.svelte";
  import { currentSection } from "$lib/stores/navigation";
  import { showContentToggle } from "$lib/stores/devTools";
  import { onMount } from "svelte";
  import { slide } from "svelte/transition";
  import emailjs from '@emailjs/browser';
  
  // Import DevTools only in development mode
  import { browser } from "$app/environment";
  import DevTools from "$lib/DevTools.svelte";
  
  // Flag to control DevTools visibility (set to false for production)
  const showDevTools = browser && import.meta.env.DEV;
  
  // EmailJS configuration - in a real app, these would be environment variables
  const EMAILJS_SERVICE_ID = 'service_mc1ruf6';
  const EMAILJS_TEMPLATE_ID = 'template_ku692pa'; // Updated with correct template ID
  const EMAILJS_PUBLIC_KEY = 'eiQxZEm_9uv9OWC5f';
  const RECIPIENT_EMAIL = 'collinwcollins@gmail.com';
  
  // Track content visibility
  let showContent = true;
  showContentToggle.subscribe(value => {
    showContent = value;
  });
  
  // Form data
  let name = "";
  let email = "";
  let message = "";
  let isSubmitting = false;
  let submitSuccess = false;
  let submitError = "";
  
  // Initialize EmailJS and ensure content visibility in production
  onMount(() => {
    // Initialize EmailJS
    if (browser && EMAILJS_PUBLIC_KEY) {
      emailjs.init({
        publicKey: EMAILJS_PUBLIC_KEY
      });
    }
    
    // Ensure content is always visible in production
    if (!import.meta.env.DEV) {
      showContentToggle.set(true);
    }
  });
  
  // Handle form submission
  const handleSubmit = async () => {
    isSubmitting = true;
    submitError = "";
    
    try {
      // Validate form data
      if (!name || !email || !message) {
        throw new Error('All fields are required');
      }
      
      // Prepare template parameters for EmailJS
      const templateParams = {
        name: name,
        email: email,
        message: message,
        to_email: RECIPIENT_EMAIL,
        reply_to: email,
        subject: `Consulting inquiry from ${name}`
      };
      
      // Try to send directly from browser first (better user experience)
      if (browser && EMAILJS_PUBLIC_KEY) {
        await emailjs.send(
          EMAILJS_SERVICE_ID,
          EMAILJS_TEMPLATE_ID,
          templateParams,
          EMAILJS_PUBLIC_KEY
        );
      } else {
        // Fallback to server-side sending through our API endpoint
        const response = await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, message })
        });
        
        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to send email');
        }
      }
      
      isSubmitting = false;
      submitSuccess = true;
      
      // Reset form after success
      setTimeout(() => {
        name = "";
        email = "";
        message = "";
        submitSuccess = false;
      }, 3000);
    } catch (error) {
      console.error("Error sending email:", error);
      isSubmitting = false;
      submitError = error instanceof Error ? error.message : 'Failed to send email';
      
      // Clear error message after a few seconds
      setTimeout(() => {
        submitError = "";
      }, 5000);
    }
  };
</script>

<!-- Fixed gradient background -->
<div class="fixed inset-0 bg-gradient-to-b from-[rgb(29,73,167)] via-[rgb(62,126,208)] to-[rgb(95,179,249)]" />

<!-- Cloud background -->
<CloudBackground />

<!-- Scrollable content container -->
<div class="absolute inset-0 overflow-y-auto transition-opacity duration-300 hide-scrollbar" class:opacity-0={!showContent} class:pointer-events-none={!showContent}>
  <Navbar />
  
  <!-- Title panel - only shown on main page -->
  <div class="absolute top-[0rem] left-0 right-0 w-full flex justify-center z-30 pointer-events-none mt-6 transition-transform duration-500 ease-out"
       style="transform: translateX({$currentSection === 'main' ? '0' : '-100%'})">
    <h1 class="text-5xl md:text-6xl font-light text-white font-aileron title-glow">Aerogen</h1>
  </div>
  
  <main class="relative hide-scrollbar">
    <ContentSlider>
      <div slot="main" class="min-h-screen flex flex-col items-center justify-center gap-8 py-24">
        <!-- Main card -->
        <GlassCard width="w-full max-w-2xl">
          <div class="flex flex-col items-center text-center">
            <p class="text-primary text-xl leading-relaxed mb-6">
              Aviation consulting with decades of operational expertise
            </p>
            <hr class="w-24 border-primary/90 mb-6" />
            <p class="text-primary leading-relaxed">
              From airline operations to strategic growth, we bring executive-level experience 
              from leading airlines to help your aviation business reach new heights.
            </p>
          </div>
        </GlassCard>
        
        <!-- About content that was moved from the about/contact page -->
        <GlassCard width="w-full max-w-4xl mt-[-30px]">
          <div class="flex flex-col md:flex-row gap-8 items-center mb-6">
            <div class="w-48 h-48 rounded-full overflow-hidden border-4 border-primary/90 shadow-lg flex-shrink-0">
              <img src="/src/images/founder.jpeg" alt="Founder of Aerogen Inc." class="w-full h-full object-cover" />
            </div>
            
            <div>
              <h3 class="text-2xl font-light text-primary font-aileron mb-4">About the Founder</h3>
              
              <p class="text-primary leading-relaxed mb-4">
                I've been part of aviation since childhood. My father founded Tropic Air in Belize in 1979, which grew to become the country's largest airline. Growing up in this environment, I learned the aviation business from every angle.
              </p>
            </div>
          </div>
          
          <p class="text-primary leading-relaxed mb-4">
            My path led to the U.S. Air Force where I flew C-17 aircraft, followed by over 20 years in airline leadership. During this time, I managed operations at Tropic Air and Southern Airways Express, helping the former develop into the largest airline in Belize and the latter develop into the largest commuter airline in the United States.
          </p>
          
          <p class="text-primary leading-relaxed">
            These experiences in operational leadership, team building, and strategic expansion now inform my work at Aerogen Inc., where we provide specialized aviation consulting services.
          </p>
        </GlassCard>
      </div>
      
      <div slot="contact" class="min-h-screen flex items-center justify-center py-24">
        <!-- Contact inquiry form moved from the main page -->
        <GlassCard width="w-full max-w-2xl" padding="p-6">
          <div class="text-center mb-5">
            <h2 class="text-2xl font-light text-primary font-aileron">Contact Us</h2>
          </div>
          
          <form on:submit|preventDefault={handleSubmit} class="space-y-4">
            <div>
              <label for="name" class="block text-sm font-medium text-gray-700 mb-1 font-aileron">Name</label>
              <input 
                type="text" 
                id="name" 
                bind:value={name} 
                required 
                class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/50 focus:border-primary/50 bg-white/80 backdrop-blur-sm font-aileron"
              />
            </div>
            
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700 mb-1 font-aileron">Email</label>
              <input 
                type="email" 
                id="email" 
                bind:value={email} 
                required 
                class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/50 focus:border-primary/50 bg-white/80 backdrop-blur-sm font-aileron"
              />
            </div>
            
            <div>
              <label for="message" class="block text-sm font-medium text-gray-700 mb-1 font-aileron">Message</label>
              <textarea 
                id="message" 
                bind:value={message} 
                required 
                rows="3" 
                class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/50 focus:border-primary/50 bg-white/80 backdrop-blur-sm font-aileron"
              ></textarea>
            </div>
            
            {#if submitError}
              <div class="bg-red-50 border border-red-300 rounded-md p-3 text-sm text-red-600">
                {submitError}
              </div>
            {/if}
            
            <div class="flex justify-center pt-2">
              <button 
                type="submit" 
                disabled={isSubmitting || submitSuccess}
                class="px-6 py-2 bg-gradient-to-r from-primary to-accent text-white rounded-full shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-70 flex items-center justify-center min-w-[120px] font-aileron"
              >
                {#if isSubmitting}
                  <span class="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                  Sending...
                {:else if submitSuccess}
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                  Sent!
                {:else}
                  Send Inquiry
                {/if}
              </button>
            </div>
          </form>
        </GlassCard>
      </div>
      
      <!-- Work section (inactive but preserved for future use)
      <div slot="work" class="min-h-screen flex items-center justify-center py-24">
        <GlassCard>
          <h2 class="text-3xl font-light text-primary font-aileron mb-6">Our Work</h2>
          <p class="text-text-primary0 leading-relaxed">
            Explore our portfolio of successful cloud implementations across various industries.
            From startups to enterprise solutions, we've helped businesses transform their digital presence.
          </p>
        </GlassCard>
      </div> -->
    </ContentSlider>
  </main>
  <Footer />
</div>

<!-- Developer tools -->
{#if showDevTools}
  <DevTools />
{/if} 