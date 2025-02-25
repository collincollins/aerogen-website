<script lang="ts">
  import { onMount } from 'svelte';
  import * as THREE from 'three';
  import { currentSection, fun_mode } from './stores/navigation';
  import { browser } from '$app/environment';
  
  let container: HTMLDivElement;
  let scene: THREE.Scene;
  let camera: THREE.OrthographicCamera;
  let renderer: THREE.WebGLRenderer;
  let clouds: THREE.Group[] = [];
  let frameId: number;
  let isPageVisible = true;
  let funModeEnabled = true; // Track fun_mode status
  
  // Track the current section for smooth transitions
  let currentSectionValue = 'main';
  let targetPosition = 0;
  let currentPosition = 0;
  
  // Define all available sections
  const sections: Record<string, { position: number }> = {
    main: { position: 0 },
    contact: { position: 100 },
    work: { position: 200 }
  };

  // Type for cloud positions
  type CloudPosition = {
    x: number;
    y: number;
    z: number;
    scale: number;
  };

  // Configuration for world bounds and cloud distribution
  const worldConfig = {
    width: 700,  // Total width of the cloud world
    height: 300,  // Total height of the cloud world
    topBoundary: 50  // Distance from top where clouds should not appear (in world units)
  };
  
  // Detect Chrome browser to disable cloud rotation
  let disableCloudRotation = false;
  
  // Create a cloud using the original cloud generation logic
  const createCloud = () => {
    const group = new THREE.Group();
    
    // Create geometries and materials once, then reuse
    const sphereGeometry = new THREE.SphereGeometry(4, 12, 12);
    const material = new THREE.MeshPhysicalMaterial({
      color: 0xFFFFFF,
      roughness: 0.9,
      metalness: 0.0,
      clearcoat: 0.5,
      clearcoatRoughness: 1,
      emissive: 0xFFFFFF,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.95,
    });

    // Use original denser cloud layout
    const positions = [];
    const radius = 10;
    const layers = 3;
    
    for (let layer = 0; layer < layers; layer++) {
      const layerRadius = radius - (layer * 2);
      // Original sphere count per layer for denser appearance
      const numSpheresInLayer = Math.floor(12 * (1 - layer * 0.2));
      
      for (let i = 0; i < numSpheresInLayer; i++) {
        const angle = (i / numSpheresInLayer) * Math.PI * 2;
        positions.push({
          x: Math.cos(angle) * layerRadius,
          y: layer * 3 - 4,
          z: Math.sin(angle) * layerRadius
        });
      }
    }
    
    // Add additional spheres for the center area to make clouds appear fuller
    for (let i = 0; i < 6; i++) {
      positions.push({
        x: (Math.random() - 0.5) * 5,
        y: (Math.random() - 0.5) * 5,
        z: (Math.random() - 0.5) * 5
      });
    }
    
    positions.forEach(pos => {
      const sphere = new THREE.Mesh(sphereGeometry, material);
      sphere.position.x = pos.x + (Math.random() - 0.5) * 2;
      sphere.position.y = pos.y + (Math.random() - 0.5) * 2;
      sphere.position.z = pos.z + (Math.random() - 0.5) * 2;
      
      // Add subtle vertical oscillation to each sphere, but pre-compute some values
      const oscillationSpeed = 0.0005 + Math.random() * 0.05;
      const oscillationOffset = Math.random() * Math.PI * 2;
      const oscillationAmplitude = 0.1 + Math.random() * 0.2;
      
      // Store these values more efficiently
      sphere.userData = {
        oscillationSpeed,
        oscillationOffset,
        oscillationAmplitude,
        originalY: sphere.position.y
      };
      
      group.add(sphere);
    });

    // Assign random rotation speed - keeps slow enough to not strain CPU
    group.userData.rotationSpeed = 0.00005 + Math.random() * 0.0005;
    
    return group;
  };

  // Generate a random position that doesn't overlap with existing clouds
  const generateCloudPosition = (
    z: number,
    scale: number,
    existingPositions: CloudPosition[]
  ) => {
    const MIN_CLOUD_DISTANCE_FACTOR = 2.2;
    
    // Try to find a non-overlapping position
    for (let attempt = 0; attempt < 50; attempt++) {
      const x = (Math.random() - 0.5) * worldConfig.width;
      const y = (Math.random() - 0.5) * worldConfig.height;
      
      // Skip positions too close to the top
      if (y > (worldConfig.height/2 - worldConfig.topBoundary)) continue;
      
      // Check for overlaps
      let overlaps = false;
      for (const pos of existingPositions) {
        const dx = x - pos.x;
        const dy = y - pos.y;
        const dz = z - pos.z;
        const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
        const minDistance = (scale + pos.scale) * 10 * MIN_CLOUD_DISTANCE_FACTOR;
      
      if (distance < minDistance) {
          overlaps = true;
          break;
        }
      }
      
      if (!overlaps) {
        return { x, y, z, scale };
      }
    }
    
    // If we couldn't find a non-overlapping position, return a fallback
    return {
      x: (Math.random() - 0.5) * worldConfig.width,
      y: (Math.random() - 0.5) * worldConfig.height * 0.7, // Bias toward bottom
      z,
      scale
    };
  };
  
  // Set up the clouds in the scene
  const setupClouds = () => {
    // Skip cloud creation if fun_mode is disabled
    if (!funModeEnabled) {
      return;
    }
    
    // Clear existing clouds
    clouds.forEach(cloud => scene.remove(cloud));
    clouds = [];
    
    // Create clouds in three layers for parallax effect
    const layers = [
      { 
        z: -150,
        count: Math.ceil((worldConfig.width * worldConfig.height) / 30000),
        minScale: 0.6,
        maxScale: 0.8
      },
      { 
        z: -100,
        count: Math.ceil((worldConfig.width * worldConfig.height) / 20000),
        minScale: 0.8,
        maxScale: 1.2
      },
      { 
        z: -50,
        count: Math.ceil((worldConfig.width * worldConfig.height) / 30000),
        minScale: 1.3,
        maxScale: 1.4
      }
    ];
    
    const existingPositions: CloudPosition[] = [];
    
    // Create clouds for each layer
    layers.forEach(layer => {
      for (let i = 0; i < layer.count; i++) {
        const scale = layer.minScale + Math.random() * (layer.maxScale - layer.minScale);
        const position = generateCloudPosition(layer.z, scale, existingPositions);
        
        // Skip if the position is too close to the top
        if (position.y > (worldConfig.height/2 - worldConfig.topBoundary)) continue;
        
        existingPositions.push(position);
        
        const cloud = createCloud();
        cloud.position.set(position.x, position.y, position.z);
        cloud.scale.setScalar(scale);
        
        // Calculate parallax factor based on z-depth
        const parallaxFactor = Math.pow(1 - Math.abs(layer.z) / 200, 2);
        cloud.userData.parallaxFactor = parallaxFactor;
        cloud.userData.baseX = position.x;
        
        scene.add(cloud);
        clouds.push(cloud);
      }
    });
  };

  // Initialize the Three.js scene
  const initScene = () => {
    scene = new THREE.Scene();
    
    // Set up orthographic camera
    const aspect = window.innerWidth / window.innerHeight;
    const frustumSize = 300;
    camera = new THREE.OrthographicCamera(
      frustumSize * aspect / -2,
      frustumSize * aspect / 2,
      frustumSize / 2,
      frustumSize / -2,
      0.1,
      1000
    );
    
    camera.position.z = 100;
    camera.lookAt(0, 0, 0);
    
    // Create renderer with original settings
    renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: true,
      precision: 'lowp',
      powerPreference: 'low-power'
    });
    
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = false;
    
    container.appendChild(renderer.domElement);

    // Add lighting from original code
    const ambientLight = new THREE.AmbientLight(0xFFFFFF, 2.0);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0);
    directionalLight.position.set(0, 100, 0);
    directionalLight.target.position.set(20, 0, 0);
    scene.add(directionalLight);
    scene.add(directionalLight.target);
    
    // Create the clouds
    setupClouds();
  };

  // Animation loop
  const animate = () => {
    frameId = requestAnimationFrame(animate);
    
    // Skip animation when tab is not visible
    if (!isPageVisible) return;
    
    // Smoothly transition to target position
    const positionDiff = targetPosition - currentPosition;
    if (Math.abs(positionDiff) > 0.1) {
      currentPosition += positionDiff * 0.1;
    }
    
    // Skip cloud updates if fun_mode is disabled
    if (!funModeEnabled) {
      // Just render the empty scene
      renderer.render(scene, camera);
      return;
    }
    
    // Update cloud positions with parallax effect
    clouds.forEach(cloud => {
      // Apply parallax based on section position
      cloud.position.x = cloud.userData.baseX - (currentPosition * cloud.userData.parallaxFactor);
      
      // Apply gentle rotation only if not Chrome
      if (!disableCloudRotation) {
        cloud.rotation.y += cloud.userData.rotationSpeed;
      }
      
      // Apply subtle oscillation to each sphere using original oscillation logic
      cloud.children.forEach((object) => {
        if (object.type === 'Mesh' && object.userData.originalY !== undefined) {
          const time = performance.now() * 0.001;
          const userData = object.userData;
          if (userData.oscillationSpeed) {
            const oscillation = Math.sin(time * userData.oscillationSpeed + userData.oscillationOffset) * userData.oscillationAmplitude;
            object.position.y = userData.originalY + oscillation;
          }
        }
      });
    });
    
    // Render the scene
    renderer.render(scene, camera);
  };

  onMount(() => {
    if (!browser) return;
    
    // Detect Chrome browser
    disableCloudRotation = navigator.userAgent.indexOf("Chrome") > -1 && navigator.userAgent.indexOf("Safari") > -1;
    
    // Subscribe to fun_mode
    const unsubscribeFunMode = fun_mode.subscribe(value => {
      funModeEnabled = value;
      
      // If we have an initialized scene, update it based on fun_mode
      if (scene) {
        if (!funModeEnabled) {
          // Remove all clouds when fun_mode is turned off
          clouds.forEach(cloud => scene.remove(cloud));
          clouds = [];
        } else {
          // Recreate clouds when fun_mode is turned on
          setupClouds();
        }
      }
    });
    
    // Initialize the scene
    initScene();
    
    // Start the animation loop
    frameId = requestAnimationFrame(animate);
    
    // Subscribe to section changes
    const unsubscribe = currentSection.subscribe(section => {
      currentSectionValue = section;
      targetPosition = sections[section]?.position || 0;
    });
    
    // Handle page visibility changes
    const handleVisibilityChange = () => {
      isPageVisible = !document.hidden;
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Handle window resize
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // Update camera
      const aspect = width / height;
      const frustumSize = 300;
      camera.left = frustumSize * aspect / -2;
      camera.right = frustumSize * aspect / 2;
      camera.top = frustumSize / 2;
      camera.bottom = frustumSize / -2;
      camera.updateProjectionMatrix();
      
      // Update renderer
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };
    
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      unsubscribe();
      unsubscribeFunMode();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('resize', handleResize);
      renderer?.dispose();
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
    };
  });
</script>

<div 
  bind:this={container} 
  class="fixed inset-0 overflow-hidden pointer-events-none -z-0"
/> 