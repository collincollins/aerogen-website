<script lang="ts">
  import { onMount } from "svelte";
  import * as THREE from "three";
  import type { Scene, PerspectiveCamera, WebGLRenderer, Group } from "three";

  let container: HTMLDivElement;
  let scene: Scene;
  let camera: PerspectiveCamera; 
  let renderer: WebGLRenderer;
  let cloud: Group;
  let spinProgress = 0;
  const normalRotationSpeed = 0.002;
  const fastRotationSpeed = 0.08;
  const spinDuration = 300; // ms
  let spinStartTime: number | null = null;

  // Easing function for smooth acceleration and deceleration
  const easeInOutQuad = (t: number): number => {
    return t < 0.5 ? 1.5 * t * t : 1 - Math.pow(-1.5 * t + 2, 2) / 2;
  };

  // Function to be called from parent
  export const spin = () => {
    return new Promise<void>((resolve) => {
      spinStartTime = performance.now();
      const animate = () => {
        const elapsed = performance.now() - spinStartTime!;
        spinProgress = Math.min(1, elapsed / spinDuration);
        
        if (spinProgress < 1) {
          requestAnimationFrame(animate);
        } else {
          spinProgress = 0;
          spinStartTime = null;
          resolve();
        }
      };
      animate();
    });
  };

  onMount(() => {
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Set up scene, camera, and renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(90, width / height, 0.1, 2000);
    camera.position.set(0, 0, 40);

    // Enhanced renderer settings for better resolution
    const renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: true,
      precision: 'highp',
      // powerPreference: 'high-performance'
    });
    
    // Match device pixel ratio for sharper rendering
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(width, height);
    
    // Enable shadow mapping for better quality
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    container.appendChild(renderer.domElement);

    // Create a group to hold the cloud
    const cloud = new THREE.Group();

    // White material for cloud
    const material = new THREE.MeshPhysicalMaterial({
      color: 0xFFFFFF,
      roughness: 0.9,
      metalness: 0.0,
      clearcoat: 0.8,
      clearcoatRoughness: 1,
      emissive: 0xFFFFFF,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 1,
    });

    // Create several spheres arranged to form a cloud
    const sphereGeometry = new THREE.SphereGeometry(4, 64, 64);
    // Create a more uniform cloud shape
    const positions = [];
    const radius = 10;
    const layers = 3;
    
    // Generate positions in a more organized pattern
    for (let layer = 0; layer < layers; layer++) {
      const layerRadius = radius - (layer * 2);
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
    
    // Add some randomness to the positions
    positions.forEach(pos => {
      const sphere = new THREE.Mesh(sphereGeometry, material);
      sphere.position.x = pos.x + (Math.random() - 0.5) * 2;
      sphere.position.y = pos.y + (Math.random() - 0.5) * 2;
      sphere.position.z = pos.z + (Math.random() - 0.5) * 2;
      cloud.add(sphere);
    });

    scene.add(cloud);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xFFFFFF, 2.0);
    scene.add(ambientLight);
    
    // Main directional light from above
    const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0); 
    directionalLight.position.set(0, 100, 0); 
    directionalLight.target.position.set(20, 0, 0); 
    scene.add(directionalLight);
    scene.add(directionalLight.target);

    // Modify animation loop for gentle perturbation
    function animate() {
      requestAnimationFrame(animate);
      
      // Calculate current rotation speed using easing
      const currentSpeed = spinStartTime 
        ? normalRotationSpeed + (fastRotationSpeed - normalRotationSpeed) * easeInOutQuad(spinProgress)
        : normalRotationSpeed;
        
      cloud.rotation.y += currentSpeed;
      renderer.render(scene, camera);
    }
    animate();

    // Update resize handler to account for pixel ratio
    function onWindowResize() {
      const width = container.clientWidth;
      const height = container.clientHeight;
      renderer.setSize(width, height);
      renderer.setPixelRatio(window.devicePixelRatio);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }

    return () => {
      window.removeEventListener("resize", onWindowResize);
      renderer.dispose();
    };
  });
</script>

<!-- The container will be sized by the parent -->
<div bind:this={container} class="w-full h-full"></div> 