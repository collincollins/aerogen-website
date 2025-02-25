<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  
  // configuration for a smoke-like contrail effect (optimized)
  const CONFIG = {
    maxParticles: 400,          // increased to allow for longer contrails
    particleLife: 3000,         // increased to match airplane contrail life (5000)
    emissionRate: 0.5,            // set to same value as airplane.contrailDensity
    particleSize: [3, 7],       // kept the same
    particleOpacity: [0.6, 0.9], // kept the same
    color: 'rgba(255, 255, 255, 0.8)', // kept the same
    moveThreshold: 3            // reduced threshold for more responsive trail creation
  };
  
  // Airplane flyby configuration
  const AIRPLANE = {
    size: 40,                   // kept the same
    aspectRatio: 746/279,       // kept the same
    speed: 50,                  // kept the same
    interval: 50000,            // kept the same
    jitter: 2000,               // kept the same
    contrailDensity: 2,         // kept the same
    contrailColor: 'rgba(255, 255, 255, 0.9)',
    contrailLife: 5000          // kept the same
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
  
  // create a particle at the current mouse position (optimized)
  function createParticle() {
    // calculate mouse movement delta
    const dx = mouseX - lastX;
    const dy = mouseY - lastY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // don't create particles if mouse is stationary or moving very little
    if (distance < CONFIG.moveThreshold) return;
    
    // store movement direction (or use previous direction if tiny movement)
    if (distance > 2) {
      prevDx = dx;
      prevDy = dy;
    }
    
    // update last position
    lastX = mouseX;
    lastY = mouseY;
    
    // create particle element
    const particle = document.createElement('div');
    
    // generate random size - use same calculation as airplane contrails
    const size = CONFIG.particleSize[0] + 
                Math.random() * (CONFIG.particleSize[1] - CONFIG.particleSize[0]);
    
    // initial opacity - match airplane contrail opacity
    const opacity = CONFIG.particleOpacity[0] + 
                   Math.random() * (CONFIG.particleOpacity[1] - CONFIG.particleOpacity[0]);
    
    // style the particle
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
    
    // add to container
    container.appendChild(particle);
    particles.push(particle);
    
    // calculate direction vector (normalized)
    const dirLength = Math.sqrt(prevDx * prevDx + prevDy * prevDy);
    let dirX = dirLength > 0 ? prevDx / dirLength : 0;
    let dirY = dirLength > 0 ? prevDy / dirLength : 0;
    
    // store only essential data for animation
    particle.dataset.x = String(mouseX);
    particle.dataset.y = String(mouseY);
    particle.dataset.velX = String(-dirX * (0.1 + Math.random() * 0.2)); // match airplane contrail velocity
    particle.dataset.velY = String(-dirY * (0.1 + Math.random() * 0.2)); // match airplane contrail velocity
    particle.dataset.age = '0';
    particle.dataset.size = String(size);
    particle.dataset.opacity = String(opacity);
    
    // limit total particles
    if (particles.length > CONFIG.maxParticles) {
      const oldParticle = particles.shift();
      if (oldParticle && container.contains(oldParticle)) {
        container.removeChild(oldParticle);
      }
    }
  }
  
  // Create an airplane contrail particle
  function createAirplaneContrail(x: number, y: number, dirX: number, dirY: number) {
    // create particle element
    const particle = document.createElement('div');
    
    // generate random size 
    const size = CONFIG.particleSize[0] + 
                Math.random() * (CONFIG.particleSize[1] - CONFIG.particleSize[0]);
    
    // initial opacity
    const opacity = CONFIG.particleOpacity[0] + 
                   Math.random() * (CONFIG.particleOpacity[1] - CONFIG.particleOpacity[0]);
    
    // style the particle
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
    
    // add to container
    container.appendChild(particle);
    particles.push(particle);
    
    // store only essential data for animation
    particle.dataset.x = String(x);
    particle.dataset.y = String(y);
    
    // contrails trail in the opposite direction of airplane movement
    // with slight randomness
    particle.dataset.velX = String(-dirX * (0.1 + Math.random() * 0.2));
    particle.dataset.velY = String(-dirY * (0.1 + Math.random() * 0.2));
    particle.dataset.age = '0';
    particle.dataset.size = String(size);
    particle.dataset.opacity = String(opacity);
    particle.dataset.isAirplaneContrail = 'true'; // mark as airplane contrail
    
    // limit total particles
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
    
    // create airplane element (using image instead of div)
    const airplane = document.createElement('img');
    airplane.src = '/cessna.png';
    
    // calculate start and end positions (left to right only)
    let startX, startY, endX, endY, dirX, dirY, distance, rotation;
    
    // start from left side
    startX = -AIRPLANE.size * AIRPLANE.aspectRatio;
    startY = viewportHeight * (0.3 + Math.random() * 0.4); // middle 40% of screen height
    endX = viewportWidth + AIRPLANE.size * AIRPLANE.aspectRatio;
    endY = startY + (Math.random() * viewportHeight * 0.2 - viewportHeight * 0.1); // small vertical variance
    
    // calculate direction vector
    dirX = endX - startX;
    dirY = endY - startY;
    distance = Math.sqrt(dirX * dirX + dirY * dirY);
    
    // normalize direction
    dirX = dirX / distance;
    dirY = dirY / distance;
    
    // calculate rotation angle (no extra degrees - keep natural orientation)
    rotation = Math.atan2(dirY, dirX) * (180 / Math.PI);
    
    // style the airplane
    Object.assign(airplane.style, {
      position: 'absolute',
      left: '0',
      top: '0',
      width: `${AIRPLANE.size * AIRPLANE.aspectRatio}px`,
      height: `${AIRPLANE.size}px`,
      transform: `translate(${startX}px, ${startY}px) rotate(${rotation}deg)`,
      pointerEvents: 'none',
      zIndex: '7', // higher than contrails (adjusted value)
      // remove the filter to show original colors
      opacity: '0.9'
    });
    
    // add to container
    container.appendChild(airplane);
    airplaneElements.push(airplane);
    
    // store data for animation
    airplane.dataset.x = String(startX);
    airplane.dataset.y = String(startY);
    airplane.dataset.dirX = String(dirX);
    airplane.dataset.dirY = String(dirY);
    airplane.dataset.rotation = String(rotation);
    airplane.dataset.elapsed = '0';
    airplane.dataset.contrailCount = '0';
    
    // calculate animation duration based on distance and speed
    const duration = distance / AIRPLANE.speed * 1000; // ms
    airplane.dataset.duration = String(duration);
  }
  
  // animation loop (optimized)
  function animateParticles() {
    // use requestAnimationFrame timestamp for frame skipping
    const now = performance.now();
    const shouldUpdateAll = true; // always update airplane positions for smooth movement
    const shouldUpdateParticles = now % 32 < 16; // only update particle styles every other frame
    
    // skip animation frames when tab is not visible
    if (document.hidden) {
      animationId = requestAnimationFrame(animateParticles);
      return;
    }
    
    // animate contrail particles
    particles = particles.filter(particle => {
      // increment age
      const age = Number(particle.dataset.age) + 16; // assuming ~60fps
      particle.dataset.age = String(age);
      
      // determine particle life based on type
      const isAirplaneContrail = particle.dataset.isAirplaneContrail === 'true';
      const particleLife = isAirplaneContrail ? AIRPLANE.contrailLife : CONFIG.particleLife;
      
      // remove old particles
      if (age > particleLife) {
        container.removeChild(particle);
        return false;
      }
      
      // skip visual updates on alternate frames to save CPU
      if (!shouldUpdateParticles) return true;
      
      // calculate life percentage
      const lifePercentage = age / particleLife;
      
      // get current position
      const x = Number(particle.dataset.x);
      const y = Number(particle.dataset.y);
      
      // get velocity (slows down over time)
      const velX = Number(particle.dataset.velX) * (1 - lifePercentage * 0.6);
      const velY = Number(particle.dataset.velY) * (1 - lifePercentage * 0.6) - 0.01; // slight upward drift
      
      // update position
      const newX = x + velX;
      const newY = y + velY;
      particle.dataset.x = String(newX);
      particle.dataset.y = String(newY);
      
      // get original size
      const originalSize = Number(particle.dataset.size);
      
      // IMPORTANT: Slightly DECREASE size to simulate z-depth (moving away from viewer)
      // this creates the effect of the contrail receding into the distance
      const sizeReduction = originalSize * 0.2 * lifePercentage;
      const newSize = Math.max(0.5, originalSize - sizeReduction);
      
      // fade out
      const originalOpacity = Number(particle.dataset.opacity);
      const newOpacity = originalOpacity * (1 - lifePercentage);
      
      // update styles (minimal properties)
      particle.style.transform = `translate(${newX}px, ${newY}px)`;
      particle.style.width = `${newSize}px`;
      particle.style.height = `${newSize}px`;
      particle.style.opacity = String(newOpacity);
      particle.style.filter = `blur(${1 + lifePercentage * 2}px)`;
      
      return true;
    });
    
    // animate airplane elements
    airplaneElements = airplaneElements.filter(airplane => {
      // get data
      const elapsed = Number(airplane.dataset.elapsed) + 16; // assuming ~60fps
      const duration = Number(airplane.dataset.duration);
      const x = Number(airplane.dataset.x);
      const y = Number(airplane.dataset.y);
      const dirX = Number(airplane.dataset.dirX);
      const dirY = Number(airplane.dataset.dirY);
      let rotation = Number(airplane.dataset.rotation);
      let contrailCount = Number(airplane.dataset.contrailCount);
      
      // remove completed airplanes
      if (elapsed >= duration) {
        container.removeChild(airplane);
        return false;
      }
      
      // calculate simple linear position
      const timeElapsed = elapsed / 1000; // in seconds
      const newX = x + dirX * (timeElapsed * AIRPLANE.speed);
      const newY = y + dirY * (timeElapsed * AIRPLANE.speed);
      
      // emit contrails
      contrailCount++;
      if (contrailCount >= AIRPLANE.contrailDensity) {
        // create contrail at the back of the airplane based on current rotation
        const radians = rotation * (Math.PI / 180);
        // position contrails further back from the plane and lower (behind engines rather than tailfin)
        const contrailOffsetX = Math.cos(radians + Math.PI) * (AIRPLANE.size * AIRPLANE.aspectRatio * 0.4);
        
        // add vertical offset to position contrails lower (for horizontal flight)
        // this shifts the contrail down from the tailfin to the exhaust area
        const verticalAdjust = AIRPLANE.size * 0.47; // downward shift
        const contrailOffsetY = Math.sin(radians + Math.PI) * (AIRPLANE.size * 0.01) + verticalAdjust;
        
        const contrailX = newX + contrailOffsetX*0.01;
        const contrailY = newY + contrailOffsetY;
        
        // use actual direction for contrail movement
        const actualDirX = Math.cos(radians);
        const actualDirY = Math.sin(radians);
        
        createAirplaneContrail(contrailX, contrailY, actualDirX, actualDirY);
        contrailCount = 0;
      }
      
      // update styles
      airplane.style.transform = `translate(${newX}px, ${newY}px) rotate(${rotation}deg)`;
      
      // update data
      airplane.dataset.elapsed = String(elapsed);
      airplane.dataset.contrailCount = String(contrailCount);
      
      return true;
    });
    
    // continue animation loop
    animationId = requestAnimationFrame(animateParticles);
  }
  
  onMount(() => {
    if (!browser) return;
    
    // start animation
    animationId = requestAnimationFrame(animateParticles);
    
    // add mouse tracking (with throttling for performance)
    let lastEmit = 0;
    let frameCount = 0;
    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      
      // counter to limit particle emission rate
      frameCount++;
      
      // only emit every CONFIG.emissionRate frames and if enough time has passed
      if (frameCount % CONFIG.emissionRate !== 0) return;
      
      // additional time-based throttling
      const now = Date.now();
      if (now - lastEmit > 16) { // minimum 16ms between emissions (roughly 60fps)
        createParticle();
        lastEmit = now;
      }
    };
    
    // add event listener with passive flag for performance
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    
    // set initial position to avoid first-particle jump
    lastX = window.innerWidth / 2;
    lastY = window.innerHeight / 2;
    
    // reduce the rate of animation loops when tab is inactive
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // pause airplane generation when tab is not visible
        if (flybyInterval) {
          clearInterval(flybyInterval);
          flybyInterval = null;
        }
      } else {
        // resume airplane generation when tab becomes visible again
        if (!flybyInterval) {
          flybyInterval = window.setInterval(() => {
            createAirplaneFlyby();
          }, AIRPLANE.interval + (Math.random() * AIRPLANE.jitter - AIRPLANE.jitter / 2));
        }
      }
    });
    
    // set up airplane flybys at regular intervals
    flybyInterval = window.setInterval(() => {
      createAirplaneFlyby();
    }, AIRPLANE.interval + (Math.random() * AIRPLANE.jitter - AIRPLANE.jitter / 2));
    
    // create an initial flyby soon after page load
    setTimeout(createAirplaneFlyby, 2000);
    
    return () => {
      // clean up
      window.removeEventListener('mousemove', handleMouseMove);
      if (flybyInterval) clearInterval(flybyInterval);
      cancelAnimationFrame(animationId);
      
      // clean up all elements
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
    /* lower z-index to ensure it's above background but below clouds and other content */
    overflow: visible;
    contain: layout;
  }
</style> 