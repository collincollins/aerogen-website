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
  const normalRotationSpeed = -0.002; // negative for opposite direction
  const fastRotationSpeed = -0.09; // faster and negative for opposite direction
  const spinDuration = 200; // reduced for quicker response
  let spinStartTime: number | null = null;

  // enhanced easing function optimized for quick response
  const easeInOutCubic = (t: number): number => {
    // adjusted curve to be more aggressive in the middle
    return t < 0.5
      ? 10 * t * t * t  // increased for faster initial acceleration
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };

  // function to be called from parent - starts spinning immediately
  export const spin = (): Promise<void> => {
    // start spinning immediately
    spinStartTime = performance.now();
    spinProgress = 0.1; // start with some progress already
    
    return new Promise<void>((resolve) => {
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
      // start animation immediately
      animate();
    });
  };

  onMount(() => {
    const width = container.clientWidth;
    const height = container.clientHeight;

    // set up scene, camera, and renderer
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(90, width / height, 0.1, 2000);
    camera.position.set(0, 0, 24);

    // enhanced renderer settings for better resolution
    renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: true,
      precision: 'highp',
    });
    
    // match device pixel ratio for sharper rendering
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(width, height);
    
    // enable shadow mapping for better quality
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    container.appendChild(renderer.domElement);

    // create a group to hold the cloud
    cloud = new THREE.Group();

    // white material for cloud
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

    // create several spheres arranged to form a cloud
    const sphereGeometry = new THREE.SphereGeometry(4, 64, 64);
    // create a more uniform cloud shape
    const positions = [];
    const radius = 10;
    const layers = 3;
    
    // generate positions in a more organized pattern
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
    
    // add some randomness to the positions
    positions.forEach(pos => {
      const sphere = new THREE.Mesh(sphereGeometry, material);
      sphere.position.x = pos.x + (Math.random() - 0.5) * 2;
      sphere.position.y = pos.y + (Math.random() - 0.5) * 2;
      sphere.position.z = pos.z + (Math.random() - 0.5) * 2;
      cloud.add(sphere);
    });

    scene.add(cloud);

    // lighting
    const ambientLight = new THREE.AmbientLight(0xFFFFFF, 2.0);
    scene.add(ambientLight);
    
    // main directional light from above
    const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0); 
    directionalLight.position.set(0, 100, 0); 
    directionalLight.target.position.set(20, 0, 0); 
    scene.add(directionalLight);
    scene.add(directionalLight.target);

    // modify animation loop for gentle perturbation
    function animate() {
      requestAnimationFrame(animate);
      
      // calculate current rotation speed using easing
      const currentSpeed = spinStartTime 
        ? normalRotationSpeed + (fastRotationSpeed - normalRotationSpeed) * easeInOutCubic(spinProgress)
        : normalRotationSpeed;
        
      cloud.rotation.y += currentSpeed;
      renderer.render(scene, camera);
    }
    animate();

    // update resize handler to account for pixel ratio
    function onWindowResize() {
      const width = container.clientWidth;
      const height = container.clientHeight;
      renderer.setSize(width, height);
      renderer.setPixelRatio(window.devicePixelRatio);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }

    // add this line to attach the resize listener
    window.addEventListener("resize", onWindowResize);

    return () => {
      window.removeEventListener("resize", onWindowResize);
      renderer.dispose();
    };
  });
</script>

<!-- the container will be sized by the parent -->
<div bind:this={container} class="w-full h-full"></div> 