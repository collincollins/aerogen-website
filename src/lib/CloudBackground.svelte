<script lang="ts">
  import { onMount } from 'svelte';
  import * as THREE from 'three';
  import { currentSection } from './stores/navigation';
  
  let container: HTMLDivElement;
  let scene: THREE.Scene;
  let camera: THREE.PerspectiveCamera;
  let renderer: THREE.WebGLRenderer;
  let clouds: THREE.Group[] = [];

  const sections = {
    main: { position: 0 },
    about: { position: 100 },
    work: { position: 200 }
  };

  const createCloud = () => {
    const group = new THREE.Group();
    
    // Use exact same sphere geometry and material as navbar
    const sphereGeometry = new THREE.SphereGeometry(4, 64, 64);
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

    // Use exact same cloud formation logic as navbar
    const positions = [];
    const radius = 10;
    const layers = 3;
    
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
    
    positions.forEach(pos => {
      const sphere = new THREE.Mesh(sphereGeometry, material);
      sphere.position.x = pos.x + (Math.random() - 0.5) * 2;
      sphere.position.y = pos.y + (Math.random() - 0.5) * 2;
      sphere.position.z = pos.z + (Math.random() - 0.5) * 2;
      group.add(sphere);
    });

    // Assign random rotation speed
    group.userData.rotationSpeed = 0.001 + Math.random() * 0.003;
    
    return group;
  };

  const initScene = () => {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: true,
      precision: 'highp',
    });
    
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    container.appendChild(renderer.domElement);

    // Use exact same lighting as navbar
    const ambientLight = new THREE.AmbientLight(0xFFFFFF, 2.0);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0);
    directionalLight.position.set(0, 100, 0);
    directionalLight.target.position.set(20, 0, 0);
    scene.add(directionalLight);
    scene.add(directionalLight.target);

    // More varied cloud positions with better vertical distribution
    const cloudPositions = [
      // // Top row, far
      // { x: -250, y: 180, z: -200, scale: 1.0 },
      // { x: 50, y: 150, z: -180, scale: 1.2 },
      // { x: 280, y: 200, z: -160, scale: 1.4 },
      
      // // Mid-distance clouds
      // { x: -300, y: -100, z: -200, scale: 3.5 },
      // { x: 50, y: 70, z: -180, scale: 3 },
      // { x: 200, y: -50, z: -160, scale: 2.8 },
      
      // // Closer clouds
      // { x: -80, y: 40, z: -100, scale: 2 },
      // { x: 120, y: -20, z: -80, scale: 1.8 },
      
      // Nearest clouds (smaller, fast moving)
      { x: -40, y: 30, z: -50, scale: 1 },
      { x: 60, y: -25, z: -40, scale: 1 }
    ];

    cloudPositions.forEach(pos => {
      const cloud = createCloud();
      cloud.position.set(pos.x, pos.y, pos.z);
      cloud.scale.setScalar(pos.scale);
      
      // More dramatic parallax effect based on z-distance
      const normalizedDist = Math.abs(pos.z) / 400; // Now using full 400 unit range
      cloud.userData.parallaxSpeed = Math.pow(1 - normalizedDist, 2); // Quadratic falloff
      scene.add(cloud);
      clouds.push(cloud);
    });

    camera.position.z = 50; // Moved camera back for better perspective
  };

  const easeInOutCubic = (t: number): number => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };

  const animate = () => {
    requestAnimationFrame(animate);
    
    const baseOffset = sections[$currentSection].position;
    
    clouds.forEach(cloud => {
      // Apply individual rotation
      cloud.rotation.y += cloud.userData.rotationSpeed;
      
      // Calculate eased parallax movement
      const targetX = cloud.userData.originalX - (baseOffset * cloud.userData.parallaxSpeed);
      const currentX = cloud.position.x;
      const easedX = currentX + (targetX - currentX) * 0.1; // Smooth transition
      cloud.position.x = easedX;
    });

    renderer.render(scene, camera);
  };

  onMount(() => {
    initScene();
    clouds.forEach(cloud => {
      cloud.userData.originalX = cloud.position.x;
    });
    animate();

    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      renderer.setSize(width, height);
      renderer.setPixelRatio(window.devicePixelRatio);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer?.dispose();
      container?.removeChild(renderer.domElement);
    };
  });
</script>

<div 
  bind:this={container} 
  class="fixed inset-0 overflow-hidden pointer-events-none -z-0"
/> 