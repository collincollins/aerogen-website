<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  
  // Configuration for a smoke-like contrail effect (optimized)
  const CONFIG = {
    maxParticles: 500,          // Balanced for performance and density
    particleLife: 1000,         // Longer life for better trail visibility
    emissionRate: 1,            // Balanced emission rate
    particleSize: [3, 7],       // Starting size (slightly smaller max)
    particleOpacity: [0.6, 0.9], // Higher starting opacity
    color: 'rgba(255, 255, 255, 0.8)' // Semi-transparent white
  };

  let container: HTMLDivElement;
  let particles: HTMLDivElement[] = [];
  let animationId: number;
  let mouseX = 0;
  let mouseY = 0;
  let lastX = 0;
  let lastY = 0;
  let prevDx = 0;
  let prevDy = 0;
  
  // Create a particle at the current mouse position (optimized)
  function createParticle() {
    // Calculate mouse movement delta
    const dx = mouseX - lastX;
    const dy = mouseY - lastY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Don't create particles if mouse is stationary
    if (distance < 1) return;
    
    // Store movement direction (or use previous direction if tiny movement)
    if (distance > 2) {
      prevDx = dx;
      prevDy = dy;
    }
    
    // Update last position
    lastX = mouseX;
    lastY = mouseY;
    
    // Create particle element
    const particle = document.createElement('div');
    
    // Generate random size 
    const size = CONFIG.particleSize[0] + 
                Math.random() * (CONFIG.particleSize[1] - CONFIG.particleSize[0]);
    
    // Initial opacity
    const opacity = CONFIG.particleOpacity[0] + 
                   Math.random() * (CONFIG.particleOpacity[1] - CONFIG.particleOpacity[0]);
    
    // Style the particle
    Object.assign(particle.style, {
      position: 'absolute',
      left: '0',
      top: '0',
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: '50%',
      backgroundColor: CONFIG.color,
      opacity: String(opacity),
      transform: `translate(${mouseX}px, ${mouseY}px)`,
      pointerEvents: 'none',
      filter: 'blur(1px)'
    });
    
    // Add to container
    container.appendChild(particle);
    particles.push(particle);
    
    // Calculate direction vector (normalized)
    const dirLength = Math.sqrt(prevDx * prevDx + prevDy * prevDy);
    let dirX = dirLength > 0 ? prevDx / dirLength : 0;
    let dirY = dirLength > 0 ? prevDy / dirLength : 0;
    
    // Store only essential data for animation
    particle.dataset.x = String(mouseX);
    particle.dataset.y = String(mouseY);
    particle.dataset.velX = String(-dirX * (0.3 + Math.random() * 0.3)); // Trails behind cursor
    particle.dataset.velY = String(-dirY * (0.3 + Math.random() * 0.3));
    particle.dataset.age = '0';
    particle.dataset.size = String(size);
    particle.dataset.opacity = String(opacity);
    
    // Limit total particles
    if (particles.length > CONFIG.maxParticles) {
      const oldParticle = particles.shift();
      if (oldParticle && container.contains(oldParticle)) {
        container.removeChild(oldParticle);
      }
    }
  }
  
  // Animation loop (optimized)
  function animateParticles() {
    particles = particles.filter(particle => {
      // Increment age
      const age = Number(particle.dataset.age) + 16; // Assuming ~60fps
      particle.dataset.age = String(age);
      
      // Remove old particles
      if (age > CONFIG.particleLife) {
        container.removeChild(particle);
        return false;
      }
      
      // Calculate life percentage
      const lifePercentage = age / CONFIG.particleLife;
      
      // Get current position
      const x = Number(particle.dataset.x);
      const y = Number(particle.dataset.y);
      
      // Get velocity (slows down over time)
      const velX = Number(particle.dataset.velX) * (1 - lifePercentage * 0.6);
      const velY = Number(particle.dataset.velY) * (1 - lifePercentage * 0.6) - 0.01; // Slight upward drift
      
      // Update position
      const newX = x + velX;
      const newY = y + velY;
      particle.dataset.x = String(newX);
      particle.dataset.y = String(newY);
      
      // Get original size
      const originalSize = Number(particle.dataset.size);
      
      // IMPORTANT: Slightly DECREASE size to simulate z-depth (moving away from viewer)
      // This creates the effect of the contrail receding into the distance
      const sizeReduction = originalSize * 0.2 * lifePercentage;
      const newSize = Math.max(0.5, originalSize - sizeReduction);
      
      // Fade out
      const originalOpacity = Number(particle.dataset.opacity);
      const newOpacity = originalOpacity * (1 - lifePercentage);
      
      // Update styles (minimal properties)
      particle.style.transform = `translate(${newX}px, ${newY}px)`;
      particle.style.width = `${newSize}px`;
      particle.style.height = `${newSize}px`;
      particle.style.opacity = String(newOpacity);
      particle.style.filter = `blur(${1 + lifePercentage * 2}px)`;
      
      return true;
    });
    
    // Continue animation loop
    animationId = requestAnimationFrame(animateParticles);
  }
  
  onMount(() => {
    if (!browser) return;
    
    // Start animation
    animationId = requestAnimationFrame(animateParticles);
    
    // Add mouse tracking (with throttling for performance)
    let lastEmit = 0;
    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      
      // Limit particle emission rate
      const now = Date.now();
      if (now - lastEmit > CONFIG.emissionRate) {
        createParticle();
        lastEmit = now;
      }
    };
    
    // Add event listener
    window.addEventListener('mousemove', handleMouseMove);
    
    // Set initial position to avoid first-particle jump
    lastX = window.innerWidth / 2;
    lastY = window.innerHeight / 2;
    
    return () => {
      // Clean up
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationId);
      particles.forEach(p => {
        if (container && container.contains(p)) {
          container.removeChild(p);
        }
      });
    };
  });
  
  onDestroy(() => {
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
  });
</script>

<div bind:this={container} class="contrail-container fixed inset-0 pointer-events-none z-[5]"></div>

<style>
  .contrail-container {
    /* Lower z-index to ensure it's above background but below content cards */
    overflow: visible;
    contain: layout;
  }
</style> 