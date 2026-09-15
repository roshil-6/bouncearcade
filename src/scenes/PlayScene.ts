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

  // Game Entities
  private player!: Phaser.GameObjects.Container;
  private playerBodySprite!: Phaser.GameObjects.Sprite;
  private playerFaceSprite!: Phaser.GameObjects.Sprite;
  private portal!: Phaser.GameObjects.Sprite;
  private portalLabel!: Phaser.GameObjects.Text;
  private portalActive = false;

  // Controls
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key; };

  // Coyote time & Wall jumps
  private coyoteTimeCounter = 0;
  private readonly coyoteTimeDuration = 160;
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
  private collectedText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;

  // Particles
  private berryParticles!: Phaser.GameObjects.Particles.ParticleEmitter;

  // World size
  private worldWidth = 1024;

  // 5 Long scrolling levels — Red Ball style
  // T = tile_grass top (ground surface), D = dirt, S = stone/steel tile, X = spike, B = berry, P = portal, @ = spawn
  // Each row is 80 chars wide = 2560px; 24 rows tall = 768px
  private readonly LEVEL_MAPS: string[][] = [
    // ==========================================
    // LEVEL 1 — Grassy Start (introductory run)
    // ==========================================
    [
      "................................................................................",
      "................................................................................",
      "......B.....................................................B...................",
      "......GGGG..............................................GGGG...................",
      "................................................................................",
      "...........B.......B..............B.................B.......B...............",
      "...........GGGG..GGGG............GGGG...............GGGG..GGGG.........P.....",
      "..............................................B..B...............B.....GGGGG..",
      "....................................................GGGG.........GGGG.....DDDDD",
      "................B...........B.......................................DDDDDDDDDDD",
      "..........GGGGGGGG.....GGGGGGGG..................................................",
      "..................................................................................",
      ".....B...............................B.........B......................B........",
      "...GGGG.....GGGG.....GGGG.......GGGG.......GGGG....GGGG.......GGGG.....GGGG.",
      "................................................................................",
      "...@............................................................................",
      "GGGGGGGGGGGG...........GGGGGGGG.................GGGGGGGG.....GGGG.........GGGG",
      "DDDDDDDDDDDD...........DDDDDDDD.................DDDDDDDD.....DDDD.........DDDD",
      "DDDDDDDDDDDDXXXX...XXXXDDDDDDDDXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXDDDDXXXXXXXX..DDDD",
      "DDDDDDDDDDDDDDDDXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX..DDDD",
      "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
      "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
      "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
      "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD"
    ],
    // ==========================================
    // LEVEL 2 — Wall Jumper (vertical + walls)
    // ==========================================
    [
      "..............................................P..................................",
      "............................................GGGGG................................",
      "............................................DDDDD...............................B",
      "............................................DDDDD...........................GGGGG",
      "......B.....................................DDDDD...........................DDDDD",
      "....GGGGG...................................DDDDD...........................DDDDD",
      "....DDDDD..........B.....B..................DDDDD...........................DDDDD",
      "....DDDDD........GGGGG.GGGGG................DDDDD...........................DDDDD",
      "....DDDDD........DDDDDDDDDDD................DDDDD...........................DDDDD",
      "....DDDDD........DDDDDDDDDDD..B.............DDDDD.....B.............B.....DDDDD",
      "....DDDDD........DDDDDDDDDDD.GGGGG..........DDDDD...GGGGG.........GGGGG...DDDDD",
      "....DDDDD...SSSS..DDDDDDDDDDD.DDDDD..........DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
      "....DDDDD...SSSS..DDDDDDDDDDD.DDDDD..........DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
      "....DDDDD...SSSS..DDDDDDDDDDD.DDDDD..........DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
      "....DDDDD...........DDDDDD....DDDDD..........DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
      "....DDDDD........B..DDDDDD..B.DDDDD..........DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
      "....DDDDD......GGGG.DDDDDD.GG.DDDDD..........DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
      "....DDDDD......DDDD.DDDDDD.DD.DDDDD..........DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
      "....DDDDD@.....DDDD.DDDDDD.DD.DDDDD..........DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
      "....DDDDDDG....DDDD.DDDDDD.DD.DDDDD..........DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
      "....DDDDDDDDXXXX....DDDDDD....DDDDD..........DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
      "....DDDDDDDDDDDDXXXXDDDDDDDDDDDDDDDDXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXD",
      "....DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
      "....DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD"
    ],
    // ==========================================
    // LEVEL 3 — Stone Rush (mixed obstacles)
    // ==========================================
    [
      "................................................................................",
      "................................................................................",
      "......B.......B.......B.......B.......B.......B.......B.......B.......B.......",
      "......SSSS...SSSS...SSSS.....SSSS...SSSS.....SSSS...SSSS.....SSSS...SSSS....",
      "................................................................................",
      "...........B.....B.........B.....B.........B.....B.........B.....B...........",
      ".........SSSS...SSSS.....SSSS...SSSS.....SSSS...SSSS.....SSSS...SSSS......P..",
      "..............................................................................GGGGG",
      "..............................................................................DDDDD",
      "................B..........................................................B...DDDDD",
      ".............SSSSSS...................................................SSSSSS...DDDDD",
      "................................................................................DDDDD",
      "....B.........................................................................B.DDDDD",
      "..SSSS..SSSS..SSSS..SSSS..SSSS..SSSS..SSSS..SSSS..SSSS..SSSS..SSSS..SSSS..SSSS.DDDDD",
      "................................................................................DDDDD",
      "..@.............................................................................DDDDD",
      "GGGGGGGGGGG...........GGGGG.................GGGGG.......GGGGG.......GGGGG.....GGGGG",
      "DDDDDDDDDDD...........DDDDD.................DDDDD.......DDDDD.......DDDDD.....DDDDD",
      "DDDDDDDDDDDXXXXXXXX...DDDDDXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX..DDDDD",
      "DDDDDDDDDDDDDDDDDDDXXXDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
      "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
      "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
      "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
      "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD"
    ],
    // ==========================================
    // LEVEL 4 — Sky Rush (long gap jumps, spikes)
    // ==========================================
    [
      "................................................................................",
      "................................................................................",
      "..B.....B.....B.....B.....B.....B.....B.....B.....B.....B.....B.....B......P..",
      "GGGG...GGGG..GGGG..GGGG..GGGG..GGGG..GGGG..GGGG..GGGG..GGGG..GGGG..GGGG..GGGG",
      "DDDD...DDDD..DDDD..DDDD..DDDD..DDDD..DDDD..DDDD..DDDD..DDDD..DDDD..DDDD..DDDD",
      "XXXX...XXXX..XXXX..XXXX..XXXX..XXXX..XXXX..XXXX..XXXX..XXXX..XXXX..XXXX..XXXX",
      "................................................................................",
      "................................................................................",
      "..B..........B.........B..........B.........B..........B.........B.............",
      ".SSSS.......SSSS......SSSS.......SSSS......SSSS.......SSSS......SSSS...........",
      "..DDDD......DDDD......DDDD.......DDDD......DDDD.......DDDD......DDDD..........",
      "...............................................................................",
      ".....B................B................B................B......................",
      "....GGGG............GGGG............GGGG............GGGG......................",
      "....DDDD............DDDD............DDDD............DDDD......................",
      "..@................................................................................",
      "GGGGGGGG.........................................GGGGGGGG......................",
      "DDDDDDDD.........................................DDDDDDDD......................",
      "DDDDDDDDXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
      "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
      "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
      "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
      "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD"
    ],
    // ==========================================
    // LEVEL 5 — Final Gauntlet
    // ==========================================
    [
      "................................................................................",
      "...B.....B.....B.....B.....B.....B.....B.....B.....B.....B.....B.....B.....B..",
      "..SSSS..SSSS..SSSS..SSSS..SSSS..SSSS..SSSS..SSSS..SSSS..SSSS..SSSS..SSSS..SSSS",
      "..DDDD..DDDD..DDDD..DDDD..DDDD..DDDD..DDDD..DDDD..DDDD..DDDD..DDDD..DDDD..DDDD",
      "..XXXX..XXXX..XXXX..XXXX..XXXX..XXXX..XXXX..XXXX..XXXX..XXXX..XXXX..XXXX..XXXX",
      "................................................................................",
      "................................................................................",
      "....B...........B...........B...........B...........B...........B..............P",
      "..GGGGG.......GGGGG.......GGGGG.......GGGGG.......GGGGG.......GGGGG..........GGGGG",
      "..DDDDD.......DDDDD.......DDDDD.......DDDDD.......DDDDD.......DDDDD..........DDDDD",
      "....XXXX.........XXXX.........XXXX.........XXXX.........XXXX.........XXXX.....DDDDD",
      "................................................................................DDDDD",
      "...B............B............B............B............B............B..........DDDDD",
      ".SSSS.........SSSS.........SSSS.........SSSS.........SSSS.........SSSS.......DDDDD",
      ".DDDD.........DDDD.........DDDD.........DDDD.........DDDD.........DDDD.......DDDDD",
      "..@.............................................................................DDDDD",
      "GGGGGGG........GGGGG......GGGGG......GGGGG......GGGGG......GGGGG...........GGGGGDDDDD",
      "DDDDDDD........DDDDD......DDDDD......DDDDD......DDDDD......DDDDD...........DDDDDDDDDD",
      "DDDDDDDXXXXXXXXDDDDXXXXXXXXDDDDXXXXXXXXDDDDXXXXXXXXDDDDXXXXXXXXDDDDXXXXXXXXXXXXXXXXXXX",
      "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
      "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
      "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
      "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
      "DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD"
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
    const height = this.cameras.main.height;

    // Calculate world width from map columns
    const map = this.LEVEL_MAPS[this.currentLevel - 1];
    const tileSize = 32;
    this.worldWidth = Math.max(...map.map(r => r.length)) * tileSize;

    // Background (unified purple twilight for all levels)
    this.createBackground();

    // Groups
    this.platformsGroup = this.physics.add.staticGroup();
    this.spikesGroup = this.physics.add.staticGroup();
    this.berriesGroup = this.physics.add.staticGroup();

    // Berry particles
    this.berryParticles = this.add.particles(0, 0, 'berry', {
      lifespan: 450,
      speed: { min: 100, max: 280 },
      scale: { start: 0.6, end: 0.0 },
      blendMode: 'ADD',
      emitting: false
    });
    this.berryParticles.setDepth(15);

    // Build level
    this.buildLevelMap();

    // Camera follows player, world bounds = full map width
    this.physics.world.setBounds(0, 0, this.worldWidth, height + 64);
    this.cameras.main.setBounds(0, 0, this.worldWidth, height);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);

    // Controls
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.wasdKeys = this.input.keyboard.addKeys('W,A,S,D') as any;
    }

    // Collisions
    this.physics.add.collider(this.player, this.platformsGroup);
    this.physics.add.overlap(this.player, this.spikesGroup, this.onPlayerHitSpike, undefined, this);
    this.physics.add.overlap(this.player, this.berriesGroup, this.onPlayerCollectBerry, undefined, this);
    this.physics.add.overlap(this.player, this.portal, this.onPlayerReachPortal, () => this.portalActive, this);

    // UI (fixed to camera)
    this.createUIHeader();

    // Tutorial
    this.createTutorialHints();

    // Mobile controls
    const isMobileOrTouch = !this.sys.game.device.os.desktop || this.sys.game.device.input.touch;
    if (isMobileOrTouch) {
      this.createMobileControls();
    }
  }

  private createBackground() {
    const W = this.worldWidth;
    const H = this.cameras.main.height;

    // Unified purple twilight background across full world width
    const bg = this.add.graphics().setDepth(0).setScrollFactor(0);
    // Draw it at camera size (parallax fixed)
    bg.fillGradientStyle(0x0d0025, 0x0d0025, 0x1a0a4e, 0x1a0a4e, 1);
    bg.fillRect(0, 0, 1024, H * 0.4);
    bg.fillGradientStyle(0x1a0a4e, 0x1a0a4e, 0x311b92, 0x311b92, 1);
    bg.fillRect(0, H * 0.35, 1024, H * 0.65);

    // Moon glow (fixed to camera)
    const moon = this.add.graphics().setDepth(1).setScrollFactor(0);
    const mx = 512, my = 120, mr = 65;
    for (let i = 5; i >= 1; i--) {
      moon.fillStyle(0xd0e8ff, 0.04 * i);
      moon.fillCircle(mx, my, mr + i * 14);
    }
    moon.fillStyle(0xdce8ff, 0.2); moon.fillCircle(mx, my, mr);
    moon.fillStyle(0xf0f6ff, 0.6); moon.fillCircle(mx, my, mr * 0.55);
    moon.fillStyle(0xfcfeff, 0.85); moon.fillCircle(mx, my, mr * 0.28);

    // Stars (fixed to camera)
    const stars = this.add.graphics().setDepth(1).setScrollFactor(0);
    for (let i = 0; i < 45; i++) {
      stars.fillStyle(0xffffff, Math.random() * 0.5 + 0.15);
      stars.fillCircle(Math.random() * 1024, Math.random() * H * 0.55, Math.random() * 2 + 0.5);
    }

    // Scrolling mountain silhouettes (parallax 0.3 scroll)
    const mountains = this.add.graphics().setDepth(2).setScrollFactor(0.3);
    mountains.fillStyle(0x1a1040, 1);
    mountains.beginPath();
    const mpts = [0,0,0.1,-0.15,0.2,-0.1,0.3,-0.25,0.4,-0.12,0.5,-0.3,0.6,-0.18,0.7,-0.28,0.8,-0.1,0.9,-0.2,1,0];
    for (let i = 0; i < mpts.length; i += 2) {
      const x = mpts[i] * W * 3; const y = H * 0.65 + mpts[i+1] * H * 0.4;
      if (i === 0) mountains.moveTo(x, y); else mountains.lineTo(x, y);
    }
    mountains.lineTo(W * 3, H); mountains.lineTo(0, H); mountains.closePath(); mountains.fill();

    // Closer mountain layer (parallax 0.5)
    const mountains2 = this.add.graphics().setDepth(3).setScrollFactor(0.5);
    mountains2.fillStyle(0x241455, 1);
    mountains2.beginPath();
    const mpts2 = [0,0,0.08,-0.1,0.16,-0.07,0.25,-0.18,0.34,-0.09,0.43,-0.2,0.52,-0.11,0.61,-0.18,0.7,-0.07,0.8,-0.14,0.9,-0.09,1,0];
    for (let i = 0; i < mpts2.length; i += 2) {
      const x = mpts2[i] * W * 3; const y = H * 0.72 + mpts2[i+1] * H * 0.35;
      if (i === 0) mountains2.moveTo(x, y); else mountains2.lineTo(x, y);
    }
    mountains2.lineTo(W * 3, H); mountains2.lineTo(0, H); mountains2.closePath(); mountains2.fill();

    // Ground mist (parallax 0.8)
    const mist = this.add.graphics().setDepth(3).setScrollFactor(0.8);
    mist.fillStyle(0x3d1f7a, 0.35);
    mist.fillRect(0, H * 0.8, W * 2, H * 0.2);
  }

  private buildLevelMap() {
    const map = this.LEVEL_MAPS[this.currentLevel - 1];
    const tileSize = 32;

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
          const spike = this.spikesGroup.create(x, y, 'spike');
          spike.setDepth(10);
          spike.body.setSize(20, 20).setOffset(6, 12);
        } else if (char === 'B') {
          const berry = this.berriesGroup.create(x, y, 'berry');
          berry.setDepth(8);
          this.totalCollectibles++;
          this.tweens.add({
            targets: berry,
            y: y - 6,
            duration: 1000 + Math.random() * 500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.InOut'
          });
        } else if (char === 'P') {
          this.portal = this.add.sprite(x, y, 'portal');
          this.portal.setDepth(5);
          this.physics.add.existing(this.portal, true);
          this.portal.alpha = 0.25;
          this.tweens.add({ targets: this.portal, angle: 360, duration: 4000, repeat: -1, ease: 'Linear' });
          this.portalLabel = this.add.text(x, y - 52, '', {
            fontFamily: 'Arial, Helvetica, sans-serif',
            fontSize: '11px',
            fontStyle: 'bold',
            color: '#ff3366',
            backgroundColor: '#0a0f1d',
            padding: { x: 6, y: 3 }
          }).setOrigin(0.5).setDepth(15).setStroke('#1e293b', 2);
          this.updatePortalLabel();
        } else if (char === '@') {
          this.createPlayer(x, y);
        }
      }
    }
  }

  private createTilePlatform(x: number, y: number, key: string) {
    const shadow = this.add.sprite(x + 10, y + 14, key);
    shadow.setTint(0x000000).setAlpha(0.2).setDepth(2);
    const platform = this.platformsGroup.create(x, y, key);
    platform.setDepth(4);
  }

  private createPlayer(x: number, y: number) {
    this.player = this.add.container(x, y);
    this.player.setDepth(12);
    this.playerBodySprite = this.add.sprite(0, 0, 'hero_body');
    this.playerBodySprite.setOrigin(0.5, 0.5);
    this.player.add(this.playerBodySprite);
    this.playerFaceSprite = this.add.sprite(0, 0, 'hero_face');
    this.playerFaceSprite.setOrigin(0.5, 0.5);
    this.player.add(this.playerFaceSprite);
    this.physics.add.existing(this.player);
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setSize(24, 42).setOffset(-12, -21);
    body.setCollideWorldBounds(true);
  }

  private createUIHeader() {
    const W = this.cameras.main.width;

    const headerBg = this.add.graphics().setDepth(20).setScrollFactor(0);
    headerBg.fillStyle(0x0d0030, 0.75);
    headerBg.fillRoundedRect(12, 8, W - 24, 50, 10);
    headerBg.lineStyle(1.5, 0x7e3fc7, 0.5);
    headerBg.strokeRoundedRect(12, 8, W - 24, 50, 10);

    const ts = { fontFamily: '"Space Grotesk", Arial, sans-serif', fontSize: '18px', fontStyle: 'bold', color: '#ffffff' };

    this.add.text(36, 22, `LVL ${this.currentLevel}`, ts).setDepth(21).setScrollFactor(0);
    this.collectedText = this.add.text(W / 2, 22, `🍓 ${this.collectedCount}/${this.totalCollectibles}`, ts).setOrigin(0.5, 0).setDepth(21).setScrollFactor(0);
    this.livesText = this.add.text(W - 90, 22, `❤️ ×${this.lives}`, { ...ts, color: '#ff6688' }).setOrigin(1, 0).setDepth(21).setScrollFactor(0);

    // Fullscreen button
    const fsBtn = this.add.sprite(W - 44, 33, 'fullscreen_icon').setOrigin(0.5).setDepth(22).setScrollFactor(0);
    fsBtn.setInteractive({ useHandCursor: true });
    fsBtn.on('pointerdown', () => {
      if (this.scale.isFullscreen) {
        this.scale.stopFullscreen();
        try { (window.screen.orientation as any).unlock?.(); } catch {}
      } else {
        this.scale.startFullscreen();
        try { (window.screen.orientation as any).lock?.('landscape').catch(() => {}); } catch {}
      }
    });
    fsBtn.on('pointerover', () => fsBtn.setScale(1.15));
    fsBtn.on('pointerout', () => fsBtn.setScale(1.0));
  }

  update(time: number) {
    if (this.isPlayerDead) return;

    const body = this.player.body as Phaser.Physics.Arcade.Body;

    // Coyote time
    if (body.blocked.down) {
      this.coyoteTimeCounter = time + this.coyoteTimeDuration;
    }

    // Landing squash
    const grounded = body.blocked.down;
    if (grounded && !this.wasGroundedLastFrame && body.velocity.y >= 0) {
      this.tweens.add({
        targets: [this.playerBodySprite, this.playerFaceSprite],
        scaleX: 1.35, scaleY: 0.65, duration: 120, yoyo: true, ease: 'Cubic.Out'
      });
    }
    this.wasGroundedLastFrame = grounded;

    // Input
    const moveLeft = (this.cursors && (this.cursors.left.isDown || this.wasdKeys.A.isDown)) || this.isTouchingLeft;
    const moveRight = (this.cursors && (this.cursors.right.isDown || this.wasdKeys.D.isDown)) || this.isTouchingRight;
    const jumpPressed = (this.cursors && (
      Phaser.Input.Keyboard.JustDown(this.cursors.space) ||
      Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
      Phaser.Input.Keyboard.JustDown(this.wasdKeys.W)
    )) || this.touchJumpTriggered;
    this.touchJumpTriggered = false;

    if (this.wallJumpLockTimer > time) return;

    // Movement
    if (moveLeft) {
      body.setAccelerationX(-1200);
      if (body.velocity.x > 0) body.setVelocityX(body.velocity.x * 0.9);
      body.setMaxVelocity(320, 1000);
      this.playerFaceSprite.x = -3; this.playerFaceSprite.y = 0;
      this.playerBodySprite.setAngle(-6); this.playerFaceSprite.setAngle(-6);
    } else if (moveRight) {
      body.setAccelerationX(1200);
      if (body.velocity.x < 0) body.setVelocityX(body.velocity.x * 0.9);
      body.setMaxVelocity(320, 1000);
      this.playerFaceSprite.x = 3; this.playerFaceSprite.y = 0;
      this.playerBodySprite.setAngle(6); this.playerFaceSprite.setAngle(6);
    } else {
      body.setAccelerationX(0);
      body.setVelocityX(body.velocity.x * 0.82);
      this.playerFaceSprite.x = 0; this.playerFaceSprite.y = 0;
      this.playerBodySprite.setAngle(0); this.playerFaceSprite.setAngle(0);
    }

    // Eye look
    if (body.velocity.y < -50) this.playerFaceSprite.y = -3;
    else if (body.velocity.y > 50) this.playerFaceSprite.y = 3;

    // Jump
    if (jumpPressed) {
      if (body.blocked.down || time <= this.coyoteTimeCounter) {
        body.setVelocityY(-560);
        this.coyoteTimeCounter = 0;
        this.tweens.add({
          targets: [this.playerBodySprite, this.playerFaceSprite],
          scaleX: 0.7, scaleY: 1.35, duration: 100, yoyo: true, ease: 'Cubic.Out'
        });
      } else {
        if (body.blocked.left) {
          body.setVelocityY(-480); body.setVelocityX(340);
          this.wallJumpLockTimer = time + 160;
          this.tweens.add({ targets: [this.playerBodySprite, this.playerFaceSprite], scaleX: 0.7, scaleY: 1.35, duration: 100, yoyo: true, ease: 'Cubic.Out' });
        } else if (body.blocked.right) {
          body.setVelocityY(-480); body.setVelocityX(-340);
          this.wallJumpLockTimer = time + 160;
          this.tweens.add({ targets: [this.playerBodySprite, this.playerFaceSprite], scaleX: 0.7, scaleY: 1.35, duration: 100, yoyo: true, ease: 'Cubic.Out' });
        }
      }
    }

    // Bottom death
    if (this.player.y > this.cameras.main.scrollY + this.cameras.main.height + 32) {
      this.handleDeath();
    }
  }

  private onPlayerHitSpike() { this.handleDeath(); }

  private onPlayerCollectBerry(_playerObj: any, berryObj: any) {
    const berry = berryObj as Phaser.Physics.Arcade.Sprite;
    if (!berry.active) return;
    berry.disableBody(true, true);
    this.berryParticles.emitParticleAt(berry.x, berry.y, 15);
    this.collectedCount++;
    this.collectedText.setText(`🍓 ${this.collectedCount}/${this.totalCollectibles}`);
    const dot = this.add.graphics();
    dot.fillStyle(0x00ffff, 1); dot.fillCircle(0, 0, 6);
    dot.lineStyle(2, 0xffffff, 0.8); dot.strokeCircle(0, 0, 6);
    dot.x = berry.x; dot.y = berry.y; dot.setDepth(15);
    this.tweens.add({
      targets: dot, x: this.portal.x, y: this.portal.y, duration: 650, ease: 'Quad.In',
      onComplete: () => {
        dot.destroy();
        this.berryParticles.emitParticleAt(this.portal.x, this.portal.y, 8);
        this.tweens.add({ targets: this.portal, scaleX: 1.4, scaleY: 1.4, duration: 100, yoyo: true, ease: 'Cubic.Out' });
        if (this.collectedCount >= this.totalCollectibles) this.activatePortal();
        this.updatePortalLabel();
      }
    });
    this.tweens.add({ targets: this.collectedText, scaleX: 1.2, scaleY: 1.2, duration: 100, yoyo: true, ease: 'Cubic.Out' });
  }

  private activatePortal() {
    this.portalActive = true;
    this.tweens.add({ targets: this.portal, alpha: 1.0, scaleX: 1.2, scaleY: 1.2, duration: 500, yoyo: true, repeat: 1, ease: 'Back.Out' });
    this.tweens.add({ targets: this.portal, angle: 360, duration: 1000, repeat: -1, ease: 'Linear' });
  }

  private onPlayerReachPortal() {
    if (this.isPlayerDead) return;
    this.isPlayerDead = true;
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setEnable(false);
    this.cameras.main.flash(400, 0, 255, 255);

    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    const panel = this.add.graphics().setDepth(50).setScrollFactor(0);
    panel.fillStyle(0x0d0025, 0.7);
    panel.fillRect(0, 0, W, H);

    const clearText = this.add.text(W / 2, H / 2, 'STAGE CLEAR! 🎉', {
      fontFamily: '"Space Grotesk", "Arial Black", sans-serif',
      fontSize: '60px', fontStyle: 'bold', color: '#00ffff',
      stroke: '#003366', strokeThickness: 6,
    }).setOrigin(0.5).setDepth(51).setScrollFactor(0).setScale(0);

    this.tweens.add({ targets: clearText, scaleX: 1, scaleY: 1, duration: 500, ease: 'Back.Out' });
    this.tweens.add({
      targets: this.player,
      x: this.portal.x, y: this.portal.y,
      scaleX: 0, scaleY: 0, angle: 720, duration: 800, ease: 'Cubic.In',
      onComplete: () => { panel.destroy(); clearText.destroy(); this.advanceLevel(); }
    });
  }

  private advanceLevel() {
    if (this.currentLevel < this.LEVEL_MAPS.length) {
      this.scene.restart({ level: this.currentLevel + 1, lives: this.lives });
    } else {
      const W = this.cameras.main.width; const H = this.cameras.main.height;
      const p = this.add.graphics().setDepth(100).setScrollFactor(0);
      p.fillStyle(0x0d0025, 0.92); p.fillRect(0, 0, W, H);
      this.add.text(W/2, H/2-60, '🏆 YOU WIN! 🏆', {
        fontFamily: '"Space Grotesk", "Arial Black", sans-serif',
        fontSize: '60px', fontStyle: 'bold', color: '#ffd700',
        stroke: '#5b3a00', strokeThickness: 6,
      }).setOrigin(0.5).setDepth(101).setScrollFactor(0);
      this.add.text(W/2, H/2+20, 'All 5 Levels Completed!', {
        fontFamily: '"Space Grotesk", Arial, sans-serif',
        fontSize: '22px', color: '#c0a0ff',
      }).setOrigin(0.5).setDepth(101).setScrollFactor(0);
      this.time.delayedCall(3000, () => this.scene.start('MenuScene'));
    }
  }

  private handleDeath() {
    if (this.isPlayerDead) return;
    this.isPlayerDead = true;
    this.cameras.main.flash(150, 255, 0, 85);
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setEnable(false);
    this.lives--;
    this.livesText.setText(`❤️ ×${this.lives}`);
    this.tweens.add({ targets: this.livesText, scaleX: 1.3, scaleY: 1.3, duration: 100, yoyo: true, ease: 'Cubic.Out' });
    this.time.delayedCall(250, () => {
      if (this.lives > 0) {
        this.scene.restart({ level: this.currentLevel, lives: this.lives });
      } else {
        const W = this.cameras.main.width; const H = this.cameras.main.height;
        const p = this.add.graphics().setDepth(100).setScrollFactor(0);
        p.fillStyle(0x0d0025, 0.9); p.fillRect(0, 0, W, H);
        this.add.text(W/2, H/2, 'GAME OVER', {
          fontFamily: '"Space Grotesk", "Arial Black", sans-serif',
          fontSize: '64px', fontStyle: 'bold', color: '#ff2277',
          stroke: '#4a0020', strokeThickness: 6,
        }).setOrigin(0.5).setDepth(101).setScrollFactor(0);
        this.time.delayedCall(2200, () => this.scene.start('MenuScene'));
      }
    });
  }

  private updatePortalLabel() {
    if (!this.portalLabel) return;
    const rem = this.totalCollectibles - this.collectedCount;
    if (rem > 0) {
      this.portalLabel.setText(`🔒 ${rem} left`).setColor('#ff3366');
    } else {
      this.portalLabel.setText('🔓 OPEN!').setColor('#00ffff');
      this.tweens.add({ targets: this.portalLabel, scaleX: 1.2, scaleY: 1.2, duration: 200, yoyo: true, ease: 'Bounce.Out' });
    }
  }

  private createTutorialHints() {
    if (this.currentLevel === 1) {
      const ts = { fontFamily: 'Arial', fontSize: '13px', fontStyle: 'bold', color: '#c0b0ff' };
      this.add.text(100, 480, '← / → Move\nSPACE Jump', ts).setDepth(3).setAlpha(0.75);
      this.add.text(450, 340, 'Collect 🍓 Berries\nto open Portal!', ts).setOrigin(0.5).setDepth(3).setAlpha(0.75).setAlign('center');
    }
    if (this.currentLevel === 2) {
      const ts = { fontFamily: 'Arial', fontSize: '13px', fontStyle: 'bold', color: '#c0b0ff' };
      this.add.text(130, 560, 'Jump against\nwalls to bounce!', ts).setOrigin(0.5).setDepth(3).setAlpha(0.75).setAlign('center');
    }
  }

  private createMobileControls() {
    const H = this.cameras.main.height;
    const W = this.cameras.main.width;
    const r = 40;

    const makeBtn = (x: number, y: number, label: string, col = 0x1e293b, border = 0xffffff) => {
      const btn = this.add.container(x, y).setDepth(25).setScrollFactor(0);
      const bg = this.add.graphics();
      bg.fillStyle(col, 0.55); bg.fillCircle(0, 0, r);
      bg.lineStyle(3, border, 0.75); bg.strokeCircle(0, 0, r);
      const txt = this.add.text(0, 0, label, { fontFamily: 'Arial', fontSize: '32px', fontStyle: 'bold', color: '#ffffff' }).setOrigin(0.5);
      btn.add([bg, txt]);
      btn.setInteractive(new Phaser.Geom.Circle(0, 0, r), Phaser.Geom.Circle.Contains);
      return btn;
    };

    this.leftButton = makeBtn(80, H - 90, '◀');
    this.rightButton = makeBtn(200, H - 90, '▶');
    this.jumpButton = makeBtn(W - 90, H - 90, '▲', 0x7e3fc7, 0xffaa00);
    this.jumpButton.setScale(1.15);

    this.leftButton.on('pointerdown', () => { this.isTouchingLeft = true; this.leftButton.setScale(0.9); });
    this.leftButton.on('pointerup', () => { this.isTouchingLeft = false; this.leftButton.setScale(1.0); });
    this.leftButton.on('pointerout', () => { this.isTouchingLeft = false; this.leftButton.setScale(1.0); });
    this.rightButton.on('pointerdown', () => { this.isTouchingRight = true; this.rightButton.setScale(0.9); });
    this.rightButton.on('pointerup', () => { this.isTouchingRight = false; this.rightButton.setScale(1.0); });
    this.rightButton.on('pointerout', () => { this.isTouchingRight = false; this.rightButton.setScale(1.0); });
    this.jumpButton.on('pointerdown', () => { this.touchJumpTriggered = true; this.jumpButton.setScale(1.05); });
    this.jumpButton.on('pointerup', () => { this.jumpButton.setScale(1.15); });
    this.jumpButton.on('pointerout', () => { this.jumpButton.setScale(1.15); });
  }
}
