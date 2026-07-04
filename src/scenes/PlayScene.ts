import Phaser from 'phaser';

interface LevelConfig {
  level: number;
  lives?: number;
}

export class PlayScene extends Phaser.Scene {
  private currentLevel = 1;
  private lives = 3;
  private collectedCount = 0;
  private totalCollectibles = 0;

  // Physics Groups
  private platformsGroup!: Phaser.Physics.Arcade.StaticGroup;
  private spikesGroup!: Phaser.Physics.Arcade.StaticGroup;
  private berriesGroup!: Phaser.Physics.Arcade.StaticGroup;
  private shadowsGroup!: Phaser.GameObjects.Group;

  // Game Entities
  private player!: Phaser.GameObjects.Container;
  private playerBodySprite!: Phaser.GameObjects.Sprite;
  private playerFaceSprite!: Phaser.GameObjects.Sprite;
  private portal!: Phaser.GameObjects.Sprite;
  private portalLabel!: Phaser.GameObjects.Text;
  private portalActive = false;

  // Controls
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };

  // Coyote time & Wall jumps
  private coyoteTimeCounter = 0;
  private readonly coyoteTimeDuration = 160; // ms
  private wallJumpLockTimer = 0;
  private isPlayerDead = false;
  private wasGroundedLastFrame = true;

  // Touch Virtual Controls
  private leftButton!: Phaser.GameObjects.Container;
  private rightButton!: Phaser.GameObjects.Container;
  private jumpButton!: Phaser.GameObjects.Container;
  private isTouchingLeft = false;
  private isTouchingRight = false;
  private touchJumpTriggered = false;

  // UI elements
  private levelText!: Phaser.GameObjects.Text;
  private collectedText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private uiHeaderBg!: Phaser.GameObjects.Graphics;

  // Particles
  private berryParticles!: Phaser.GameObjects.Particles.ParticleEmitter;

  // Background decoration
  private bgWaves!: Phaser.GameObjects.Graphics;
  private bgTimer = 0;

  // Levels database
  private readonly LEVEL_MAPS = [
    // Level 1: Introduction
    [
      "................................",
      "................................",
      "................................",
      "................................",
      "................................",
      "....B.....................B.....",
      "....GGGG................GGGG....",
      "................................",
      ".................B..............",
      "..............GGGGGG............",
      "................................",
      ".........GGGG........GGGG.......",
      "................................",
      ".....GGGG................GGGG...",
      "................................",
      "............B.......B...........",
      "....@......GGG.....GGG......P...",
      "....GG......................GG..",
      "....DD..B................B..DD..",
      "....DDGGGG.............GGGGDDD..",
      "....DDDDDDXXXXXXXXXXXXXDDDDDDD..",
      "....DDDDDDXXXXXXXXXXXXXDDDDDDD..",
      "....DDDDDDXXXXXXXXXXXXXDDDDDDD..",
      "....DDDDDDXXXXXXXXXXXXXDDDDDDD.."
    ],
    // Level 2: Wall Jumps & Vertical Ascent (Modified to be slightly easier with safety platforms)
    [
      "............................P...",
      "..........................GGGG..",
      "..........................DDDD..",
      "....................B.....DDDD..",
      "..................GGGG....DDDD..",
      "..................DDDD....DDDD..",
      "............B.....DDDD....DDDD..",
      "..........GGGG....DDDD....DDDD..",
      "..........DDDD....DDDD....DDDD..",
      "....B.....DDDD....DDDD....DDDD..",
      "..GGGG....DDDD..SSSS..SSSSDDDD..",
      "..DDDD....DDDD....DDDD....DDDD..",
      "..DDDD....DDDD....DDDD....DDDD..",
      "..DDDD....DDDD....DDDD....DDDD..",
      "..DDDD....DDDD....DDDD....DDDD..",
      "..DDDD....DDDD....DDDD....DDDD..",
      "..DDDD....DDDD............DDDD..",
      "..DDDD....DDDD..B......B..DDDD..",
      "..DDDD@...DDDD.GGGG..GGGG.DDDD..",
      "..DDDDGG..DDDD.DDDD..DDDD.DDDD..",
      "..DDDDDDXXDDDD.DDDD..DDDD.DDDD..",
      "..DDDDDDXXDDDD.DDDD..DDDD.DDDD..",
      "..DDDDDDXXDDDD.DDDD..DDDD.DDDD..",
      "..DDDDDDXXDDDD.DDDD..DDDD.DDDD.."
    ],
    // Level 3: Stone Maze Obstacle Course (Modified to provide clear openings for boxes & C-shape portal frame)
    [
      "................................",
      "................................",
      "................................",
      "................................",
      "................................",
      ".........................SSS....",
      "......B.........B.......P..S....",
      "....S.S.S.....SSSSS......SSS....",
      "....S...S.....S...S.............",
      "....S.B.S.....S.B.S.............",
      "....SSSSS.....S.S.S.............",
      "................................",
      "..........SSS.....SSS...........",
      "..........S.S.....S.S...........",
      "..........S.S.....S.S...........",
      "..........S.S.....S.S...........",
      "....@.....S.S.....S.S.......B...",
      "....GG....S.S.....S.S......GGGG.",
      "....DD....S.S.....S.S......DDDD.",
      "....DDXXXXS.SXXXXXS.SXXXXXXDDDD.",
      "....DDXXDDS.SXXDXXS.SXXDXXXDDDD.",
      "....DDXXDDS.SXXDXXS.SXXDXXXDDDD.",
      "....DDXXDDS.SXXDXXS.SXXDXXXDDDD.",
      "....DDXXDDS.SXXDXXS.SXXDXXXDDDD."
    ]
  ];

  constructor() {
    super('PlayScene');
  }

  init(data: LevelConfig) {
    this.currentLevel = data.level || 1;
    this.lives = data.lives !== undefined ? data.lives : 3;
    this.collectedCount = 0;
    this.totalCollectibles = 0;
    this.isPlayerDead = false;
    this.portalActive = false;
    this.wallJumpLockTimer = 0;
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Create background sky & sun
    this.createBackground();

    // Create groups
    this.shadowsGroup = this.add.group();
    this.platformsGroup = this.physics.add.staticGroup();
    this.spikesGroup = this.physics.add.staticGroup();
    this.berriesGroup = this.physics.add.staticGroup();

    // Set up particles for collecting berries
    this.berryParticles = this.add.particles(0, 0, 'berry', {
      lifespan: 450,
      speed: { min: 100, max: 280 },
      scale: { start: 0.6, end: 0.0 },
      blendMode: 'ADD',
      emitting: false
    });
    this.berryParticles.setDepth(15);

    // Build the level map grid
    this.buildLevelMap();

    // Set up controls
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.wasdKeys = this.input.keyboard.addKeys('W,A,S,D') as any;
    }

    // Set up Collisions
    this.physics.add.collider(this.player, this.platformsGroup);
    this.physics.add.overlap(this.player, this.spikesGroup, this.onPlayerHitSpike, undefined, this);
    this.physics.add.overlap(this.player, this.berriesGroup, this.onPlayerCollectBerry, undefined, this);
    this.physics.add.overlap(this.player, this.portal, this.onPlayerReachPortal, () => this.portalActive, this);

    // Set game bounds Y to trigger death if player falls
    this.physics.world.setBounds(0, 0, width, height + 64);

    // Create UI overlay
    this.createUIHeader();

    // Create tutorial hints
    this.createTutorialHints();

    // Create mobile controls if on mobile device or touch device
    const isMobileOrTouch = !this.sys.game.device.os.desktop || this.sys.game.device.input.touch;
    if (isMobileOrTouch) {
      this.createMobileControls();
    }
  }

  private createBackground() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const bg = this.add.graphics();
    if (this.currentLevel === 1) {
      bg.fillGradientStyle(0x0284c7, 0x0284c7, 0x075985, 0x075985, 1);
    } else if (this.currentLevel === 2) {
      bg.fillGradientStyle(0x065f46, 0x065f46, 0x047857, 0x047857, 1);
    } else {
      bg.fillGradientStyle(0x581c87, 0x581c87, 0x3b0764, 0x3b0764, 1);
    }
    bg.fillRect(0, 0, width, height);

    // Moon/Sun
    const sun = this.add.graphics();
    sun.fillStyle(0xffffff, 0.1);
    sun.fillCircle(width / 2, 140, 75);
    sun.fillStyle(0xffffff, 0.25);
    sun.fillCircle(width / 2, 140, 50);

    // Draw background stars/dust
    for (let i = 0; i < 24; i++) {
      const star = this.add.graphics();
      star.fillStyle(0xffffff, Phaser.Math.FloatBetween(0.2, 0.6));
      star.fillCircle(
        Phaser.Math.Between(10, width - 10),
        Phaser.Math.Between(10, height / 2 + 100),
        Phaser.Math.Between(1, 3.5)
      );
    }

    this.bgWaves = this.add.graphics();
    this.drawBgWaves();
  }

  private drawBgWaves() {
    this.bgWaves.clear();
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Curved layered clouds or rolling vectors
    this.bgWaves.fillStyle(0xffffff, 0.05);
    this.bgWaves.beginPath();
    this.bgWaves.moveTo(0, height);
    for (let x = 0; x <= width; x += 16) {
      const y = height - 200 + Math.sin(x * 0.002 + this.bgTimer) * 45;
      this.bgWaves.lineTo(x, y);
    }
    this.bgWaves.lineTo(width, height);
    this.bgWaves.closePath();
    this.bgWaves.fill();

    this.bgWaves.fillStyle(0xffffff, 0.03);
    this.bgWaves.beginPath();
    this.bgWaves.moveTo(0, height);
    for (let x = 0; x <= width; x += 16) {
      const y = height - 250 + Math.cos(x * 0.003 - this.bgTimer * 1.5) * 35;
      this.bgWaves.lineTo(x, y);
    }
    this.bgWaves.lineTo(width, height);
    this.bgWaves.closePath();
    this.bgWaves.fill();
  }

  private buildLevelMap() {
    const map = this.LEVEL_MAPS[this.currentLevel - 1];
    const tileSize = 32;

    // Render loop
    for (let row = 0; row < map.length; row++) {
      const rowString = map[row];
      for (let col = 0; col < rowString.length; col++) {
        const char = rowString[col];
        const x = col * tileSize + tileSize / 2;
        const y = row * tileSize + tileSize / 2;

        if (char === 'G') {
          this.createTilePlatform(x, y, 'tile_grass');
        } else if (char === 'D') {
          this.createTilePlatform(x, y, 'tile_dirt');
        } else if (char === 'S') {
          this.createTilePlatform(x, y, 'tile_stone');
        } else if (char === 'X') {
          // Sharp spike
          const spike = this.spikesGroup.create(x, y, 'spike');
          spike.setDepth(10);
          // Set smaller hitbox for spikes too, for more forgiving gameplay
          spike.body.setSize(20, 20).setOffset(6, 12);
        } else if (char === 'B') {
          // Berry collectible
          const berry = this.berriesGroup.create(x, y, 'berry');
          berry.setDepth(8);
          this.totalCollectibles++;
          
          // Gentle hovering animation for collectibles
          this.tweens.add({
            targets: berry,
            y: y - 5,
            duration: 1000 + Math.random() * 500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.InOut'
          });
        } else if (char === '?') {
          // Sign
          const sign = this.add.sprite(x, y, 'sign');
          sign.setDepth(6);
        } else if (char === 'P') {
          // Portal
          this.portal = this.add.sprite(x, y, 'portal');
          this.portal.setDepth(5);
          this.physics.add.existing(this.portal, true);
          this.portal.alpha = 0.25; // Portal is dimmed until all berries are gathered

          // Swirl rotation
          this.tweens.add({
            targets: this.portal,
            angle: 360,
            duration: 4000,
            repeat: -1,
            ease: 'Linear'
          });

          // Portal Lock Indicator text
          this.portalLabel = this.add.text(x, y - 48, '', {
            fontFamily: 'Arial, Helvetica, sans-serif',
            fontSize: '11px',
            fontStyle: 'bold',
            color: '#ff3366',
            backgroundColor: '#0a0f1d',
            padding: { x: 6, y: 3 }
          }).setOrigin(0.5).setDepth(15);
          this.portalLabel.setStroke('#1e293b', 2);
          
          this.updatePortalLabel();
        } else if (char === '@') {
          // Player spawning
          this.createPlayer(x, y);
        }
      }
    }
  }

  private createTilePlatform(x: number, y: number, key: string) {
    // 1. Shadow: Offset 16px down, 12px right, black color, alpha 0.25 on a lower Z-layer
    const shadow = this.add.sprite(x + 12, y + 16, key);
    shadow.setTint(0x000000);
    shadow.setAlpha(0.25);
    shadow.setDepth(2);
    this.shadowsGroup.add(shadow);

    // 2. Main Platform
    const platform = this.platformsGroup.create(x, y, key);
    platform.setDepth(4);
  }

  private createPlayer(x: number, y: number) {
    // Create player container (stores visual and holds physical body)
    this.player = this.add.container(x, y);
    this.player.setDepth(12);

    // Visual body representing the player inside the container
    this.playerBodySprite = this.add.sprite(0, 0, 'hero_body');
    this.playerBodySprite.setOrigin(0.5, 0.5);
    this.player.add(this.playerBodySprite);

    // Visual eyes/face overlay positioned at the top-third of the body
    this.playerFaceSprite = this.add.sprite(0, 0, 'hero_face');
    this.playerFaceSprite.setOrigin(0.5, 0.5);
    this.player.add(this.playerFaceSprite);

    // Enable physics on the container
    this.physics.add.existing(this.player);

    // Setup forgiving collision hitbox: visual size is 40x60, body size set to 24x42
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setSize(24, 42);
    body.setOffset(-12, -21); // Center container offset
    body.setCollideWorldBounds(true);
  }

  private createUIHeader() {
    const width = this.cameras.main.width;

    this.uiHeaderBg = this.add.graphics();
    this.uiHeaderBg.fillStyle(0x0f172a, 0.65);
    this.uiHeaderBg.fillRoundedRect(16, 12, width - 32, 50, 12);
    this.uiHeaderBg.lineStyle(2, 0xffffff, 0.15);
    this.uiHeaderBg.strokeRoundedRect(16, 12, width - 32, 50, 12);
    this.uiHeaderBg.setDepth(20);

    const textStyle = {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#ffffff'
    };

    this.levelText = this.add.text(40, 25, `LEVEL 0${this.currentLevel}`, textStyle);
    this.levelText.setDepth(21);

    this.collectedText = this.add.text(
      width / 2,
      25,
      `COLLECTED: ${this.collectedCount}/${this.totalCollectibles}`,
      textStyle
    ).setOrigin(0.5, 0.0);
    this.collectedText.setDepth(21);

    this.livesText = this.add.text(
      width - 85,
      25,
      `❤️ LIVES: ${this.lives}`,
      { ...textStyle, color: '#ff3366' }
    ).setOrigin(1.0, 0.0);
    this.livesText.setDepth(21);

    // Fullscreen Toggle Button inside Header
    const fsButton = this.add.sprite(width - 45, 37, 'fullscreen_icon');
    fsButton.setOrigin(0.5);
    fsButton.setDepth(22);
    fsButton.setInteractive({ useHandCursor: true });
    
    fsButton.on('pointerdown', () => {
      if (this.scale.isFullscreen) {
        this.scale.stopFullscreen();
        try {
          if (window.screen && window.screen.orientation && (window.screen.orientation as any).unlock) {
            (window.screen.orientation as any).unlock();
          }
        } catch (e) {}
      } else {
        this.scale.startFullscreen();
        try {
          if (window.screen && window.screen.orientation && (window.screen.orientation as any).lock) {
            (window.screen.orientation as any).lock('landscape').catch(() => {});
          }
        } catch (e) {}
      }
    });
    
    fsButton.on('pointerover', () => fsButton.setScale(1.15));
    fsButton.on('pointerout', () => fsButton.setScale(1.0));
  }

  update(time: number) {
    if (this.isPlayerDead) return;

    this.bgTimer += 0.002;
    this.drawBgWaves();

    const body = this.player.body as Phaser.Physics.Arcade.Body;

    // Coyote Time Counter Update
    if (body.blocked.down) {
      this.coyoteTimeCounter = time + this.coyoteTimeDuration;
    }

    // Ground landing squash detection
    const isCurrentlyGrounded = body.blocked.down;
    if (isCurrentlyGrounded && !this.wasGroundedLastFrame && body.velocity.y >= 0) {
      // Just landed! Trigger squish (squash body and face together)
      this.tweens.add({
        targets: [this.playerBodySprite, this.playerFaceSprite],
        scaleX: 1.35,
        scaleY: 0.65,
        duration: 120,
        yoyo: true,
        ease: 'Cubic.Out'
      });
    }
    this.wasGroundedLastFrame = isCurrentlyGrounded;

    // Movement checks
    let moveLeft = (this.cursors && (this.cursors.left.isDown || this.wasdKeys.A.isDown)) || this.isTouchingLeft;
    let moveRight = (this.cursors && (this.cursors.right.isDown || this.wasdKeys.D.isDown)) || this.isTouchingRight;
    let jumpPressed = (this.cursors && (Phaser.Input.Keyboard.JustDown(this.cursors.space) || 
                       Phaser.Input.Keyboard.JustDown(this.cursors.up) || 
                       Phaser.Input.Keyboard.JustDown(this.wasdKeys.W))) ||
                       this.touchJumpTriggered;

    // Reset touchJumpTriggered immediately so it only counts for one frame
    this.touchJumpTriggered = false;

    if (this.wallJumpLockTimer > time) {
      // Input is locked due to wall jump momentum
      return;
    }

    // Horizontal Acceleration logic
    if (moveLeft) {
      body.setAccelerationX(-1200);
      if (body.velocity.x > 0) {
        body.setVelocityX(body.velocity.x * 0.9); // Quick turn friction
      }
      body.setMaxVelocity(320, 1000);

      // Shifting eyes left and tilt body
      this.playerFaceSprite.x = -3;
      this.playerFaceSprite.y = 0;
      this.playerBodySprite.setAngle(-6);
      this.playerFaceSprite.setAngle(-6);
    } else if (moveRight) {
      body.setAccelerationX(1200);
      if (body.velocity.x < 0) {
        body.setVelocityX(body.velocity.x * 0.9); // Quick turn friction
      }
      body.setMaxVelocity(320, 1000);

      // Shifting eyes right and tilt body
      this.playerFaceSprite.x = 3;
      this.playerFaceSprite.y = 0;
      this.playerBodySprite.setAngle(6);
      this.playerFaceSprite.setAngle(6);
    } else {
      body.setAccelerationX(0);
      // Crisp ground deceleration damping
      body.setVelocityX(body.velocity.x * 0.82);

      // Centered eyes and upright body
      this.playerFaceSprite.x = 0;
      this.playerFaceSprite.y = 0;
      this.playerBodySprite.setAngle(0);
      this.playerFaceSprite.setAngle(0);
    }

    // Dynamic eyes look up/down when jumping/falling
    if (body.velocity.y < -50) {
      this.playerFaceSprite.y = -3; // Shifting face upwards
    } else if (body.velocity.y > 50) {
      this.playerFaceSprite.y = 3; // Shifting face downwards
    }

    // Wall Jump & Regular Jump triggers
    if (jumpPressed) {
      if (body.blocked.down || time <= this.coyoteTimeCounter) {
        // Regular Jump
        body.setVelocityY(-560);
        this.coyoteTimeCounter = 0; // Reset coyote time
        
        // Jump stretch animation (body and face)
        this.tweens.add({
          targets: [this.playerBodySprite, this.playerFaceSprite],
          scaleX: 0.7,
          scaleY: 1.35,
          duration: 100,
          yoyo: true,
          ease: 'Cubic.Out'
        });
      } else if (!body.blocked.down) {
        // Wall bounce jumps (Left or Right wall contact)
        if (body.blocked.left) {
          body.setVelocityY(-480);
          body.setVelocityX(340);
          this.wallJumpLockTimer = time + 160; // Lock inputs slightly

          this.tweens.add({
            targets: [this.playerBodySprite, this.playerFaceSprite],
            scaleX: 0.7,
            scaleY: 1.35,
            duration: 100,
            yoyo: true,
            ease: 'Cubic.Out'
          });
        } else if (body.blocked.right) {
          body.setVelocityY(-480);
          body.setVelocityX(-340);
          this.wallJumpLockTimer = time + 160; // Lock inputs slightly

          this.tweens.add({
            targets: [this.playerBodySprite, this.playerFaceSprite],
            scaleX: 0.7,
            scaleY: 1.35,
            duration: 100,
            yoyo: true,
            ease: 'Cubic.Out'
          });
        }
      }
    }

    // Check bottom death bounds
    if (this.player.y > this.cameras.main.height + 32) {
      this.handleDeath();
    }
  }

  private onPlayerHitSpike() {
    this.handleDeath();
  }

  private onPlayerCollectBerry(_playerObj: any, berryObj: any) {
    const berry = berryObj as Phaser.Physics.Arcade.Sprite;
    
    // Check if berry is already inactive to prevent double-trigger
    if (!berry.active) return;
    
    // Disable berry body
    berry.disableBody(true, true);

    // Particle burst
    this.berryParticles.emitParticleAt(berry.x, berry.y, 15);

    // Increment count
    this.collectedCount++;
    this.collectedText.setText(`COLLECTED: ${this.collectedCount}/${this.totalCollectibles}`);

    // Create a glowing energy dot that flies into the portal
    const energyDot = this.add.graphics();
    energyDot.fillStyle(0x00ffff, 1);
    energyDot.fillCircle(0, 0, 6);
    energyDot.x = berry.x;
    energyDot.y = berry.y;
    energyDot.setDepth(15);
    
    energyDot.lineStyle(2, 0xffffff, 0.8);
    energyDot.strokeCircle(0, 0, 6);

    this.tweens.add({
      targets: energyDot,
      x: this.portal.x,
      y: this.portal.y,
      duration: 650,
      ease: 'Quad.In',
      onComplete: () => {
        energyDot.destroy();
        
        // Spawn mini burst at portal
        this.berryParticles.emitParticleAt(this.portal.x, this.portal.y, 8);
        
        // Pulse the portal visual
        this.tweens.add({
          targets: this.portal,
          scaleX: 1.4,
          scaleY: 1.4,
          duration: 100,
          yoyo: true,
          ease: 'Cubic.Out'
        });

        // Check if all collected to open the portal
        if (this.collectedCount >= this.totalCollectibles) {
          this.activatePortal();
        }
        
        this.updatePortalLabel();
      }
    });

    // Bounce UI text on collection
    this.tweens.add({
      targets: this.collectedText,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 100,
      yoyo: true,
      ease: 'Cubic.Out'
    });
  }

  private activatePortal() {
    this.portalActive = true;
    
    // Animate portal opening glow and speed
    this.tweens.add({
      targets: this.portal,
      alpha: 1.0,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 500,
      yoyo: true,
      repeat: 1,
      ease: 'Back.Out'
    });

    // Spin faster
    this.tweens.add({
      targets: this.portal,
      angle: 360,
      duration: 1000,
      repeat: -1,
      ease: 'Linear'
    });
  }

  private onPlayerReachPortal() {
    if (this.isPlayerDead) return;

    this.isPlayerDead = true;
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setEnable(false);

    // Cyan flash
    this.cameras.main.flash(400, 0, 255, 255);

    // Stage Clear popup text overlay
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    const clearPanel = this.add.graphics();
    clearPanel.fillStyle(0x0f172a, 0.65);
    clearPanel.fillRect(0, 0, width, height);
    clearPanel.setDepth(50);
    
    const clearText = this.add.text(width / 2, height / 2, 'STAGE CLEAR!', {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: '64px',
      fontStyle: 'bold',
      color: '#00ffff'
    }).setOrigin(0.5).setDepth(51);
    clearText.setShadow(0, 6, '#7e3fc7', 8, true, true);
    clearText.setScale(0);

    this.tweens.add({
      targets: clearText,
      scaleX: 1,
      scaleY: 1,
      duration: 500,
      ease: 'Back.Out'
    });

    // Portal absorption animation (spin and shrink player body/face)
    this.tweens.add({
      targets: this.player,
      x: this.portal.x,
      y: this.portal.y,
      scaleX: 0,
      scaleY: 0,
      angle: 720,
      duration: 800,
      ease: 'Cubic.In',
      onComplete: () => {
        clearPanel.destroy();
        clearText.destroy();
        this.advanceLevel();
      }
    });
  }

  private advanceLevel() {
    if (this.currentLevel < this.LEVEL_MAPS.length) {
      this.scene.restart({ level: this.currentLevel + 1, lives: this.lives });
    } else {
      // Game Won overlay
      const width = this.cameras.main.width;
      const height = this.cameras.main.height;

      const winPanel = this.add.graphics();
      winPanel.fillStyle(0x0f172a, 0.9);
      winPanel.fillRect(0, 0, width, height);
      winPanel.setDepth(100);

      const winText = this.add.text(width / 2, height / 2 - 50, 'YOU WIN!', {
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: '64px',
        fontStyle: 'bold',
        color: '#ffaa00'
      }).setOrigin(0.5).setDepth(101);
      winText.setShadow(0, 4, '#7e3fc7', 8, true, true);

      this.add.text(width / 2, height / 2 + 30, 'Congratulations on completing all levels!', {
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: '20px',
        color: '#94a3b8'
      }).setOrigin(0.5).setDepth(101);

      this.time.delayedCall(2500, () => {
        this.scene.start('MenuScene');
      });
    }
  }

  private handleDeath() {
    if (this.isPlayerDead) return;
    this.isPlayerDead = true;

    // Flash screen red
    this.cameras.main.flash(150, 255, 0, 85);
    
    // Freeze player physics
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setEnable(false);

    // Deduct life
    this.lives--;
    this.livesText.setText(`❤️ LIVES: ${this.lives}`);

    // Bounce UI text on impact
    this.tweens.add({
      targets: this.livesText,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 100,
      yoyo: true,
      ease: 'Cubic.Out'
    });

    this.time.delayedCall(250, () => {
      if (this.lives > 0) {
        this.restartLevel();
      } else {
        // Game Over overlay
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const overPanel = this.add.graphics();
        overPanel.fillStyle(0x0f172a, 0.9);
        overPanel.fillRect(0, 0, width, height);
        overPanel.setDepth(100);

        const overText = this.add.text(width / 2, height / 2, 'GAME OVER', {
          fontFamily: 'Arial, Helvetica, sans-serif',
          fontSize: '64px',
          fontStyle: 'bold',
          color: '#ff2277'
        }).setOrigin(0.5).setDepth(101);
        overText.setShadow(0, 4, '#7e3fc7', 8, true, true);

        this.time.delayedCall(2000, () => {
          this.scene.start('MenuScene');
        });
      }
    });
  }

  private updatePortalLabel() {
    if (!this.portalLabel) return;
    const remaining = this.totalCollectibles - this.collectedCount;
    if (remaining > 0) {
      this.portalLabel.setText(`🔒 LOCKED: ${remaining} LEFT`);
      this.portalLabel.setColor('#ff3366');
    } else {
      this.portalLabel.setText('🔓 PORTAL OPEN!');
      this.portalLabel.setColor('#00ffff');
      
      this.tweens.add({
        targets: this.portalLabel,
        scaleX: 1.2,
        scaleY: 1.2,
        duration: 200,
        yoyo: true,
        ease: 'Bounce.Out'
      });
    }
  }

  private createTutorialHints() {
    const textStyle = {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#cbd5e1'
    };

    if (this.currentLevel === 1) {
      this.add.text(80, 420, '← / → or A/D to Run\nSPACE or W to Jump', textStyle)
        .setOrigin(0, 0.5).setDepth(3).setAlpha(0.7);

      this.add.text(480, 220, 'Collect Berries to\nPower the Portal!', textStyle)
        .setOrigin(0.5, 0.5).setDepth(3).setAlpha(0.7).setAlign('center');
        
      this.add.text(900, 420, 'Enter the Portal\nto Escape!', textStyle)
        .setOrigin(0.5, 0.5).setDepth(3).setAlpha(0.7).setAlign('center');
    } else if (this.currentLevel === 2) {
      this.add.text(280, 520, 'Jump against walls\nto Wall-Bounce!', textStyle)
        .setOrigin(0.5, 0.5).setDepth(3).setAlpha(0.7).setAlign('center');
    }
  }

  private restartLevel() {
    this.scene.restart({ level: this.currentLevel, lives: this.lives });
  }

  private createMobileControls() {
    const height = this.cameras.main.height;
    const width = this.cameras.main.width;
    const btnRadius = 40;

    const drawBtn = (x: number, y: number, label: string, color = 0x1e293b, lineCol = 0xffffff) => {
      const btn = this.add.container(x, y);
      
      const bg = this.add.graphics();
      bg.fillStyle(color, 0.55);
      bg.fillCircle(0, 0, btnRadius);
      bg.lineStyle(3, lineCol, 0.75);
      bg.strokeCircle(0, 0, btnRadius);

      const txt = this.add.text(0, 0, label, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '32px',
        fontStyle: 'bold',
        color: '#ffffff'
      }).setOrigin(0.5);

      btn.add([bg, txt]);
      btn.setDepth(25);
      btn.setScrollFactor(0); // Lock to screen view camera

      const hitArea = new Phaser.Geom.Circle(0, 0, btnRadius);
      btn.setInteractive(hitArea, Phaser.Geom.Circle.Contains);
      
      return btn;
    };

    // Position controls nicely on bottom corners
    this.leftButton = drawBtn(80, height - 90, '◀');
    this.rightButton = drawBtn(200, height - 90, '▶');
    
    // Jump button is slightly larger and colored violet/orange
    this.jumpButton = drawBtn(width - 90, height - 90, '▲', 0x7e3fc7, 0xffaa00);
    this.jumpButton.setScale(1.15);

    // Event handlers
    this.leftButton.on('pointerdown', () => { this.isTouchingLeft = true; this.leftButton.setScale(0.9); });
    this.leftButton.on('pointerup', () => { this.isTouchingLeft = false; this.leftButton.setScale(1.0); });
    this.leftButton.on('pointerout', () => { this.isTouchingLeft = false; this.leftButton.setScale(1.0); });

    this.rightButton.on('pointerdown', () => { this.isTouchingRight = true; this.rightButton.setScale(0.9); });
    this.rightButton.on('pointerup', () => { this.isTouchingRight = false; this.rightButton.setScale(1.0); });
    this.rightButton.on('pointerout', () => { this.isTouchingRight = false; this.rightButton.setScale(1.0); });

    this.jumpButton.on('pointerdown', () => { 
      this.touchJumpTriggered = true; 
      this.jumpButton.setScale(1.05); 
    });
    this.jumpButton.on('pointerup', () => { 
      this.jumpButton.setScale(1.15); 
    });
    this.jumpButton.on('pointerout', () => { 
      this.jumpButton.setScale(1.15); 
    });
  }
}
