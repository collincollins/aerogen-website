<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import { fun_mode } from './stores/navigation';
  
  // Check if the browser is Chrome
  let isChrome = false;
  
  // Subscribe to fun_mode to control visual effects
  let funModeEnabled = true;
  
  // separate configurations for cursor and airplane contrails
  const CONFIG = {
    // core parameters
    maxParticles: 300,      // maximum number of particles in the system
    
    // cursor contrail parameters
    cursor: {
      particleLife: 800,    // shorter lifespan for cursor particles
      emissionRate: 1,      // emit frequently for density
      particlesPerEmission: 2, // multiple particles per emission for ribbon effect
      particleSize: 3,      // base size of particles
      blurAmount: 2,        // blur effect for smoother appearance
      spreadFactor: 5       // spread factor for ribbon width
    },
    
    // airplane contrail parameters
    airplane: {
      particleLife: 4000,   // longer lifespan for airplane contrails
      emissionRate: 20,     // emit more frequently for denser trails
      particleSize: 3,      // slightly larger particles
      blurAmount: 2,        // more blur for smoke-like appearance
      fadeDelay: 0.6,       // start fading earlier
      spreadFactor: 1.5     // spread factor for contrail width
    },
    
    // airplane parameters
    airplaneInterval: 40000, // time between airplane appearances (ms)
    airplaneSpeed: 60,       // speed of airplane movement
    airplaneSize: 40,        // base size of the airplane
    airplaneAspectRatio: 746/279 // width/height ratio of the airplane image
  };

  // DOM references
  let container: HTMLDivElement;
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let airplaneElements: HTMLImageElement[] = []; // store airplane DOM elements
  
  // state variables
  let particles: Particle[] = [];
  let mouseX = 0;
  let mouseY = 0;
  let lastMouseX = 0;
  let lastMouseY = 0;
  let lastEmitTime = 0;
  let animationId: number;
  let isPageVisible = true;
  let flybyInterval: number | null = null;
  let lastFrameTime = 0; // Track last frame time for delta time calculation
  
  // Export isChrome for use in other components
  export let disableCloudRotation = false;
  
  // define particle type with additional properties
  type Particle = {
    x: number;
    y: number;
    size: number;
    age: number;
    maxLife: number;
    isContrail: boolean;
    velocityX?: number;
    velocityY?: number;
  };
  
  // create a new cursor particle
  function createCursorParticle(x: number, y: number): Particle {
    // calculate movement direction for ribbon effect
    const dx = x - lastMouseX;
    const dy = y - lastMouseY;
    
    // add perpendicular offset for ribbon width
    let perpX = 0;
    let perpY = 0;
    
    if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
      // calculate perpendicular vector
      const length = Math.sqrt(dx * dx + dy * dy);
      if (length > 0) {
        perpX = -dy / length * CONFIG.cursor.spreadFactor;
        perpY = dx / length * CONFIG.cursor.spreadFactor;
      }
    }
    
    // add slight randomness to the perpendicular offset
    const randomFactor = Math.random() * 0.8 + 0.6; // 0.6 to 1.4
    perpX *= randomFactor;
    perpY *= randomFactor;
    
    // create particle with randomized size
    return {
      x: x + perpX,
      y: y + perpY,
      size: CONFIG.cursor.particleSize * (0.8 + Math.random() * 0.4),
      age: 0,
      maxLife: CONFIG.cursor.particleLife,
      isContrail: false,
      velocityX: (Math.random() - 0.5) * 0.2,
      velocityY: (Math.random() - 0.5) * 0.2 - 0.1 // slight upward drift
    };
  }
  
  // create a new airplane contrail particle
  function createAirplaneContrail(x: number, y: number): Particle {
    // add position variation based on spread factor
    const offsetX = (Math.random() - 0.5) * CONFIG.airplane.spreadFactor * 2;
    const offsetY = (Math.random() - 0.5) * CONFIG.airplane.spreadFactor * 2;
    
    // create particle with randomized size
    return {
      x: x + offsetX,
      y: y + offsetY,
      size: CONFIG.airplane.particleSize * (0.9 + Math.random() * 0.3),
      age: 0,
      maxLife: CONFIG.airplane.particleLife * (0.8 + Math.random() * 0.4), // randomize lifespan
      isContrail: true,
      velocityX: (Math.random() - 0.5) * 0.3,
      velocityY: (Math.random() - 0.5) * 0.3 - 0.05 // very slight upward drift
    };
  }
  
  // create a new airplane that will fly across the screen
  function createAirplane() {
    if (!browser || !container || !funModeEnabled) return; // Skip if fun_mode is disabled
    
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // create airplane element (using image)
    const airplane = document.createElement('img');
    airplane.src = '/cessna.png';
    
    // calculate start and end positions (left to right only)
    const startX = -CONFIG.airplaneSize * CONFIG.airplaneAspectRatio;
    const startY = viewportHeight * (0.3 + Math.random() * 0.4); // middle 40% of screen height
    const endX = viewportWidth + CONFIG.airplaneSize * CONFIG.airplaneAspectRatio;
    const endY = startY + (Math.random() * viewportHeight * 0.2 - viewportHeight * 0.1); // small vertical variance
    
    // calculate direction vector
    const dx = endX - startX;
    const dy = endY - startY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // normalize direction
    const dirX = dx / distance;
    const dirY = dy / distance;
    
    // calculate rotation angle
    const rotation = Math.atan2(dirY, dirX) * (180 / Math.PI);
    
    // style the airplane
    Object.assign(airplane.style, {
      position: 'absolute',
      left: '0',
      top: '0',
      width: `${CONFIG.airplaneSize * CONFIG.airplaneAspectRatio}px`,
      height: `${CONFIG.airplaneSize}px`,
      transform: `translate(${startX}px, ${startY}px) rotate(${rotation}deg)`,
      pointerEvents: 'none',
      zIndex: '-100', // behind contrails and clouds
      opacity: '1.0'
    });
    
    // add to container
    container.appendChild(airplane);
    airplaneElements.push(airplane);
    
    // store data for animation
    airplane.dataset.x = String(startX);
    airplane.dataset.y = String(startY);
    airplane.dataset.endX = String(endX);
    airplane.dataset.endY = String(endY);
    airplane.dataset.rotation = String(rotation);
    airplane.dataset.startTime = String(performance.now());
    airplane.dataset.lastEmitTime = '0';
    
    // calculate animation duration based on distance and speed
    const duration = distance / CONFIG.airplaneSpeed * 1000; // ms
    airplane.dataset.duration = String(duration);
  }
  
  // main animation loop
  function animate() {
    // skip if not visible
    if (!isPageVisible || !ctx) {
      animationId = requestAnimationFrame(animate);
      return;
    }
    
    const now = performance.now();
    const deltaTime = now - (lastFrameTime || now);
    lastFrameTime = now;
    
    const width = canvas.width;
    const height = canvas.height;
    
    // clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Skip all particle generation and drawing if fun_mode is disabled
    if (!funModeEnabled) {
      animationId = requestAnimationFrame(animate);
      return;
    }
    
    // check if we should emit new cursor particles
    if (now - lastEmitTime > CONFIG.cursor.emissionRate) {
      // calculate mouse movement since last position
      const dx = mouseX - lastMouseX;
      const dy = mouseY - lastMouseY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // only create particles if the mouse is actually moving and not Chrome
      if (!isChrome && distance > 1 && mouseX > 0 && mouseY > 0) {
        // create multiple particles per emission for ribbon effect
        for (let i = 0; i < CONFIG.cursor.particlesPerEmission; i++) {
          particles.push(createCursorParticle(mouseX, mouseY));
        }
        
        // update last position
        lastMouseX = mouseX;
        lastMouseY = mouseY;
      }
      
      lastEmitTime = now;
    }
    
    // update and draw particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.age += deltaTime; // use actual time between frames
      
      // remove old particles
      if (p.age > p.maxLife) {
        particles.splice(i, 1);
        continue;
      }
      
      // update position if velocity is defined
      if (p.velocityX !== undefined && p.velocityY !== undefined) {
        p.x += p.velocityX;
        p.y += p.velocityY;
        
        // slow down velocity over time
        p.velocityX *= 0.98;
        p.velocityY *= 0.98;
      }
      
      // calculate opacity based on age and type
      const lifeRatio = p.age / p.maxLife;
      let opacity;
      
      if (p.isContrail) {
        // airplane contrails stay visible longer before fading
        opacity = lifeRatio < CONFIG.airplane.fadeDelay 
          ? 0.2 
          : 0.2 * (1 - ((lifeRatio - CONFIG.airplane.fadeDelay) / (1 - CONFIG.airplane.fadeDelay)));
      } else {
        // cursor contrails use similar fade pattern as airplane contrails
        opacity = lifeRatio < 0.6
          ? 0.3
          : 0.3 * (1 - ((lifeRatio - 0.6) / 0.4));
      }
      
      // calculate size based on age and type
      let size;
      if (p.isContrail) {
        // airplane contrails expand slightly then shrink
        const sizeMultiplier = lifeRatio < 0.3 
          ? 1 + lifeRatio * 0.7 
          : 1.21 - (lifeRatio - 0.3) * 0.3;
        size = p.size * sizeMultiplier;
      } else {
        // cursor contrails just shrink slightly at the end
        size = p.size * (lifeRatio > 0.7 ? 1 - (lifeRatio - 0.7) * 0.5 : 1);
      }
      
      // draw particle with appropriate blur
      ctx.filter = p.isContrail 
        ? `blur(${CONFIG.airplane.blurAmount}px)` 
        : `blur(${CONFIG.cursor.blurAmount}px)`;
      
      ctx.beginPath();
      ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
      ctx.fill();
    }
    
    // update airplane positions and create contrails
    airplaneElements = airplaneElements.filter(airplane => {
      // get data
      const startTime = Number(airplane.dataset.startTime);
      const duration = Number(airplane.dataset.duration);
      const elapsed = now - startTime;
      const startX = Number(airplane.dataset.x);
      const startY = Number(airplane.dataset.y);
      const endX = Number(airplane.dataset.endX);
      const endY = Number(airplane.dataset.endY);
      const rotation = Number(airplane.dataset.rotation);
      const lastEmitTime = Number(airplane.dataset.lastEmitTime || '0');
      
      // remove completed airplanes
      if (elapsed >= duration) {
        container.removeChild(airplane);
        return false;
      }
      
      // calculate current position
      const progress = elapsed / duration;
      const dx = endX - startX;
      const dy = endY - startY;
      const currentX = startX + dx * progress;
      const currentY = startY + dy * progress;
      
      // update airplane position
      airplane.style.transform = `translate(${currentX}px, ${currentY}px) rotate(${rotation}deg)`;
      
      // create contrail particles at regular intervals - only if not Chrome
      if (!isChrome && now - lastEmitTime > CONFIG.airplane.emissionRate) {
        // calculate contrail position (behind the airplane)
        const radians = rotation * (Math.PI / 180);
        
        // position contrail directly behind the airplane
        const trailDistance = -85;
        const contrailX = currentX - Math.cos(radians) * trailDistance;
        const contrailY = currentY - Math.sin(radians) * trailDistance + 33;
        
        // create a single contrail particle
        particles.push(createAirplaneContrail(contrailX, contrailY));
        
        // update last emit time
        airplane.dataset.lastEmitTime = String(now);
      }
      
      return true;
    });
    
    // limit total particles
    while (particles.length > CONFIG.maxParticles) {
      // remove oldest particles first
      particles.shift();
    }
    
    // continue animation loop
    animationId = requestAnimationFrame(animate);
  }
  
  // handle window resize
  function handleResize() {
    if (!canvas || !ctx) return;
    
    // update canvas dimensions
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // reset context properties after resize
    ctx.globalCompositeOperation = 'lighter'; // makes overlapping particles brighter
  }
  
  // Function to clean up airplane elements when fun_mode changes
  function clearAirplanes() {
    airplaneElements.forEach(airplane => {
      if (container && container.contains(airplane)) {
        container.removeChild(airplane);
      }
    });
    airplaneElements = [];
  }
  
  onMount(() => {
    if (!browser) return;
    
    // Detect Chrome browser
    isChrome = navigator.userAgent.indexOf("Chrome") > -1 && navigator.userAgent.indexOf("Safari") > -1;
    
    // Set the disableCloudRotation flag based on browser
    disableCloudRotation = isChrome;
    
    // Subscribe to fun_mode store
    const unsubscribeFunMode = fun_mode.subscribe(value => {
      funModeEnabled = value;
      
      // Clean up airplanes if fun_mode is disabled
      if (!funModeEnabled) {
        clearAirplanes();
      }
    });
    
    // create canvas
    canvas = document.createElement('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.position = 'absolute';
    canvas.style.left = '0';
    canvas.style.top = '0';
    canvas.style.pointerEvents = 'none';
    
    // get context and set initial properties
    ctx = canvas.getContext('2d')!;
    ctx.globalCompositeOperation = 'lighter';
    
    // add canvas to container
    container.appendChild(canvas);
    
    // start animation
    lastFrameTime = performance.now();
    animationId = requestAnimationFrame(animate);
    
    // handle page visibility changes
    const handleVisibilityChange = () => {
      isPageVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // track mouse movement
    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    
    // handle window resize
    window.addEventListener('resize', handleResize);
    
    // set up airplane flybys
    flybyInterval = window.setInterval(() => {
      if (isPageVisible && !document.hidden && funModeEnabled) {
        createAirplane();
      }
    }, CONFIG.airplaneInterval);
    
    // create an initial flyby
    if (funModeEnabled) {
      setTimeout(createAirplane, 2000);
    }
    
    return () => {
      // clean up
      unsubscribeFunMode();
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('resize', handleResize);
      if (flybyInterval) clearInterval(flybyInterval);
      if (animationId) cancelAnimationFrame(animationId);
      
      // remove canvas
      if (canvas && container.contains(canvas)) {
        container.removeChild(canvas);
      }
      
      // remove airplane elements
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
    overflow: visible;
    contain: layout;
    transform: translateZ(0);
    will-change: transform;
  }
</style> 