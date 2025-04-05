class StartScene extends Phaser.Scene {
  constructor() {
    super("StartScene");
  }
  
  preload() {
    // Create the player's cube as a 30x30 black square.
    this.add.graphics()
      .fillStyle(0x000000, 1)
      .fillRect(0, 0, 30, 30)
      .generateTexture('playerCube', 30, 30);
    
    // Create a spike obstacle (red triangle) for hazards.
    let spikeGraphics = this.add.graphics();
    spikeGraphics.fillStyle(0xff0000, 1);
    spikeGraphics.beginPath();
    spikeGraphics.moveTo(0, 30);
    spikeGraphics.lineTo(15, 0);
    spikeGraphics.lineTo(30, 30);
    spikeGraphics.closePath();
    spikeGraphics.fillPath();
    spikeGraphics.generateTexture('spike', 30, 30);
    
    // Create a spotlight (semi-transparent white circle).
    this.add.graphics()
      .fillStyle(0xffffff, 0.3)
      .fillCircle(0, 0, 80)
      .generateTexture('spotlight', 160, 160);
    
    // Create a platform texture as a black rectangle 80x30.
    this.add.graphics()
      .fillStyle(0x000000, 1)
      .fillRect(0, 0, 80, 30)
      .generateTexture('platform', 80, 30);
      
    // Create a platform extension texture (black rectangle that extends down)
    this.add.graphics()
      .fillStyle(0x000000, 1)
      .fillRect(0, 0, 80, 600)
      .generateTexture('platformExtension', 80, 600);
    this.load.image('pixel', 'assets/pixel.png');
  // OR generate a pixel texture on the fly if you don't have an image file:
  const graphics = this.make.graphics();
  graphics.fillStyle(0xffffff);
  graphics.fillRect(0, 0, 2, 2);
  graphics.generateTexture('pixel', 2, 2);
  graphics.destroy();
  }
  
  create() {
    const title = this.add.text(400, 200, 'SQUBE DARKNESS', { 
      fontSize: '48px', 
      fill: '#fff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    const subtitle = this.add.text(400, 260, 'A Platform Adventure', { 
      fontSize: '24px', 
      fill: '#fff'
    }).setOrigin(0.5);
    
    const startButton = this.add.text(400, 350, 'START GAME', { 
      fontSize: '32px', 
      fill: '#fff',
      backgroundColor: '#000000',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5)
    .setInteractive({ useHandCursor: true })
    .on('pointerdown', () => {
      this.scene.start('MainScene');
    });
    
    const controlsText = this.add.text(400, 450, 'Controls: WASD or Arrow Keys\nSpace or Up to Jump', { 
      fontSize: '20px', 
      fill: '#fff',
      align: 'center'
    }).setOrigin(0.5);
  }
}
