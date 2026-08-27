        case "]": currentLane = Math.round(currentLane) + 1; break;
        case "[" : currentLane = Math.max(0, Math.round(currentLane) - 1); break;
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const index = keyDown.indexOf(e.key);
      if (index > -1) keyDown.splice(index, 1);
    };

    // Attach keyboard events to renderer element for React reconciliation
    (renderer.domElement as HTMLElement).addEventListener("keydown", onKeyDown);
    (renderer.domElement as HTMLElement).addEventListener("keyup", onKeyUp); 

    let lastTime = performance.now();
    const animate = () => {
      const currentTime = performance.now();
      const delta = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      // Jump handling (Space key)
      if (!isJumping) {
        for (let i = 0; i < keyDown.length; i++) {
          if (keyDown[i] === " ") { isJumping = true; break; }
        }
      } else {
        // Apply gravity when jumping
        playerGroup.position.y += jumpVelocity;
        if (playerGroup.position.y > 0) {
          playerGroup.position.y -= gravity * delta;
        } else {
          isJumping = false;
        }
      }

      // Update obstacles (move towards camera)
      for (let i = obstacles.length - 1; i >= 0; i--) {
        const obstacle = obstacles[i];
        
        // Move obstacle forward to simulate player movement
        obstacle.position.z += 25 * delta;
EOF
