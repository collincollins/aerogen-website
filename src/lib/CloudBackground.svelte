<script lang="ts">
  import { onMount } from 'svelte';
  import * as THREE from 'three';
  import { currentSection } from './stores/navigation';
  import { showContentToggle, showExclusionZones } from './stores/devTools';
  
  let container: HTMLDivElement;
  let scene: THREE.Scene;
  let camera: THREE.OrthographicCamera;
  let renderer: THREE.WebGLRenderer;
  let clouds: THREE.Group[] = [];
  let frameId: number;
  let lastRenderTime = 0;
  const targetFPS = 30; // Limit to 30 FPS to reduce CPU/GPU load
  const frameInterval = 1000 / targetFPS;
  let isVisible = true;
  let exclusionZoneObjects: THREE.Group[] = [];

  // Define all available sections
  const sections = {
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

  // Define no-cloud zones for navigation elements
  type ExclusionZone = {
    x: number;
    y: number;
    width: number;
    height: number;
  };

  // Settings for collision detection
  const MIN_CLOUD_DISTANCE_FACTOR = 2.2; // Increased from 1.8 to account for denser clouds

  // Store initial cloud positions to ensure persistence across resizes
  let initialCloudSetupComplete = false;
  let previousViewportWidth = 0;
  let previousViewportHeight = 0;

  const createCloud = () => {
    const group = new THREE.Group();
    
    // Restore original cloud appearance but keep optimized geometry
    const sphereGeometry = new THREE.SphereGeometry(4, 16, 16);
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

    // Restore denser sphere formation from navbar version for better visual appearance
    const positions = [];
    const radius = 10;
    const layers = 3;
    
    // Use original denser cloud layout
    for (let layer = 0; layer < layers; layer++) {
      const layerRadius = radius - (layer * 2);
      // Restore original sphere count per layer for denser appearance
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
      
      // Add subtle vertical oscillation to each sphere
      sphere.userData.oscillationSpeed = 0.0005 + Math.random() * 0.05; // Reduced for performance
      sphere.userData.oscillationOffset = Math.random() * Math.PI * 2;
      sphere.userData.oscillationAmplitude = 0.1 + Math.random() * 0.2;
      
      group.add(sphere);
    });

    // Assign random rotation speed - keeps slow enough to not strain CPU
    group.userData.rotationSpeed = 0.00005 + Math.random() * 0.005;
    
    return group;
  };

  // Check if a cloud is in view
  const isInView = (position: THREE.Vector3, distance: number = 350): boolean => {
    const frustumSize = 300;
    const aspect = window.innerWidth / window.innerHeight;
    const viewWidth = frustumSize * aspect;
    
    // Simple frustum culling
    return (
      position.x > camera.position.x - viewWidth/2 - distance &&
      position.x < camera.position.x + viewWidth/2 + distance &&
      position.y > camera.position.y - frustumSize/2 - distance &&
      position.y < camera.position.y + frustumSize/2 + distance
    );
  };

  // Check if a position is within any exclusion zone
  const isInExclusionZone = (
    position: CloudPosition, 
    exclusionZones: ExclusionZone[], 
    cloudScale: number
  ): boolean => {
    // Calculate cloud radius based on scale - increase radius for better coverage
    const cloudRadius = cloudScale * 10; // Increased from 10 to 12 for better coverage
    
    for (const zone of exclusionZones) {
      // Check if any part of the cloud overlaps with the exclusion zone
      // Use a more sensitive collision check with expanded cloud radius
      if (
        position.x + cloudRadius > zone.x - cloudRadius * 0.5 &&
        position.x - cloudRadius < zone.x + zone.width + cloudRadius * 0.5 &&
        position.y + cloudRadius > zone.y - cloudRadius * 0.5 &&
        position.y - cloudRadius < zone.y + zone.height + cloudRadius * 0.5
      ) {
        return true;
      }
    }
    return false;
  };

  // Check if a new cloud position would overlap with existing clouds
  const wouldOverlap = (
    newPos: CloudPosition, 
    existingPositions: CloudPosition[],
    exclusionZones: ExclusionZone[] = []
  ): boolean => {
    // First check if the position is in an exclusion zone
    if (isInExclusionZone(newPos, exclusionZones, newPos.scale)) {
      return true;
    }
    
    // Then check overlaps with existing clouds
    for (const pos of existingPositions) {
      const dx = newPos.x - pos.x;
      const dy = newPos.y - pos.y;
      const dz = newPos.z - pos.z;
      const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
      
      // Calculate minimum distance based on the scales of both clouds
      const minDistance = (newPos.scale + pos.scale) * 10 * MIN_CLOUD_DISTANCE_FACTOR;
      
      if (distance < minDistance) {
        return true;
      }
    }
    return false;
  };

  // Generate a valid cloud position that doesn't overlap with existing clouds
  const generateNonOverlappingPosition = (
    layer: { z: number, minScale: number, maxScale: number },
    bounds: { minX: number, maxX: number, minY: number, maxY: number },
    existingPositions: CloudPosition[],
    exclusionZones: ExclusionZone[] = []
  ): CloudPosition => {
    // Maximum attempts to find a non-overlapping position
    const MAX_ATTEMPTS = 100; // Increased from 50 to 100
    
    // Top half of the screen has exclusion zones, so start with trying bottom half
    for (let attempt = 0; attempt < MAX_ATTEMPTS/2; attempt++) {
      // Try bottom 60% of the screen first
      const x = bounds.minX + Math.random() * (bounds.maxX - bounds.minX);
      const y = bounds.minY + Math.random() * (bounds.maxY - bounds.minY) * 0.85;
      
      // Randomize scale between min and max
      const scaleFactor = Math.random();
      const scale = layer.minScale + (layer.maxScale - layer.minScale) * scaleFactor;
      
      const newPos = { x, y, z: layer.z, scale };
      
      // Double check against exclusion zones with a safety factor
      if (!isInExclusionZone(newPos, exclusionZones, newPos.scale * 1.0) && 
          !wouldOverlap(newPos, existingPositions)) {
        return newPos;
      }
    }
    
    // If bottom half didn't work, try entire viewport but with more caution around exclusion zones
    for (let attempt = 0; attempt < MAX_ATTEMPTS/2; attempt++) {
      const x = bounds.minX + Math.random() * (bounds.maxX - bounds.minX);
      const y = bounds.minY + Math.random() * (bounds.maxY - bounds.minY);
      
      // Use smaller cloud scale to increase chances of fitting
      const scale = layer.minScale + (layer.maxScale - layer.minScale) * 0.5; 
      
      const newPos = { x, y, z: layer.z, scale };
      
      // Double check exclusion zones with an even larger safety margin
      if (!isInExclusionZone(newPos, exclusionZones, newPos.scale * 1) &&
          !wouldOverlap(newPos, existingPositions)) {
        return newPos;
      }
    }
    
    // Last resort: place clouds very far from exclusion zones, in the bottom area
    const x = bounds.minX + Math.random() * (bounds.maxX - bounds.minX);
    const y = bounds.minY + Math.random() * (bounds.maxY - bounds.minY) * 0.3; // bottom 30%
    const scale = layer.minScale; // Use minimum scale
    
    return { x, y, z: layer.z, scale };
  };

  // Function to visualize exclusion zones
  const updateExclusionZoneVisibility = (exclusionZones: ExclusionZone[]) => {
    // Remove existing visualization objects
    exclusionZoneObjects.forEach(obj => {
      scene.remove(obj);
    });
    exclusionZoneObjects = [];
    
    // If visualization is not enabled, just return
    if (!$showExclusionZones) return;
    
    // Create visualization for each exclusion zone
    exclusionZones.forEach((zone, index) => {
      let zoneName = "Exclusion Zone"; // Default value
      if (index === 0) {
        zoneName = "Logo Cloud Zone";
      } else if (index === 1) {
        zoneName = "Question Mark Cloud Zone";
      } else if (index === 2) {
        zoneName = "Title Zone";
      }
      
      // Create a group for this zone visualization
      const zoneGroup = new THREE.Group();
      
      // Create a wireframe box for the zone boundary
      const wireframeGeometry = new THREE.BoxGeometry(zone.width, zone.height, 50);
      const wireframeMaterial = new THREE.MeshBasicMaterial({
        color: index === 0 ? 0x5FB3F9 : (index === 1 ? 0x1D49A7 : 0xFFFFFF), // Different colors for each zone
        transparent: true,
        opacity: 0.6,
        wireframe: true,
        wireframeLinewidth: 2
      });
      
      const wireframeMesh = new THREE.Mesh(wireframeGeometry, wireframeMaterial);
      wireframeMesh.position.set(zone.x + zone.width/2, zone.y - zone.height/2, 0);
      zoneGroup.add(wireframeMesh);
      
      // Add a semi-transparent fill
      const fillGeometry = new THREE.BoxGeometry(zone.width - 2, zone.height - 2, 45);
      const fillMaterial = new THREE.MeshBasicMaterial({
        color: index === 0 ? 0x5FB3F9 : (index === 1 ? 0x1D49A7 : 0xFFFFFF), // Different colors for each zone
        transparent: true,
        opacity: 0.1
      });
      
      const fillMesh = new THREE.Mesh(fillGeometry, fillMaterial);
      fillMesh.position.copy(wireframeMesh.position);
      zoneGroup.add(fillMesh);
      
      // Add a label that moves with the zone
      const labelCanvas = document.createElement('canvas');
      const context = labelCanvas.getContext('2d');
      if (context) {
        labelCanvas.width = 256;
        labelCanvas.height = 64;
        context.fillStyle = '#FFFFFF';
        context.font = 'Bold 20px Aileron, sans-serif';
        context.textAlign = 'center';
        context.fillText(zoneName, labelCanvas.width/2, 34);
        
        const labelTexture = new THREE.CanvasTexture(labelCanvas);
        const labelMaterial = new THREE.MeshBasicMaterial({
          map: labelTexture,
          transparent: true,
          opacity: 0.95,
          side: THREE.DoubleSide
        });
        
        const labelGeometry = new THREE.PlaneGeometry(zone.width, zone.width * 0.25);
        const label = new THREE.Mesh(labelGeometry, labelMaterial);
        label.position.set(
          zone.x + zone.width/2,
          zone.y - zone.height - 15, // Position below the zone
          0
        );
        zoneGroup.add(label);
      }
      
      // Add a dashed line to show margin - consistent for all zones
      const marginGeometry = new THREE.EdgesGeometry(wireframeGeometry);
      const marginMaterial = new THREE.LineDashedMaterial({
        color: 0xFFFFFF,
        dashSize: 3,
        gapSize: 3,
        opacity: 0.5,
        transparent: true
      });
      
      const marginLines = new THREE.LineSegments(marginGeometry, marginMaterial);
      marginLines.position.copy(wireframeMesh.position);
      marginLines.computeLineDistances(); // Needed for dashed lines
      zoneGroup.add(marginLines);
      
      // Add the group to the scene
      scene.add(zoneGroup);
      exclusionZoneObjects.push(zoneGroup);
    });
  };

  const setupClouds = (isResize = false) => {
    // Get current window dimensions
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Calculate viewport bounds in world space
    const frustumSize = 300;
    const aspect = width / height;
    const viewportWidth = frustumSize * aspect;
    const viewportHeight = frustumSize;
    
    // Calculate total content width based on the number of sections
    const numSections = Object.keys(sections).length;
    const worldSpaceWidth = viewportWidth * numSections;
    
    // Define the bounds for cloud placement
    const bounds = {
      minX: -worldSpaceWidth / 2,
      maxX: worldSpaceWidth / 2,
      minY: -viewportHeight / 2,
      maxY: viewportHeight / 2
    };
    
    // Define exclusion zones for navigation buttons based on actual Navbar positioning
    // Size is relative to the viewport size
    const isLargeScreen = width >= 768; // Match the media query in Navbar
    
    // Logo cloud sizing (from Navbar) - increase sizes by 15% for better coverage
    const logoSize = isLargeScreen ? viewportHeight * 0.25 : viewportHeight * 0.20; // Increased size
    const logoOffsetX = -viewportWidth / 2; // Ensure it's at the edge
    const logoOffsetY = viewportHeight / 2 - (isLargeScreen ? viewportHeight * 0.07 : viewportHeight * 0.06);
    
    // Contact cloud sizing (from Navbar) - increase sizes by 15% for better coverage
    const contactSize = isLargeScreen ? viewportHeight * 0.21 : viewportHeight * 0.17; // Increased size
    const contactOffsetX = viewportWidth / 2 - (isLargeScreen ? viewportHeight * 0.06 : viewportHeight * 0.04);
    const contactOffsetY = viewportHeight / 2 - (isLargeScreen ? viewportHeight * 0.03 : viewportHeight * 0.04);
    
    // Aerogen title zone size
    const titleWidth = isLargeScreen ? viewportWidth * 0.3 : viewportWidth * 0.5; // 30% of viewport width on desktop, 50% on mobile
    const titleHeight = viewportHeight * 0.08; // 8% of viewport height
    
    // Extra margin around the clouds to ensure no clouds overlap with navigation - increased margin
    const margin = viewportHeight * 0.06; // Increased from 0.04 to 0.06
    
    const exclusionZones: ExclusionZone[] = [
      // Logo zone (upper left)
      {
        x: logoOffsetX - margin,
        y: logoOffsetY + logoSize + margin,
        width: logoSize + margin * 2.5, // Increased horizontal coverage
        height: logoSize + margin * 2
      },
      // Question mark zone (upper right)
      {
        x: contactOffsetX - contactSize - margin * 1.5, // Increased leftward coverage
        y: contactOffsetY + contactSize + margin,
        width: contactSize + margin * 2.5, // Increased horizontal coverage
        height: contactSize + margin * 2
      },
      // Aerogen title zone (top center)
      {
        x: -titleWidth / 2,
        y: viewportHeight / 2, // At the top of the viewport
        width: titleWidth,
        height: titleHeight + margin * 2 // Add margin for safety
      }
    ];
    
    // Visualize exclusion zones if enabled
    updateExclusionZoneVisibility(exclusionZones);
    
    // Calculate cloud density - fewer total clouds since each is now denser
    const cloudsPerViewport = 30;
    const targetCloudCount = Math.min(45, Math.ceil(cloudsPerViewport * numSections));
    
    // Force remove any clouds in exclusion zones regardless of resize status
    const forceRemoveCloudsInExclusionZones = () => {
      clouds.forEach(cloud => {
        if (isInExclusionZone(
          {x: cloud.position.x, y: cloud.position.y, z: cloud.position.z, scale: cloud.scale.x},
          exclusionZones,
          cloud.scale.x
        )) {
          scene.remove(cloud);
          cloud.userData.removeMe = true;
        }
      });
      clouds = clouds.filter(cloud => !cloud.userData.removeMe);
    };
    
    // Check and remove clouds in exclusion zones first
    if (initialCloudSetupComplete) {
      forceRemoveCloudsInExclusionZones();
    }
    
    // Handle resize case - preserve existing clouds
    if (isResize && initialCloudSetupComplete) {
      const widthRatio = viewportWidth / previousViewportWidth;
      const heightRatio = viewportHeight / previousViewportHeight;
      
      // Update positions of existing clouds
      clouds.forEach(cloud => {
        // Scale positions proportionally to the new viewport size
        const newX = cloud.position.x * widthRatio;
        const newY = cloud.position.y * heightRatio;
        
        // Check if cloud is still within bounds and not in exclusion zones
        if (
          newX >= bounds.minX * 1.05 && // Add 10% margin
          newX <= bounds.maxX * 1.05 &&
          newY >= bounds.minY * 1.05 &&
          newY <= bounds.maxY * 1.05 &&
          !isInExclusionZone(
            {x: newX, y: newY, z: cloud.position.z, scale: cloud.scale.x},
            exclusionZones,
            cloud.scale.x
          )
        ) {
          // Keep this cloud and adjust its position
          cloud.position.set(newX, newY, cloud.position.z);
          cloud.userData.originalX = newX;
        } else {
          // Cloud is now out of bounds or in exclusion zone - remove it
          scene.remove(cloud);
          // Mark for removal from clouds array (we'll filter later)
          cloud.userData.removeMe = true;
        }
      });
      
      // Filter out removed clouds
      clouds = clouds.filter(cloud => !cloud.userData.removeMe);
      
      // Add more clouds if needed
      if (clouds.length < targetCloudCount) {
        // Distribution across layers
        const layerDistribution = [
          { z: -150, count: Math.floor(targetCloudCount * 0.35), minScale: 1.8, maxScale: 2.2 },
          { z: -100, count: Math.floor(targetCloudCount * 0.35), minScale: 1.2, maxScale: 1.6 },
          { z: -50, count: Math.floor(targetCloudCount * 0.3), minScale: 0.6, maxScale: 1.0 }
        ];
        
        // Create cloud positions for each layer
        const cloudPositions: CloudPosition[] = [];
        
        // Extract existing cloud positions for overlap checking
        const existingPositions: CloudPosition[] = clouds.map(cloud => ({
          x: cloud.position.x,
          y: cloud.position.y,
          z: cloud.position.z,
          scale: cloud.scale.x // assuming uniform scale
        }));
        
        // Calculate how many clouds to add for each layer
        const currentCounts: Record<string, number> = {
          '-150': 0,
          '-100': 0,
          '-50': 0
        };
        
        // Count existing clouds by layer
        clouds.forEach(cloud => {
          const z = cloud.position.z.toString();
          if (currentCounts[z] !== undefined) {
            currentCounts[z]++;
          }
        });
        
        // Add new clouds as needed
        layerDistribution.forEach(layer => {
          const z = layer.z.toString();
          const existingCount = currentCounts[z] || 0;
          const neededCount = Math.max(0, layer.count - existingCount);
          
          for (let i = 0; i < neededCount; i++) {
            const position = generateNonOverlappingPosition(layer, bounds, existingPositions, exclusionZones);
            cloudPositions.push(position);
            existingPositions.push(position); // Add to existing positions to prevent overlap
          }
        });
        
        // Create and add new clouds
        cloudPositions.forEach(pos => {
          const cloud = createCloud();
          cloud.position.set(pos.x, pos.y, pos.z);
          cloud.scale.setScalar(pos.scale);
          cloud.rotation.set(0, 0, 0);
          
          cloud.userData.originalX = pos.x;
          cloud.userData.parallaxSpeed = Math.pow(1 - Math.abs(pos.z) / 900, 2);
          
          scene.add(cloud);
          clouds.push(cloud);
          
          // Store original Y positions for oscillation
          cloud.children.forEach((object) => {
            if (object.type === 'Mesh') {
              object.userData.originalY = object.position.y;
            }
          });
        });
      }
      // If we have too many clouds, remove some
      else if (clouds.length > targetCloudCount) {
        // Sort by distance from center (remove the furthest ones first)
        clouds.sort((a, b) => {
          const distA = Math.sqrt(a.position.x**2 + a.position.y**2);
          const distB = Math.sqrt(b.position.x**2 + b.position.y**2);
          return distB - distA;
        });
        
        // Remove excess clouds
        const excessCount = clouds.length - targetCloudCount;
        for (let i = 0; i < excessCount; i++) {
          const cloud = clouds.pop();
          if (cloud) scene.remove(cloud);
        }
      }
    }
    // Initial setup or full regeneration if needed
    else {
      // Clear existing clouds if any
      clouds.forEach(cloud => scene.remove(cloud));
      clouds = [];
      
      // Distribution across layers
      const layerDistribution = [
        { z: -150, count: Math.floor(targetCloudCount * 0.35), minScale: 1.3, maxScale: 1.4 },
        { z: -100, count: Math.floor(targetCloudCount * 0.35), minScale: 0.8, maxScale: 1.2 },
        { z: -50, count: Math.floor(targetCloudCount * 0.3), minScale: 0.6, maxScale: 0.8 }
      ];
      
      // Generate positions for all clouds
      const cloudPositions: CloudPosition[] = [];
      
      // Create positions for each layer
      layerDistribution.forEach(layer => {
        for (let i = 0; i < layer.count; i++) {
          const position = generateNonOverlappingPosition(layer, bounds, cloudPositions, exclusionZones);
          cloudPositions.push(position);
        }
      });
      
      // Create clouds and add to scene
      cloudPositions.forEach(pos => {
        const cloud = createCloud();
        cloud.position.set(pos.x, pos.y, pos.z);
        cloud.scale.setScalar(pos.scale);
        
        // Set initial rotation to face forward
        cloud.rotation.set(0, 0, 0);
        
        const normalizedDist = Math.abs(pos.z) / 900;
        cloud.userData.parallaxSpeed = Math.pow(1 - normalizedDist, 2);
        cloud.userData.originalX = pos.x;
        scene.add(cloud);
        clouds.push(cloud);
      });
      
      initialCloudSetupComplete = true;
    }
    
    // Store current viewport dimensions for next resize
    previousViewportWidth = viewportWidth;
    previousViewportHeight = viewportHeight;
    
    // Ensure original Y positions are stored for oscillation
    clouds.forEach(cloud => {
      if (!cloud.userData.hasStoredPositions) {
        cloud.children.forEach((object) => {
          if (object.type === 'Mesh') {
            object.userData.originalY = object.position.y;
          }
        });
        cloud.userData.hasStoredPositions = true;
      }
    });
  };

  const initScene = () => {
    scene = new THREE.Scene();
    
    // Set up orthographic camera for consistent viewing angle
    const aspect = window.innerWidth / window.innerHeight;
    const frustumSize = 300;
    camera = new THREE.OrthographicCamera(
      frustumSize * aspect / -2,
      frustumSize * aspect / 2,
      frustumSize / 2,
      frustumSize / -2,
      0.1,
      2000
    );
    
    camera.position.z = 100;
    camera.position.y = 0;
    camera.lookAt(0, 0, 0);
    
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

    // Use exact same lighting as navbar but optimize
    const ambientLight = new THREE.AmbientLight(0xFFFFFF, 2.0);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0);
    directionalLight.position.set(0, 100, 0);
    directionalLight.target.position.set(20, 0, 0);
    scene.add(directionalLight);
    scene.add(directionalLight.target);
    
    // Create clouds dynamically based on viewport size
    setupClouds();
  };

  const easeInOutCubic = (t: number): number => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };

  const animate = (timestamp: number) => {
    frameId = requestAnimationFrame(animate);
    
    // Frame rate limiter
    const elapsed = timestamp - lastRenderTime;
    if (elapsed < frameInterval && isVisible) return;
    
    lastRenderTime = timestamp;
    
    const baseOffset = sections[$currentSection].position;
    const time = performance.now() * 0.001;
    
    let needsRender = false;
    
    // Ensure rendering when exclusion zones are toggled
    if ($showExclusionZones && exclusionZoneObjects.length > 0) {
      needsRender = true;
    }
    
    clouds.forEach(cloud => {
      // Only process visible clouds
      if (!isInView(cloud.position)) return;
      
      needsRender = true;
      
      // Apply individual rotation around Y axis only
      cloud.rotation.y += cloud.userData.rotationSpeed;
      
      // Apply subtle vertical oscillation to each sphere in the cloud
      // Only if the cloud is close enough to be visible
      cloud.children.forEach((object) => {
        if (object.type === 'Mesh' && object.userData.oscillationSpeed) {
          const oscillation = Math.sin(time * object.userData.oscillationSpeed + object.userData.oscillationOffset) * object.userData.oscillationAmplitude;
          object.position.y = object.userData.originalY + oscillation;
        }
      });
      
      // Calculate eased parallax movement
      const targetX = cloud.userData.originalX - (baseOffset * cloud.userData.parallaxSpeed);
      const currentX = cloud.position.x;
      const easedX = currentX + (targetX - currentX) * 0.1;
      cloud.position.x = easedX;
    });

    // Only render when necessary
    if (needsRender || !isVisible) {
      renderer.render(scene, camera);
    }
  };

  onMount(() => {
    initScene();
    
    // Get current dimensions to calculate exclusion zones
    const width = window.innerWidth;
    const height = window.innerHeight;
    const frustumSize = 300;
    const aspect = width / height;
    const viewportWidth = frustumSize * aspect;
    const viewportHeight = frustumSize;
    
    // Define exclusion zones for immediate cleanup
    const isLargeScreen = width >= 768;
    const logoSize = isLargeScreen ? viewportHeight * 0.25 : viewportHeight * 0.20;
    const contactSize = isLargeScreen ? viewportHeight * 0.21 : viewportHeight * 0.17;
    const margin = viewportHeight * 0.06;
    
    const logoOffsetX = -viewportWidth / 2;
    const logoOffsetY = viewportHeight / 2 - (isLargeScreen ? viewportHeight * 0.07 : viewportHeight * 0.06);
    const contactOffsetX = viewportWidth / 2 - (isLargeScreen ? viewportHeight * 0.06 : viewportHeight * 0.04);
    const contactOffsetY = viewportHeight / 2 - (isLargeScreen ? viewportHeight * 0.03 : viewportHeight * 0.04);
    
    const cleanupExclusionZones: ExclusionZone[] = [
      // Logo zone
      {
        x: logoOffsetX - margin,
        y: logoOffsetY + logoSize + margin,
        width: logoSize + margin * 2.5,
        height: logoSize + margin * 2
      },
      // Question mark zone
      {
        x: contactOffsetX - contactSize - margin * 1.5,
        y: contactOffsetY + contactSize + margin,
        width: contactSize + margin * 2.5,
        height: contactSize + margin * 2
      }
    ];
    
    // Immediate cleanup of any clouds in exclusion zones
    const removeCloudsInExclusionZones = () => {
      const cloudsToRemove: THREE.Group[] = [];
      
      clouds.forEach(cloud => {
        if (isInExclusionZone(
          {x: cloud.position.x, y: cloud.position.y, z: cloud.position.z, scale: cloud.scale.x},
          cleanupExclusionZones,
          cloud.scale.x * 1 // Use extra safety margin
        )) {
          cloudsToRemove.push(cloud);
        }
      });
      
      cloudsToRemove.forEach(cloud => {
        scene.remove(cloud);
        const index = clouds.indexOf(cloud);
        if (index !== -1) {
          clouds.splice(index, 1);
        }
      });
    };
    
    // Check all clouds' original positions
    clouds.forEach(cloud => {
      cloud.userData.originalX = cloud.position.x;
      
      // Store original Y positions for oscillation
      cloud.children.forEach((object) => {
        if (object.type === 'Mesh') {
          object.userData.originalY = object.position.y;
        }
      });
      cloud.userData.hasStoredPositions = true;
    });
    
    // Run cleanup immediately
    removeCloudsInExclusionZones();
    
    // Then run a second check to ensure all remaining clouds are valid
    // This is important as sometimes clouds might have moved due to resize
    setTimeout(removeCloudsInExclusionZones, 500);
    
    // Subscribe to the visibility toggle
    const unsubscribeContent = showContentToggle.subscribe(value => {
      isVisible = !value; // When content is hidden, background becomes more important
    });
    
    // Subscribe to the exclusion zones toggle
    const unsubscribeExclusionZones = showExclusionZones.subscribe(value => {
      // When this changes, update the visualization by calling setupClouds
      if (initialCloudSetupComplete) {
        setupClouds(true);
      }
    });
    
    lastRenderTime = performance.now();
    frameId = requestAnimationFrame(animate);

    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // Update orthographic camera on resize
      const aspect = width / height;
      const frustumSize = 300;
      camera.left = frustumSize * aspect / -2;
      camera.right = frustumSize * aspect / 2;
      camera.top = frustumSize / 2;
      camera.bottom = frustumSize / -2;
      
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      
      // Regenerate clouds based on new viewport size
      setupClouds(true); // Pass true to indicate this is a resize
    };

    // Only update on actual resize, not continuous events
    let resizeTimeout: ReturnType<typeof setTimeout>;
    const debouncedResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(handleResize, 100);
    };

    window.addEventListener('resize', debouncedResize);

    return () => {
      cancelAnimationFrame(frameId);
      unsubscribeContent();
      unsubscribeExclusionZones();
      window.removeEventListener('resize', debouncedResize);
      renderer?.dispose();
      container?.removeChild(renderer.domElement);
    };
  });
</script>

<div 
  bind:this={container} 
  class="fixed inset-0 overflow-hidden pointer-events-none -z-0"
/> 