import { useEffect, useState } from "react";
import * as THREE from "three";

export default function Game() {
  const mountRef = useRef<HTMLDivElement>(null);
  
  

  // Game state
  const [gameState, setGameState] = useState<"menu" | "playing" | "paused">("menu");
let keyDown: string[] = [];
n// Keyboard input handler for lane switching and jumping
n
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    
    // Camera
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 200);
    camera.position.set(0, 3, -5);
    
n    // Keyboard input handler for lane switching and jumping
    // Event listener setup for keyboard input
    const onKeyDown = (e: KeyboardEvent) => { e.preventDefault(); };
    const onKeyUp = (e: KeyboardEvent) => { const index = keyDown.indexOf(e.key); if (index > -1) keyDown.splice(index, 1); };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    // Renderer
n    // Cleanup on unmount
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    mountRef.current.appendChild(renderer.domElement);

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 5).normalize();
    scene.add(directionalLight);

    // Floor (infinite scrolling)
    const floorGeometry = new THREE.PlaneGeometry(100, 100);
    const floorMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x2a9d8f,
      transparent: true,
      opacity: 0.3
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = Math.PI / 2;
    scene.add(floor);

    // Player character (simple capsule)
    const playerGroup = new THREE.Group();
    
    // Body
    const bodyGeo = new THREE.BoxGeometry(1.5, 3, 0.8);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xf4a261 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    playerGroup.add(body);

    // Head
    const headGeo = new THREE.BoxGeometry(1.2, 1.2, 1.2);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xe76f51 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 3; // on top of body (centered)
    playerGroup.add(head);

    scene.add(playerGroup);

    // Lanes
    const lanePositions: number[] = [-4.5, -1.2, 2.1];
    
    function createLane(laneIndex: number): THREE.Mesh {
      const geometry = new THREE.PlaneGeometry(6, 30);
      const material = new THREE.MeshStandardMaterial({ 
        color: laneIndex === 0 ? 0x95a7a5 : laneIndex === 1 ? 0xd4a373 : 0xc8d6c5,
        transparent: true,
        opacity: 0.2
      });
      const plane = new THREE.Mesh(geometry, material);
      plane.rotation.x = Math.PI / 2;
      
      // Position in lane center
      plane.position.set(lanePositions[laneIndex], -15, 3);
      return plane;
    }

    for (let i = 0; i < 3; i++) {
      scene.add(createLane(i));
    }

    // Obstacles manager
    let obstacles: THREE.Mesh[] = [];
    
    function createObstacle(): THREE.Mesh | null {
      const types = [
        new THREE.BoxGeometry(2, 1.5, 0.5), // low obstacle
        new THREE.BoxGeometry(3, 2.5, 0.8)  // tall obstacle (train-like)
      ];
      
      const typeIndex = Math.floor(Math.random() * types.length);
      const geometry = types[typeIndex];
      const material = new THREE.MeshStandardMaterial({ color: 0xe76f51 });
      const mesh = new THREE.Mesh(geometry, material);

      // Random lane
      const laneIdx = Math.floor(Math.random() * 3);
      
      // Position in random location along Z axis (far away)
      mesh.position.set(lanePositions[laneIdx], -10 + types[typeIndex] === 2 ? 5 : 0, 
                        -60 - Math.random() * 40);
                        
      scene.add(mesh);
      obstacles.push(mesh);

      return mesh;
    }

    // Collectibles manager
    let collectibles: THREE.Mesh[] = [];
    
    function createCollectible(): void {
      const geometry = new THREE.SphereGeometry(1, 8, 8);
      const material = new THREE.MeshStandardMaterial({ 
        color: Math.random() > 0.5 ? 0xf9c74f : 0x2a9d8f,
        emissive: Math.random() > 0.5 ? 0xf9c74f : 0x2a9d8f,
        emissiveIntensity: 0.5
      });
      
      const mesh = new THREE.Mesh(geometry, material);

      // Random lane and position along Z axis (far away)
      const laneIdx = Math.floor(Math.random() * 3);
      const zPos = -60 - Math.random() * 40;
      
      mesh.position.set(lanePositions[laneIdx], -15, zPos);
      scene.add(mesh);
      collectibles.push(mesh);

      // Rotate it for visual effect
      function animateRotation() {
        const t = Date.now() * 0.002;
        mesh.rotation.x = Math.sin(t) * 0.3;
        mesh.rotation.y = Math.cos(t) * 0.5;
        
        requestAnimationFrame(animateRotation);
      }
      
      animateRotation();
    }

    // Player movement (lane switching via touch/tap zones)
    let targetLane: number | null = null;
    
    function handleTouchStart(e: TouchEvent): void {
      if (!e.touches[0]) return;
      
      const rect = renderer.domElement.getBoundingClientRect();
      const x = e.touches[0].clientX - rect.left;
      const width = rect.width;

      // Left third -> lane 0, middle -> lane 1, right -> lane 2
      if (x < width * 0.33) {
        targetLane = 0;
      } else if (x < width * 0.66) {
        targetLane = 1;
      } else {
        targetLane = 2;
      }

      // Update player visual lane indicator
      const lanes = scene.children.filter((c): c is THREE.Mesh => 
        c instanceof THREE.Mesh && (c as any).userData?.type === "lane"
      );
      
      for (let i = 0; i < 3; i++) {
        if ((lanes[i] as any)?.visible) {
          const color = lanePositions[2 - i]; // adjust order
          lanes[i].material.color.setHex(i === targetLane ? 0x4ade80 : (i > 1 ? 0xc8d6c5 : 0x95a7a5));
        }
      }

      if (!mountRef.current) return;
    }

    function handleTouchEnd(): void {
      targetLane = null; // remove visual indicator
    }

    renderer.domElement.addEventListener("touchstart", (e: TouchEvent) => { 
      e.preventDefault();
      handleTouchStart(e);
    });

    renderer.domElement.addEventListener("touchend", () => handleTouchEnd());

    // Animation loop
    let lastTime = performance.now();
    
    function animate(): void {
      requestAnimationFrame(animate);

      const currentTime = performance.now();
      const delta = (currentTime - lastTime) / 1000;
      
      if (!mountRef.current || gameState !== "playing") return;

      // Smooth player movement to target lane
      currentLane += (targetLane - currentLane) * 5 * delta;

      let scoreIncrement = false;

      for (let i = obstacles.length - 1; i >= 0; i--) {
        const obstacle = obstacles[i];
        
        // Move obstacle towards player
        obstacle.position.z -= 20 * delta;

        // Remove if passed camera
        if (obstacle.position.z > 5) {
          scene.remove(obstacles.splice(i, 1)[0]);
        }
      }

      for (let i = collectibles.length - 1; i >= 0; i--) {
        const col = collectibles[i];
        
        // Move with player
        col.position.z += currentLane * delta * 40;
        
        // Remove if passed camera
        if (col.position.z > 5) {
          scene.remove(collectibles.splice(i, 1)[0]);
        }

        // Check collision
        const dx = Math.abs(col.position.x - playerGroup.position.x);
        const dy = Math.abs((col.position.y + col.geometry.parameters.radius || 1.2) - (playerGroup.children[0].position.y || 3));
        const dz = Math.abs(col.position.z - camera.position.z);

        if (dx < 1 && dy < 1 && dz < 0.5) {
          scene.remove(collectibles.splice(i, 1)[0]);
          score += 10;
          setScore(score + 10);
          createCollectible(); // spawn new one ahead
        }

        if (scoreIncrement) break;
      }

      lastTime = currentTime;
    };

    function updatePlayerPosition(): void {
      playerGroup.position.x = lanePositions[Math.round(currentLane)];
      
      // Rotate to face direction of movement
      const targetRotationX = Math.PI / 2 - (currentLane - 1) * 0.5;
      playerGroup.rotation.z += (targetRotationX - playerGroup.rotation.z) * 5 * delta;

      // Bobbing animation when moving
      if (!playerGroup.userData.isStopped && currentLane !== targetLane) {
        const bob = Math.sin(currentTime / 200) * 0.1;
        body.position.y += bob * delta;
      } else {
        body.position.y -= 3 * delta; // return to normal
      }

      if (currentLane !== targetLane && gameState === "playing") {
        scoreIncrement = true;
        setScore(s => s + Math.floor(delta * 10));
      }

      camera.lookAt(playerGroup.position.x, playerGroup.position.y - 3, 2);
    };
    
    let currentLane: number | null = null;
    const animateTimeRef = useRef(0);

    function update(): void {
      if (!mountRef.current || gameState !== "playing") return;

      const currentTime = performance.now();
      
      // Smooth lane transition (handled separately with targetLane)
      currentLane += (targetLane - currentLane) * 5 * delta;

      let scoreIncrement = false;

      for (let i = obstacles.length - 1; i >= 0; i--) {
        const obstacle = obstacles[i];
        
        // Move obstacle towards player
        obstacle.position.z -= 20 * delta;

        // Simple collision detection with player
        if (!currentLane) continue;

        const dx = Math.abs(obstacle.position.x - lanePositions[Math.round(currentLane)]);
        const dz = Math.abs(obstacle.position.z - camera.position.z);
        
        // Collision in same lane and close enough
        if (dx < 1 && dz < 0.5) {
          setGameState("crashed");
          return;
        }

        // Remove if passed camera
        if (obstacle.position.z > 5) {
          scene.remove(obstacles.splice(i, 1)[0]);
        }
      }

      for (let i = collectibles.length - 1; i >= 0; i--) {
        const col = collectibles[i];
        
        // Move with player
        col.position.z += currentLane * delta * 40;
        
        // Remove if passed camera
        if (col.position.z > 5) {
          scene.remove(collectibles.splice(i, 1)[0]);
        }

        // Check collision
        const dx = Math.abs(col.position.x - lanePositions[Math.round(currentLane)]);
        const dy = Math.abs((col.position.y + col.geometry.parameters.radius || 1.2) - (playerGroup.children[0].position.y || 3));
        const dz = Math.abs(col.position.z - camera.position.z);

        if (dx < 1 && dy < 1 && dz < 0.5) {
          scene.remove(collectibles.splice(i, 1)[0]);
          score += 10;
          setScore(score + 10);
          createCollectible(); // spawn new one ahead
        }

        if (scoreIncrement) break;
      }

      lastTime = currentTime;
    };

    function updatePlayerPosition(): void {
      playerGroup.position.x = lanePositions[Math.round(currentLane)];
      
      // Rotate to face direction of movement
      const targetRotationX = Math.PI / 2 - (currentLane - 1) * 0.5;
      playerGroup.rotation.z += (targetRotationX - playerGroup.rotation.z) * 5 * delta;

      // Bobbing animation when moving
      if (!playerGroup.userData.isStopped && currentLane !== targetLane) {
        const bob = Math.sin(currentTime / 200) * 0.1;
        body.position.y += bob * delta;
      } else {
        body.position.y -= 3 * delta; // return to normal
      }

      if (currentLane !== targetLane && gameState === "playing") {
        scoreIncrement = true;
        setScore(s => s + Math.floor(delta * 10));
      }

      camera.lookAt(playerGroup.position.x, playerGroup.position.y - 3, 2);
    };
    
    animate();
    
    // Cleanup on unmount
    return () => {
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, []);
