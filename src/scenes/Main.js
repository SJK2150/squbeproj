class MainScene extends Phaser.Scene {
  constructor() {
    super("MainScene");

    // Initialize class properties
    this.player = null;
    this.platforms = null;
    this.platformExtensions = null;
    this.spikes = null;
    this.spotlights = null;
    this.cursors = null;
    this.wasd = null;
    this.scoreText = null;
    this.distanceText = null;
    this.controlsText = null;
    this.floorDetector = null;

    // Game state variables
    this.score = 0;
    this.jumpCount = 0;
    this.maxJumps = 2;
    this.isHiding = false;
  }

  create() {
    // Set the background color (grey).
    this.cameras.main.setBackgroundColor("#808080");

    // Initialize game variables

    this.score = 0;
    this.movementSpeed = GAME_CONSTANTS.PLAYER_MOVEMENT_SPEED;

    // Set up UI elements
    this.createUIElements();

    // Define constants for sizing and positioning
    this.CUBE_SIZE = GAME_CONSTANTS.CUBE_SIZE;
    this.PLATFORM_WIDTH = GAME_CONSTANTS.PLATFORM_WIDTH;
    this.PLATFORM_HEIGHT = GAME_CONSTANTS.PLATFORM_HEIGHT;
    this.BASE_PLATFORM_Y = GAME_CONSTANTS.BASE_PLATFORM_Y;

    // Create a container for the platform extensions (visual only, no physics)
    this.platformExtensions = this.add.group();

    // Create the platforms as a static group.
    this.platforms = this.physics.add.staticGroup();

    // Call our spawn method to create initial platforms
    this.spawnPlatforms();

    // Create the player and set up physics
    this.createPlayer();

    // Set up controls
    this.setupControls();

    // Create groups for obstacles.
    this.setupObstacles();

    // Set up camera and world bounds
    this.setupCameraAndWorld();

    // Set up a floor collision detector at the bottom of the screen
    this.setupFloorDetector();
    this.physics.add.collider(this.player, this.spikes, (player, spike) => {
  if (spike.active) {  // Only if the spike is active (risen)
    this.gameOver();   // This will now include the blast effect
  }
});
  }

  createUIElements() {
    this.scoreText = this.add.text(10, 10, "Score: 0", {
      fontSize: "20px",
      fill: "#fff",
    });
    this.controlsText = this.add
      .text(400, 10, "Controls: WASD or Arrow Keys", {
        fontSize: "16px",
        fill: "#fff",
      })
      .setOrigin(0.5, 0);

    // Add distance counter in top right
    this.distanceText = this.add
      .text(770, 50, "DISTANCE\n0.0m", {
        fontSize: "20px",
        fill: "#fff",
        align: "right",
      })
      .setOrigin(1, 0);
  }

  createPlayer() {
    // Get the first platform to position the player
    let firstPlatform = this.platforms.getChildren()[0];

    // Create the player cube with proper physics body
    this.player = this.physics.add.sprite(
      400, // Position player in the middle of the screen
      firstPlatform.y - this.PLATFORM_HEIGHT / 2 - this.CUBE_SIZE / 2,
      "playerCube"
    );

    // Set up player physics
    this.player.setCollideWorldBounds(true);
    this.player.body.setGravityY(GAME_CONSTANTS.GRAVITY);
    this.player.body.setSize(this.CUBE_SIZE, this.CUBE_SIZE);
    this.player.body.setOffset(0, 0);

    // Collide the player with platforms to reset jump count.
    this.physics.add.collider(
      this.player,
      this.platforms,
      () => {
        this.jumpCount = 0;
        this.player.angle = 0; // Reset roll when landed.
      },
      null,
      this
    );
  }

  setupControls() {
    // Set up keyboard controls
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });

    // Set up jump variables.
    this.jumpCount = 0;
    this.maxJumps = 1;

    // Input for jump: UP, W, or SPACE
    this.input.keyboard.on("keydown-SPACE", this.handleJump, this);
  }

  setupObstacles() {
    // Create groups for obstacles.
    this.spikes = this.physics.add.group();
    this.spotlights = this.physics.add.group();

    // Collision: player vs spikes.
    this.physics.add.overlap(
      this.player,
      this.spikes,
      this.gameOver,
      null,
      this
    );

    // Collision: player vs spotlights (only game over if not hiding).
    this.physics.add.overlap(
      this.player,
      this.spotlights,
      (player, spotlight) => {
        if (!this.isHiding) {
          this.gameOver();
        }
      },
      null,
      this
    );

    // Spawn obstacles periodically
    this.time.addEvent({
      delay: 5000,
      callback: this.spawnObstacle,
      callbackScope: this,
      loop: true,
    });
  }

  setupCameraAndWorld() {
    // Set much larger world bounds (effectively infinite for practical purposes)
    const WORLD_WIDTH = 1000000; // 10,000 meters (1 million pixels)
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, 600);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, 600);

    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setFollowOffset(-200, 0);
  }

  setupFloorDetector() {
    this.floorDetector = this.add.zone(0, 590, 4000, 10);
    this.physics.world.enable(
      this.floorDetector,
      Phaser.Physics.Arcade.STATIC_BODY
    );
    this.physics.add.overlap(
      this.player,
      this.floorDetector,
      this.gameOver,
      null,
      this
    );
  }

  update(time, delta) {
    // Calculate distance in meters
    const displacementInMeters = (this.player.x / 100).toFixed(1);

    // Increase score based on displacement
    this.score = Math.floor(displacementInMeters * 2);

    // Update UI elements (change "DISTANCE" to "DISPLACEMENT" for clarity)
    this.scoreText.setText("Score: " + this.score);
    this.distanceText.setText(`DISPLACEMENT\n${displacementInMeters}m`);
    this.distanceText.x = this.cameras.main.scrollX + 770;

    // Handle player controls
    this.handlePlayerControls();

    // Remove off-screen objects
    this.cleanupOffscreenObjects();

    // Check if the player is "hiding" on a platform.
    this.checkPlayerHiding();

    // If the player is in the air, roll the cube.
    this.applyPlayerRoll(delta);

    // Keep the controls text with the camera
    this.controlsText.x = this.cameras.main.scrollX + 400;

    // Generate more platforms as the player moves right
    this.generateMorePlatforms();

    // Update floor detector position to follow camera
    this.floorDetector.x = this.cameras.main.scrollX;
  }

  handlePlayerControls() {
    // Handle player movement with WASD or arrow keys
    if (this.cursors.left.isDown || this.wasd.left.isDown) {
      this.player.setVelocityX(-this.movementSpeed);
    } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
      this.player.setVelocityX(this.movementSpeed);
    } else {
      this.player.setVelocityX(0);
    }

    // Jump with up arrow or W key
    if (
      (this.cursors.up.isDown || this.wasd.up.isDown) &&
      this.jumpCount < this.maxJumps
    ) {
      if (
        Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
        Phaser.Input.Keyboard.JustDown(this.wasd.up)
      ) {
        this.handleJump();
      }
    }
  }

  cleanupOffscreenObjects() {
    // Remove off-screen obstacles.
    this.spikes.getChildren().forEach((spike) => {
      if (spike.x < this.player.x - 800) spike.destroy();
    });
    this.spotlights.getChildren().forEach((light) => {
      if (light.x < this.player.x - 800) light.destroy();
    });

    // Clean up off-screen platform extensions
    this.platformExtensions.getChildren().forEach((extension) => {
      if (extension.x < this.player.x - 800) extension.destroy();
    });
  }

  checkPlayerHiding() {
    this.isHiding = false;
    this.physics.overlap(this.player, this.platforms, () => {
      this.isHiding = true;
    });
  }

  applyPlayerRoll(delta) {
    if (!this.player.body.touching.down && !this.player.body.blocked.down) {
      this.player.angle += (2.5 * delta) / 16; // Adjust roll speed as needed.
    }
  }

  handleJump() {
    if (this.jumpCount < this.maxJumps) {
      this.player.setVelocityY(GAME_CONSTANTS.JUMP_VELOCITY);
      this.jumpCount++;
    }
  }

  getNextPlatformY(prevY) {
    // Calculate height difference (at most one cube height up or down)
    let heightDiff = Phaser.Math.Between(-this.CUBE_SIZE, this.CUBE_SIZE);

    // Make sure platforms don't vary too wildly
    if (heightDiff > 0) heightDiff = this.CUBE_SIZE;
    if (heightDiff < 0) heightDiff = -this.CUBE_SIZE;

    // Make sure the new platform is within acceptable bounds
    let minY = this.BASE_PLATFORM_Y - this.CUBE_SIZE * 4; // Allow up to 4 cubes height from base
    let maxY = this.BASE_PLATFORM_Y;

    return Phaser.Math.Clamp(prevY + heightDiff, minY, maxY);
  }

  createPlatformExtension(x, y) {
    // Calculate the Y position for the extension (from platform bottom to screen bottom)
    const extensionHeight = 600 - y - this.PLATFORM_HEIGHT / 2;
    const extensionY = y + this.PLATFORM_HEIGHT / 2 + extensionHeight / 2;

    // Create an extension sprite with the correct height
    const extension = this.platformExtensions.create(
      x,
      extensionY,
      "platformExtension"
    );

    // Scale the extension to the correct height
    extension.setDisplaySize(this.PLATFORM_WIDTH, extensionHeight);

    // Set the depth to be behind the platforms but visible
    extension.setDepth(-1);

    return extension;
  }

  generateMorePlatforms() {
  let rightmostX = -Infinity;
  let rightmostPlatform = null;

  this.platforms.getChildren().forEach(platform => {
    if (platform.x > rightmostX) {
      rightmostX = platform.x;
      rightmostPlatform = platform;
    }
  });

  if (this.player.x > rightmostX - 600) {
    let currentX = rightmostX + this.PLATFORM_WIDTH;
    let currentY = rightmostPlatform ? rightmostPlatform.y : this.BASE_PLATFORM_Y;

    for (let i = 0; i < 3; i++) {
      // 20% chance to skip a platform segment, creating a gap
      if (Phaser.Math.Between(0, 10) < 2) {
        currentX += this.PLATFORM_WIDTH; // Skip this segment
        continue;
      }

      currentY = this.getNextPlatformY(currentY);

      let platform = this.platforms.create(
        currentX + (this.PLATFORM_WIDTH / 2),
        currentY + (this.PLATFORM_HEIGHT / 2),
        'platform'
      );
      platform.body.setSize(this.PLATFORM_WIDTH, this.PLATFORM_HEIGHT);
      platform.body.setOffset(0, 0);
      platform.refreshBody();

      this.createPlatformExtension(currentX + (this.PLATFORM_WIDTH / 2), currentY + (this.PLATFORM_HEIGHT / 2));

      currentX += this.PLATFORM_WIDTH;

      if (Phaser.Math.Between(0, 10) === 0) {
        this.spawnSpikeAt(platform.x, platform.y - (this.PLATFORM_HEIGHT / 2) - (this.CUBE_SIZE / 2));
      }
    }
  }
}

  spawnPlatforms() {
  let numSegments = Math.ceil(800 / this.PLATFORM_WIDTH) + 10; // Initial segments
  let currentX = 0;
  let currentY = this.BASE_PLATFORM_Y;

  for (let i = 0; i < numSegments; i++) {
    // 20% chance to skip a platform segment, creating a gap
    if (Phaser.Math.Between(0, 10) < 2) {
      currentX += this.PLATFORM_WIDTH; // Skip this segment
      continue;
    }

    let platform = this.platforms.create(
      currentX + (this.PLATFORM_WIDTH / 2),
      currentY + (this.PLATFORM_HEIGHT / 2),
      'platform'
    );
    platform.body.setSize(this.PLATFORM_WIDTH, this.PLATFORM_HEIGHT);
    platform.body.setOffset(0, 0);
    platform.refreshBody();

    this.createPlatformExtension(currentX + (this.PLATFORM_WIDTH / 2), currentY + (this.PLATFORM_HEIGHT / 2));

    currentX += this.PLATFORM_WIDTH;

    if (i > 3) {
      currentY = this.getNextPlatformY(currentY);
    }
  }
}

  spawnObstacle() {
    // Spawn obstacles ahead of the player
    const aheadX = this.player.x + 800;

    // Randomly decide whether to spawn a spike or spotlight
    if (Phaser.Math.Between(0, 1) === 0) {
      // Find a platform in the area ahead to place a spike on
      let targetPlatform = null;
      this.platforms.getChildren().forEach((platform) => {
        if (Math.abs(platform.x - aheadX) < 200) {
          targetPlatform = platform;
        }
      });

      if (targetPlatform) {
        this.spawnSpikeAt(
          targetPlatform.x,
          targetPlatform.y - this.PLATFORM_HEIGHT / 2 - this.CUBE_SIZE / 2
        );
        this.spawnSpotlightAt(aheadX, Phaser.Math.Between(100, 500));
      }
    } else {
      this.spawnSpotlightAt(aheadX, Phaser.Math.Between(100, 500));
    }
  }

  spawnSpikeAt(x, y) {
  // Position spike below the platform initially
  let spike = this.spikes.create(x, y + this.CUBE_SIZE, 'spike');
  spike.setTint(0x000000);
  spike.body.allowGravity = false;
  spike.setImmovable(true);
  spike.setActive(false); // Inactive (no collision) when below platform

  // Define the animation loop function
  const animateSpike = () => {
    this.tweens.add({
      targets: spike,
      y: y, // Emerge to the surface
      duration: 500, // 0.5 seconds to rise
      ease: 'Linear',
      onComplete: () => {
        spike.setActive(true); // Enable collision when fully emerged
        this.time.delayedCall(5000, () => { // Stay for 5 seconds
          this.tweens.add({
            targets: spike,
            y: y + this.CUBE_SIZE, // Retract below platform
            duration: 500, // 0.5 seconds to retract
            ease: 'Linear',
            onComplete: () => {
              spike.setActive(false); // Disable collision when retracted
              this.time.delayedCall(2000, animateSpike); // Wait 2 seconds, then repeat
            }
          });
        });
      }
    });
  };

  // Start the animation
  animateSpike();
}

  spawnSpotlightAt(x, y) {
  // Set a fixed height for all spotlights
  const spotlightY = 200; // Adjust this value to set the desired height

  // Create the spotlight (black cube)
  const spotlight = this.add.rectangle(x, spotlightY, 50, 50, 0x000000); // Black cube
  this.physics.add.existing(spotlight); // Add physics to the rectangle
  spotlight.body.setAllowGravity(false); // Disable gravity for the spotlight
  spotlight.body.setVelocityX(-200); // Move left at a constant speed
  this.spotlights.add(spotlight); // Add to the spotlights group

  // Create the diverging beam of light (triangle)
  const beam = this.add.graphics();
  beam.fillStyle(0xffff00, 0.2); // Yellow light with 20% opacity

  // Define the beam's triangular collision area
  const beamTriangle = new Phaser.Geom.Triangle();

  // Function to update beam graphics and triangle points
  const updateBeam = () => {
    beam.clear(); // Clear previous drawing
    beam.fillStyle(0xffff00, 0.2);
    beam.beginPath();
    beam.moveTo(spotlight.x, spotlightY + 25);
    beam.lineTo(spotlight.x - 350, spotlightY + 400);
    beam.lineTo(spotlight.x + 150, spotlightY + 400);
    beam.closePath();
    beam.fill();

    beamTriangle.setTo(
      spotlight.x, spotlightY + 25,           // Top
      spotlight.x - 350, spotlightY + 400,   // Bottom-left
      spotlight.x + 150, spotlightY + 400    // Bottom-right
    );
  };

  updateBeam(); // Initial draw

  // Store beam and triangle references
  spotlight.beam = beam;
  spotlight.beamTriangle = beamTriangle;

  // Check for overlap and update beam position every frame
  const overlapTimer = this.time.addEvent({
    delay: 16, // Check every frame (60 FPS)
    callback: () => {
      updateBeam(); // Update beam and triangle to follow spotlight

      if (
        Phaser.Geom.Triangle.ContainsPoint(
          beamTriangle,
          new Phaser.Geom.Point(this.player.x, this.player.y)
        )
      ) {
        if (!this.isHiding) {
          console.log("Player hit by spotlight beam!");
          this.gameOver();
        }
      }
    },
    loop: true,
  });

  // Store the timer for cleanup
  spotlight.overlapTimer = overlapTimer;

  // Destroy the spotlight and beam when they move off-screen
  this.time.addEvent({
    delay: 10000, // Adjust based on how long it takes to move off-screen
    callback: () => {
      if (spotlight.overlapTimer) {
        spotlight.overlapTimer.remove(); // Stop the overlap timer
      }
      spotlight.destroy(); // Destroy the physics rectangle
      beam.destroy();     // Destroy the graphics object
      // No need to destroy beamTriangle
    },
  });
}
  // gameOver() {
  //   console.log("Game Over! Transitioning to GameOverScene...");

  //   // Stop player movement
  //   this.player.setVelocity(0);
  //   this.player.setTint(0xff0000); // Optional: Flash red to indicate death

  //   // Short delay before switching scenes
  //   this.time.delayedCall(1000, () => {
  //     this.scene.start("GameOverScene", { score: Math.floor(this.score) });
  //   });
  // }
  createBlastEffect(x, y, color = 0xffffff) {
  // Create a particle emitter for the blast effect
  const particles = this.add.particles('pixel'); // Use a simple pixel texture or create one
  
  const emitter = particles.createEmitter({
    x: x,
    y: y,
    speed: { min: 100, max: 200 },
    angle: { min: 0, max: 360 },
    scale: { start: 0.5, end: 0 },
    blendMode: 'ADD',
    lifespan: 800,
    gravityY: 300,
    quantity: 1,
    frequency: 20,
    tint: color,
    maxParticles: 40
  });

  // Create small square fragments
  for (let i = 0; i < 12; i++) {
    const fragment = this.add.rectangle(
      x + Phaser.Math.Between(-5, 5),
      y + Phaser.Math.Between(-5, 5),
      Phaser.Math.Between(5, 10),
      Phaser.Math.Between(5, 10),
      color
    );
    
    // Add physics to the fragments
    this.physics.add.existing(fragment);
    fragment.body.setVelocity(
      Phaser.Math.Between(-200, 200),
      Phaser.Math.Between(-300, -100)
    );
    
    // Rotate the fragments
    this.tweens.add({
      targets: fragment,
      angle: Phaser.Math.Between(-360, 360),
      duration: Phaser.Math.Between(800, 1500),
      ease: 'Power1'
    });
    
    // Fade out and destroy the fragments
    this.tweens.add({
      targets: fragment,
      alpha: 0,
      delay: Phaser.Math.Between(300, 600),
      duration: 300,
      onComplete: () => {
        fragment.destroy();
      }
    });
  }
  
  // Stop the emitter after a short time
  this.time.delayedCall(200, () => {
    emitter.stop();
  });
  
  // Clean up the particles system after all particles are gone
  this.time.delayedCall(1000, () => {
    particles.destroy();
  });
}
  gameOver() {
  // Get player color before we change it (for the blast effect)
  const playerColor = this.player.tintTopLeft || 0xffffff;
  
  // Create the blast effect at player position
  this.createBlastEffect(this.player.x, this.player.y, playerColor);
  
  // Hide the player immediately
  this.player.setVisible(false);
  
  // Stop all timers and events
  this.time.removeAllEvents(); // Stops all active timers
  this.physics.pause(); // Pause all physics bodies
  this.input.keyboard.enabled = false; // Disable player controls

  // Wait a short moment to see the blast before showing game over UI
  this.time.delayedCall(500, () => {
    // Center elements
    const { width, height } = this.cameras.main;
    const centerX = this.cameras.main.scrollX + width / 2;
    const centerY = height / 2;

    // Box dimensions
    const boxWidth = 400; // Increased width
    const boxHeight = 220;
    const box = this.add.graphics();
    box.fillStyle(0x000000, 0.7); // Black box with 70% opacity
    box.fillRoundedRect(
      centerX - boxWidth / 2,
      centerY - boxHeight / 2,
      boxWidth,
      boxHeight,
      20
    );

    // Game Over Text
    this.add
      .text(centerX, centerY - 70, "Game Over", {
        fontSize: "42px",
        fill: "#ff0000",
        fontFamily: "Arial",
        fontWeight: "bold",
      })
      .setOrigin(0.5);

    // Score Text (truncated to integer)
    this.add
      .text(centerX, centerY - 20, `Your Score: ${Math.floor(this.score)}`, {
        fontSize: "30px",
        fill: "#ffffff",
        fontFamily: "Arial",
      })
      .setOrigin(0.5);

    // Restart Button
    const button = this.add
      .text(centerX, centerY + 40, "Restart", {
        fontSize: "26px",
        backgroundColor: "#ffffff",
        padding: { x: 20, y: 12 },
        color: "#000000",
        fontFamily: "Arial",
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => {
        // Reset input and physics before restarting
        this.input.keyboard.enabled = true;
        this.physics.resume();
        this.scene.start("StartScene"); // Restart the game properly
      })
      .on("pointerover", () => button.setStyle({ backgroundColor: "#ddd" }))
      .on("pointerout", () => button.setStyle({ backgroundColor: "#ffffff" }));
  });
}

  // gameOver() {
  //   // Display a game over message
  //   let gameOverText = this.add.text(this.cameras.main.scrollX + 400, 300, 'GAME OVER', {
  //     fontSize: '64px',
  //     fill: '#ff0000',
  //     fontStyle: 'bold'
  //   }).setOrigin(0.5);

  //   // Show final score
  //   this.add.text(this.cameras.main.scrollX + 400, 375, `Final Score: ${Math.floor(this.score)}`, {
  //     fontSize: '32px',
  //     fill: '#ffffff'
  //   }).setOrigin(0.5);

  //   // Add a restart button
  //   let restartButton = this.add.text(this.cameras.main.scrollX + 400, 450, 'RESTART', {
  //     fontSize: '32px',
  //     fill: '#ffffff',
  //     backgroundColor: '#000000',
  //     padding: { x: 20, y: 10 }
  //   }).setOrigin(0.5)
  //   .setInteractive({ useHandCursor: true })
  //   .on('pointerdown', () => {
  //     this.scene.restart();
  //   });

  //   // Pause the game
  //   this.physics.pause();
  //   this.tweens.pauseAll();
  // }
}
