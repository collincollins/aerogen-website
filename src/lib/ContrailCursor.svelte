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
  
  // Airplane flyby configuration
  const AIRPLANE = {
    size: 50,                   // Size of airplane in pixels (smaller version)
    aspectRatio: 746/279,       // Width/height ratio of the cessna.png image
    speed: 60,                 // Pixels per second (reduced for slower movement)
    interval: 30000,            // Milliseconds between flybys (10 seconds)
    jitter: 2000,               // Random variance in timing (±1 second)
    contrailDensity: 1,         // Frames between contrail emissions
    contrailColor: 'rgba(255, 255, 255, 0.9)',
    contrailLife: 3000          // Longer life for airplane contrails (3 seconds)
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
  let flybyInterval: number | null = null;
  let airplaneElements: HTMLDivElement[] = [];
  
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
                Math.random() * (CONFIG.particleSize[1] - CONFIG.particleSize[0]) * 0.2;
    
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
  
  // Create an airplane contrail particle
  function createAirplaneContrail(x: number, y: number, dirX: number, dirY: number) {
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
      backgroundColor: AIRPLANE.contrailColor,
      opacity: String(opacity),
      transform: `translate(${x}px, ${y}px)`,
      pointerEvents: 'none',
      filter: 'blur(1px)',
      zIndex: '5' // Below the airplane (z-index 7)
    });
    
    // Add to container
    container.appendChild(particle);
    particles.push(particle);
    
    // Store only essential data for animation
    particle.dataset.x = String(x);
    particle.dataset.y = String(y);
    
    // Contrails trail in the opposite direction of airplane movement
    // with slight randomness
    particle.dataset.velX = String(-dirX * (0.1 + Math.random() * 0.2));
    particle.dataset.velY = String(-dirY * (0.1 + Math.random() * 0.2));
    particle.dataset.age = '0';
    particle.dataset.size = String(size);
    particle.dataset.opacity = String(opacity);
    particle.dataset.isAirplaneContrail = 'true'; // Mark as airplane contrail
    
    // Limit total particles
    if (particles.length > CONFIG.maxParticles) {
      const oldParticle = particles.shift();
      if (oldParticle && container.contains(oldParticle)) {
        container.removeChild(oldParticle);
      }
    }
  }
  
  // Create and animate an airplane flyby
  function createAirplaneFlyby() {
    if (!browser || !container) return;
    
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Create airplane element (using image instead of div)
    const airplane = document.createElement('img');
    airplane.src = '/cessna.png';
    
    // Calculate start and end positions (left to right only)
    let startX, startY, endX, endY, dirX, dirY, distance, rotation;
    
    // Start from left side
    startX = -AIRPLANE.size * AIRPLANE.aspectRatio;
    startY = viewportHeight * (0.3 + Math.random() * 0.4); // Middle 40% of screen height
    endX = viewportWidth + AIRPLANE.size * AIRPLANE.aspectRatio;
    endY = startY + (Math.random() * viewportHeight * 0.2 - viewportHeight * 0.1); // Small vertical variance
    
    // Calculate direction vector
    dirX = endX - startX;
    dirY = endY - startY;
    distance = Math.sqrt(dirX * dirX + dirY * dirY);
    
    // Normalize direction
    dirX = dirX / distance;
    dirY = dirY / distance;
    
    // Calculate rotation angle (no extra degrees - keep natural orientation)
    rotation = Math.atan2(dirY, dirX) * (180 / Math.PI);
    
    // Style the airplane
    Object.assign(airplane.style, {
      position: 'absolute',
      left: '0',
      top: '0',
      width: `${AIRPLANE.size * AIRPLANE.aspectRatio}px`,
      height: `${AIRPLANE.size}px`,
      transform: `translate(${startX}px, ${startY}px) rotate(${rotation}deg)`,
      pointerEvents: 'none',
      zIndex: '7', // Higher than contrails (adjusted value)
      // Remove the filter to show original colors
      opacity: '0.9'
    });
    
    // Add to container
    container.appendChild(airplane);
    airplaneElements.push(airplane);
    
    // Store data for animation
    airplane.dataset.x = String(startX);
    airplane.dataset.y = String(startY);
    airplane.dataset.dirX = String(dirX);
    airplane.dataset.dirY = String(dirY);
    airplane.dataset.rotation = String(rotation);
    airplane.dataset.elapsed = '0';
    airplane.dataset.contrailCount = '0';
    
    // Calculate animation duration based on distance and speed
    const duration = distance / AIRPLANE.speed * 1000; // ms
    airplane.dataset.duration = String(duration);
  }
  
  // Animation loop (optimized)
  function animateParticles() {
    // Animate contrail particles
    particles = particles.filter(particle => {
      // Increment age
      const age = Number(particle.dataset.age) + 16; // Assuming ~60fps
      particle.dataset.age = String(age);
      
      // Determine particle life based on type
      const isAirplaneContrail = particle.dataset.isAirplaneContrail === 'true';
      const particleLife = isAirplaneContrail ? AIRPLANE.contrailLife : CONFIG.particleLife;
      
      // Remove old particles
      if (age > particleLife) {
        container.removeChild(particle);
        return false;
      }
      
      // Calculate life percentage
      const lifePercentage = age / particleLife;
      
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
    
    // Animate airplane elements
    airplaneElements = airplaneElements.filter(airplane => {
      // Get data
      const elapsed = Number(airplane.dataset.elapsed) + 16; // Assuming ~60fps
      const duration = Number(airplane.dataset.duration);
      const x = Number(airplane.dataset.x);
      const y = Number(airplane.dataset.y);
      const dirX = Number(airplane.dataset.dirX);
      const dirY = Number(airplane.dataset.dirY);
      let rotation = Number(airplane.dataset.rotation);
      let contrailCount = Number(airplane.dataset.contrailCount);
      
      // Remove completed airplanes
      if (elapsed >= duration) {
        container.removeChild(airplane);
        return false;
      }
      
      // Calculate simple linear position
      const timeElapsed = elapsed / 1000; // in seconds
      const newX = x + dirX * (timeElapsed * AIRPLANE.speed);
      const newY = y + dirY * (timeElapsed * AIRPLANE.speed);
      
      // Emit contrails
      contrailCount++;
      if (contrailCount >= AIRPLANE.contrailDensity) {
        // Create contrail at the back of the airplane based on current rotation
        const radians = rotation * (Math.PI / 180);
        // Position contrails further back from the plane and lower (behind engines rather than tailfin)
        const contrailOffsetX = Math.cos(radians + Math.PI) * (AIRPLANE.size * AIRPLANE.aspectRatio * 0.4);
        
        // Add vertical offset to position contrails lower (for horizontal flight)
        // This shifts the contrail down from the tailfin to the exhaust area
        const verticalAdjust = AIRPLANE.size * 0.46; // Downward shift
        const contrailOffsetY = Math.sin(radians + Math.PI) * (AIRPLANE.size * 0.01) + verticalAdjust;
        
        const contrailX = newX + contrailOffsetX*0.01;
        const contrailY = newY + contrailOffsetY;
        
        // Use actual direction for contrail movement
        const actualDirX = Math.cos(radians);
        const actualDirY = Math.sin(radians);
        
        createAirplaneContrail(contrailX, contrailY, actualDirX, actualDirY);
        contrailCount = 0;
      }
      
      // Update styles
      airplane.style.transform = `translate(${newX}px, ${newY}px) rotate(${rotation}deg)`;
      
      // Update data
      airplane.dataset.elapsed = String(elapsed);
      airplane.dataset.contrailCount = String(contrailCount);
      
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
    
    // Set up airplane flybys at regular intervals
    flybyInterval = window.setInterval(() => {
      createAirplaneFlyby();
    }, AIRPLANE.interval + (Math.random() * AIRPLANE.jitter - AIRPLANE.jitter / 2));
    
    // Create an initial flyby soon after page load
    setTimeout(createAirplaneFlyby, 2000);
    
    return () => {
      // Clean up
      window.removeEventListener('mousemove', handleMouseMove);
      if (flybyInterval) clearInterval(flybyInterval);
      cancelAnimationFrame(animationId);
      
      // Clean up all elements
      particles.forEach(p => {
        if (container && container.contains(p)) {
          container.removeChild(p);
        }
      });
      
      airplaneElements.forEach(a => {
        if (container && container.contains(a)) {
          container.removeChild(a);
        }
      });
    };
  });
  
  onDestroy(() => {
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
    if (flybyInterval) {
      clearInterval(flybyInterval);
    }
  });
</script>

<div bind:this={container} class="contrail-container fixed inset-0 pointer-events-none z-[0]"></div>

<style>
  .contrail-container {
    /* Lower z-index to ensure it's above background but below clouds and other content */
    overflow: visible;
    contain: layout;
  }
</style> 