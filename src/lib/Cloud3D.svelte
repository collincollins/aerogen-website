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
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 50);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    // Create a group to hold the cloud
    const cloud = new THREE.Group();

    // White material for cloud spheres
    const material = new THREE.MeshStandardMaterial({
      color: 'white',
      roughness: 0.9,
      metalness: 0.01,
    });

    // Create several spheres arranged to form a cloud
    const sphereGeometry = new THREE.SphereGeometry(5, 32, 32);
    for (let i = 0; i < 50; i++) {
      const sphere = new THREE.Mesh(sphereGeometry, material);
      sphere.position.x = (Math.random() - 0.5) * 15;
      sphere.position.y = (Math.random() - 0.3) * 15;
      sphere.position.z = (Math.random() - 0.5) * 15;
      cloud.add(sphere);
    }
    scene.add(cloud);

    // Lighting
    const ambientLight = new THREE.AmbientLight("white", 1);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight("white", 1);
    directionalLight.position.set(10, 20, 10);
    scene.add(directionalLight);

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