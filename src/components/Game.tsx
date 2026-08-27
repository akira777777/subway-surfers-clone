
    // Player character (train-like model)
    const playerGroup = new THREE.Group();
    
    // Main body (rectangular prism for train)
    const bodyGeo = new THREE.BoxGeometry(1.8, 2.5, 0.9);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xd63031 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    playerGroup.add(body);

    // Head (caboose)
    const headGeo = new THREE.BoxGeometry(1.2, 1.4, 1.4);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xfeca57 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.3;
    playerGroup.add(head);

    scene.add(playerGroup);

    // Lanes for player movement (left, center, right)
    const lanePositions: number[] = [-3.5, 0, 3.5];
    
    function createLane(laneIndex: number): THREE.Mesh {
      const geometry = new THREE.PlaneGeometry(8, 40);
      const material = new THREE.MeshStandardMaterial({ 
        color: laneIndex === 0 ? 0x95a7a5 : laneIndex === 1 ? 0xd4a373 : 0xc8d6c5,
        transparent: true,
        opacity: 0.2
      });
      const plane = new THREE.Mesh(geometry, material);
      plane.rotation.x = Math.PI / 2;
      plane.position.set(lanePositions[laneIndex], -15, 3);
      return plane;
    }

    // Create all lanes initially
    const initialLanes = [createLane(0), createLane(1), createLane(2)];
    for (let i = 0; i < 3; i++) {
      scene.add(initialLanes[i]);
    }

    // Obstacles manager (trains, barriers)
    let obstacles: THREE.Mesh[] = [];
    
    function createObstacle(): void {
      const types = [
        { geometry: new THREE.BoxGeometry(2.5, 1.8, 0.6), heightMod: 0 }, // low barrier
        { geometry: new THREE.BoxGeometry(3, 3, 1), heightMod: 4 },       // tall train-like
      ];
      
      const typeIndex = Math.floor(Math.random() * types.length);
      const type = types[typeIndex];
      const material = new THREE.MeshStandardMaterial({ color: 0xe76f51 });
      const mesh = new THREE.Mesh(type.geometry, material);

      // Random lane selection (avoid same as current)
      let targetLane = Math.floor(Math.random() * 3);
      while (Math.abs(lanePositions[targetLane] - playerGroup.position.x) < 2) {
        targetLane = (targetLane + 1) % 3;
      }
      
      mesh.position.set(lanePositions[targetLane], type.heightMod, -60 - Math.random() * 40);
      scene.add(mesh);
      obstacles.push(mesh);
    }

    // Collectibles (coins, gems)
    let collectibles: THREE.Mesh[] = [];
    
    function createCollectible(): void {
      const geometry = new THREE.SphereGeometry(1.2, 8, 8);
      const material = new THREE.MeshStandardMaterial({ 
        color: 0xfdc93a,
        emissive: 0xffaa00,
        emissiveIntensity: 0.5
      });
      const mesh = new THREE.Mesh(geometry, material);

      // Random lane for coin (avoid same as current)
      let targetLane = Math.floor(Math.random() * 3);
      while (Math.abs(lanePositions[targetLane] - playerGroup.position.x) < 2) {
        targetLane = (targetLane + 1) % 3;
      }
      
      mesh.position.set(lanePositions[targetLane], 0.8, -55);
      scene.add(mesh);
      collectibles.push(mesh);
    }

    // Spawn initial obstacles and collectibles
    for (let i = 0; i < 3; i++) createObstacle();
    for (let i = 0; i < 2; i++) createCollectible();
