<script lang="ts">
  import { onMount } from "svelte";
  import * as THREE from "three";
  import type { Scene, PerspectiveCamera, WebGLRenderer, Group } from "three";

  let container: HTMLDivElement;
  let scene: Scene;
  let camera: PerspectiveCamera; 
  let renderer: WebGLRenderer;
  let cloud: Group;

  onMount(() => {
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Set up scene, camera, and renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(90, width / height, 0.1, 2000);
    camera.position.set(0, 0, 40);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setClearColor(0x000000, 0); // Ensure transparent background
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    // Create a group to hold the cloud
    const cloud = new THREE.Group();

    // White material for cloud
    const material = new THREE.MeshPhysicalMaterial({
      color: 0xFFFFFF,
      roughness: 0.9,
      metalness: 0.0,
      clearcoat: 0.6,
      clearcoatRoughness: 1,
      emissive: 0xFFFFFF,
      emissiveIntensity: 0.5,
    });

    // Create several spheres arranged to form a cloud
    const sphereGeometry = new THREE.SphereGeometry(4, 32, 32);
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

    // Animation loop to rotate the cloud slowly for 3D effect
    function animate() {
      requestAnimationFrame(animate);
      cloud.rotation.y += 0.002;
      renderer.render(scene, camera);
    }
    animate();

    // Handle resizing
    window.addEventListener("resize", onWindowResize);
    function onWindowResize() {
      const width = container.clientWidth;
      const height = container.clientHeight;
      renderer.setSize(width, height);
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