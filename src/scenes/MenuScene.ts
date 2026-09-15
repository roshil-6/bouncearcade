import Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
  private bgTimer = 0;
  private stars: { x: number; y: number; r: number; alpha: number; speed: number }[] = [];
  private shootingStars: { x: number; y: number; vx: number; vy: number; life: number; maxLife: number }[] = [];
  private islandBob = 0;
  private overlayContainer!: Phaser.GameObjects.Container;
  private bgGraphics!: Phaser.GameObjects.Graphics;
  private dynamicGraphics!: Phaser.GameObjects.Graphics;

  constructor() {
    super('MenuScene');
  }

  create() {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    // --- STATIC BACKGROUND ---
    this.bgGraphics = this.add.graphics().setDepth(0);
    this.drawStaticBackground(W, H);

    // --- DYNAMIC ELEMENTS (redrawn each frame) ---
    this.dynamicGraphics = this.add.graphics().setDepth(1);

    // Pre-generate stars
    this.stars = [];
    for (let i = 0; i < 60; i++) {
      this.stars.push({
        x: Math.random() * W,
        y: Math.random() * H * 0.65,
        r: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.5 + 0.2,
        speed: Math.random() * 0.01 + 0.005,
      });
    }

    // --- TITLE ---
    this.drawTitle(W, H);

    // --- HERO ON PEDESTAL ---
    this.drawHeroSection(W, H);

    // --- BUTTONS ---
    this.drawButtons(W, H);

    // --- FULLSCREEN BUTTON ---
    const fsBtn = this.add.sprite(W - 40, 40, 'fullscreen_icon');
    fsBtn.setDepth(50).setInteractive({ useHandCursor: true });
    fsBtn.on('pointerdown', () => {
      if (this.scale.isFullscreen) {
        this.scale.stopFullscreen();
        try { (window.screen.orientation as any).unlock?.(); } catch {}
      } else {
        this.scale.startFullscreen();
        try { (window.screen.orientation as any).lock?.('landscape').catch(() => {}); } catch {}
      }
    });
    fsBtn.on('pointerover', () => fsBtn.setScale(1.2));
    fsBtn.on('pointerout', () => fsBtn.setScale(1.0));

    // --- HOWTOPLAY / SETTINGS OVERLAY ---
    this.createOverlay(W, H);
  }

  private drawStaticBackground(W: number, H: number) {
    const g = this.bgGraphics;

    // Sky gradient (purple twilight → blue → orange horizon)
    g.fillGradientStyle(0x0d0025, 0x0d0025, 0x1a0a4e, 0x1a0a4e, 1);
    g.fillRect(0, 0, W, H * 0.35);
    g.fillGradientStyle(0x1a0a4e, 0x1a0a4e, 0x2d1b69, 0x2d1b69, 1);
    g.fillRect(0, H * 0.25, W, H * 0.35);
    g.fillGradientStyle(0x2d1b69, 0x2d1b69, 0x5e2a9f, 0x5e2a9f, 1);
    g.fillRect(0, H * 0.5, W, H * 0.2);
    // Warm sunset horizon
    g.fillGradientStyle(0x5e2a9f, 0x5e2a9f, 0x311b92, 0x311b92, 1);
    g.fillRect(0, H * 0.65, W, H * 0.35);

    // Giant glowing moon
    const moonX = W * 0.5;
    const moonY = H * 0.22;
    const moonR = 95;
    // Outer glow rings
    for (let i = 5; i >= 1; i--) {
      g.fillStyle(0xd0e8ff, 0.04 * i);
      g.fillCircle(moonX, moonY, moonR + i * 18);
    }
    // Moon body
    g.fillStyle(0xdce8ff, 0.18);
    g.fillCircle(moonX, moonY, moonR);
    g.fillStyle(0xe8f0ff, 0.35);
    g.fillCircle(moonX, moonY, moonR * 0.78);
    g.fillStyle(0xf0f6ff, 0.55);
    g.fillCircle(moonX, moonY, moonR * 0.55);
    g.fillStyle(0xfcfeff, 0.8);
    g.fillCircle(moonX, moonY, moonR * 0.32);

    // Mountain silhouettes — distant back layer
    g.fillStyle(0x1a1040, 1);
    this.drawMountains(g, W, H * 0.68, W, H, [
      [0, 0], [0.08, -0.1], [0.15, -0.2], [0.22, -0.08], [0.3, -0.25], [0.38, -0.12],
      [0.45, -0.3], [0.52, -0.15], [0.6, -0.28], [0.67, -0.1], [0.75, -0.22],
      [0.82, -0.08], [0.9, -0.18], [1.0, 0], [1.0, 0.5]
    ]);

    // Mountain silhouettes — closer mid layer
    g.fillStyle(0x241455, 1);
    this.drawMountains(g, W, H * 0.72, W, H, [
      [0, 0], [0.05, -0.08], [0.12, -0.16], [0.2, -0.06], [0.28, -0.18], [0.36, -0.09],
      [0.44, -0.22], [0.52, -0.12], [0.6, -0.2], [0.68, -0.07], [0.76, -0.15],
      [0.84, -0.1], [0.92, -0.13], [1.0, 0], [1.0, 0.5]
    ]);

    // Bottom fog/clouds
    g.fillStyle(0x3d1f7a, 0.65);
    g.fillRect(0, H * 0.78, W, H * 0.22);

    // Foreground dark silhouette bushes
    g.fillStyle(0x150a35, 1);
    this.drawBushSilhouettes(g, W, H);

    // --- FLOATING ISLANDS (static parts — grass and stone) ---
    // Island 1 — left
    this.drawIsland(g, W * 0.12, H * 0.42, 90, 30);
    // Island 2 — upper left  
    this.drawIsland(g, W * 0.22, H * 0.28, 70, 22);
    // Island 3 — right
    this.drawIsland(g, W * 0.84, H * 0.38, 80, 26);
    // Island 4 — upper right
    this.drawIsland(g, W * 0.76, H * 0.22, 65, 20);

    // Berries on islands (decorative)
    this.drawDecorBerry(g, W * 0.1, H * 0.38);
    this.drawDecorBerry(g, W * 0.85, H * 0.34);
    this.drawDecorBerry(g, W * 0.79, H * 0.15);
    this.drawDecorBerry(g, W * 0.05, H * 0.72);
    this.drawDecorBerry(g, W * 0.94, H * 0.7);
  }

  private drawMountains(g: Phaser.GameObjects.Graphics, _W: number, baseY: number, totalW: number, totalH: number, points: number[][]) {
    g.beginPath();
    points.forEach(([rx, ry], i) => {
      const x = rx * totalW;
      const y = baseY + ry * totalH * 0.35;
      if (i === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    });
    g.lineTo(totalW, totalH);
    g.lineTo(0, totalH);
    g.closePath();
    g.fill();
  }

  private drawBushSilhouettes(g: Phaser.GameObjects.Graphics, W: number, H: number) {
    // Left side bushes
    for (let i = 0; i < 4; i++) {
      const x = W * (0.03 + i * 0.025);
      const y = H - 20;
      g.fillCircle(x, y, 25 + i * 8);
    }
    // Right side bushes
    for (let i = 0; i < 4; i++) {
      const x = W * (0.97 - i * 0.025);
      const y = H - 20;
      g.fillCircle(x, y, 22 + i * 9);
    }
  }

  private drawIsland(g: Phaser.GameObjects.Graphics, cx: number, cy: number, w: number, h: number) {
    // Stone body
    g.fillStyle(0x4a3570, 1);
    g.fillEllipse(cx, cy + h * 0.3, w, h);
    g.fillStyle(0x5a4580, 1);
    g.fillEllipse(cx, cy + h * 0.1, w * 0.9, h * 0.7);

    // Grass cap
    g.fillStyle(0x3d8a3d, 1);  // used below
    g.fillEllipse(cx, cy - h * 0.08, w * 0.92, h * 0.45);
    g.fillStyle(0x50b050, 1);
    g.fillEllipse(cx, cy - h * 0.12, w * 0.78, h * 0.3);

    // Hanging roots/vines
    g.lineStyle(2, 0x2d6b2d, 0.7);
    for (let i = 0; i < 3; i++) {
      const rx = cx - w * 0.2 + i * w * 0.2;
      g.beginPath();
      g.moveTo(rx, cy + h * 0.35);
      g.lineTo(rx - 3, cy + h * 0.6);
      g.strokePath();
    }
  }

  private drawDecorBerry(g: Phaser.GameObjects.Graphics, x: number, y: number) {
    g.fillStyle(0x58d626, 1);
    g.fillRect(x, y - 8, 2, 5);
    g.fillStyle(0xff3388, 1);
    g.fillCircle(x - 3, y, 5);
    g.fillCircle(x + 3, y, 5);
    g.fillCircle(x, y - 4, 5.5);
    g.fillStyle(0xffffff, 0.5);
    g.fillCircle(x - 1, y - 5, 1.5);
  }

  private drawTitle(W: number, H: number) {
    // "BOUNCE" — white with lavender fill
    const bounce = this.add.text(W / 2, H * 0.12, 'BOUNCE', {
      fontFamily: '"Space Grotesk", "Arial Black", Impact, sans-serif',
      fontSize: '96px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#4a0080',
      strokeThickness: 8,
    }).setOrigin(0.5).setDepth(20);

    // Inner gradient fill via canvas manipulation
    const bounceGrad = bounce.context.createLinearGradient(0, 0, 0, bounce.height);
    bounceGrad.addColorStop(0, '#ffffff');
    bounceGrad.addColorStop(0.4, '#ede0ff');
    bounceGrad.addColorStop(1, '#c084fc');
    bounce.setFill(bounceGrad);

    // Drop shadow effect via additional text
    this.add.text(W / 2 + 3, H * 0.12 + 6, 'BOUNCE', {
      fontFamily: '"Space Grotesk", "Arial Black", Impact, sans-serif',
      fontSize: '96px',
      fontStyle: 'bold',
      color: '#2d0050',
    }).setOrigin(0.5).setDepth(19).setAlpha(0.5);

    // "BOUND" — hot pink
    const bound = this.add.text(W / 2, H * 0.12 + 95, 'BOUND', {
      fontFamily: '"Space Grotesk", "Arial Black", Impact, sans-serif',
      fontSize: '96px',
      fontStyle: 'bold',
      color: '#ff2d78',
      stroke: '#6b0030',
      strokeThickness: 8,
    }).setOrigin(0.5).setDepth(20);

    const boundGrad = bound.context.createLinearGradient(0, 0, 0, bound.height);
    boundGrad.addColorStop(0, '#ff6baa');
    boundGrad.addColorStop(0.5, '#ff2d78');
    boundGrad.addColorStop(1, '#c0003a');
    bound.setFill(boundGrad);

    this.add.text(W / 2 + 3, H * 0.12 + 95 + 6, 'BOUND', {
      fontFamily: '"Space Grotesk", "Arial Black", Impact, sans-serif',
      fontSize: '96px',
      fontStyle: 'bold',
      color: '#3a0020',
    }).setOrigin(0.5).setDepth(19).setAlpha(0.5);

    // Decorative tilde accents on the "O" in BOUND
    this.add.text(W / 2 - 30, H * 0.12 + 80, '˜', {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#ffffff',
    }).setOrigin(0.5).setDepth(21).setAlpha(0.7);
    this.add.text(W / 2 + 30, H * 0.12 + 80, '˜', {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#ffffff',
    }).setOrigin(0.5).setDepth(21).setAlpha(0.7);
  }

  private drawHeroSection(W: number, H: number) {
    const pedestalX = W * 0.5;
    const pedestalY = H * 0.67;

    // Grassy pedestal (drawn each frame in update via dynamic graphics, but base drawn once here too)
    const g = this.add.graphics().setDepth(8);
    // Stone base
    g.fillStyle(0x4a3570, 1);
    g.fillEllipse(pedestalX, pedestalY + 28, 130, 55);
    g.fillStyle(0x5a4580, 1);
    g.fillEllipse(pedestalX, pedestalY + 18, 120, 48);
    // Grass top
    g.fillStyle(0x3d8a3d, 1);
    g.fillEllipse(pedestalX, pedestalY - 2, 118, 38);
    g.fillStyle(0x50b050, 1);
    g.fillEllipse(pedestalX, pedestalY - 6, 100, 28);
    // Grass edge tufts
    for (let i = -40; i <= 40; i += 10) {
      g.fillStyle(0x58c028, 1);
      g.fillTriangle(
        pedestalX + i, pedestalY - 10,
        pedestalX + i - 5, pedestalY + 2,
        pedestalX + i + 5, pedestalY + 2
      );
    }

    // Hero container on top of pedestal
    const heroContainer = this.add.container(pedestalX, pedestalY - 40).setDepth(10);
    const body = this.add.sprite(0, 0, 'hero_body').setScale(1.5);
    const face = this.add.sprite(0, 0, 'hero_face').setScale(1.5);
    heroContainer.add([body, face]);

    // Gentle bounce animation
    this.tweens.add({
      targets: heroContainer,
      y: pedestalY - 50,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });

    // Idle squish
    this.tweens.add({
      targets: [body, face],
      scaleX: 1.55,
      scaleY: 1.45,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });
  }

  private drawButtons(W: number, H: number) {
    const centerX = W * 0.5;

    // --- BIG PLAY BUTTON ---
    const playY = H * 0.74;
    const playBtn = this.add.container(centerX, playY).setDepth(15);

    const playBg = this.add.graphics();
    // Glow shadow
    playBg.fillStyle(0xff1060, 0.3);
    playBg.fillRoundedRect(-115, -28, 230, 56, 28);
    // Main fill
    playBg.fillStyle(0xff2d78, 1);
    playBg.fillRoundedRect(-110, -24, 220, 48, 24);
    // Highlight top
    playBg.fillStyle(0xff6aa5, 0.5);
    playBg.fillRoundedRect(-108, -22, 216, 16, 12);
    // Border
    playBg.lineStyle(2.5, 0xff8cc0, 0.9);
    playBg.strokeRoundedRect(-110, -24, 220, 48, 24);

    const playIcon = this.add.text(-70, 0, '▶', {
      fontFamily: 'Arial',
      fontSize: '22px',
      color: '#ffffff',
    }).setOrigin(0.5);

    const playText = this.add.text(15, 0, 'PLAY', {
      fontFamily: '"Space Grotesk", "Arial Black", sans-serif',
      fontSize: '26px',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5);

    playBtn.add([playBg, playIcon, playText]);
    playBtn.setInteractive(new Phaser.Geom.Rectangle(-110, -24, 220, 48), Phaser.Geom.Rectangle.Contains);

    playBtn.on('pointerover', () => {
      this.tweens.add({ targets: playBtn, scaleX: 1.05, scaleY: 1.05, duration: 100, ease: 'Cubic.Out' });
    });
    playBtn.on('pointerout', () => {
      this.tweens.add({ targets: playBtn, scaleX: 1.0, scaleY: 1.0, duration: 100, ease: 'Cubic.Out' });
    });
    playBtn.on('pointerdown', () => {
      this.tweens.add({
        targets: playBtn, scaleX: 0.96, scaleY: 0.96, duration: 80, yoyo: true, ease: 'Cubic.In',
        onComplete: () => this.scene.start('LevelSelectScene'),
      });
    });

    // Pulse glow animation on play button
    this.tweens.add({
      targets: playBg,
      alpha: 0.85,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });

    // --- SMALL BUTTONS ROW ---
    const smallY = H * 0.84;
    const smallBtns = [
      { label: 'LEVELS', icon: '▦', action: () => this.scene.start('LevelSelectScene') },
      { label: 'HOW TO PLAY', icon: '?', action: () => this.showOverlay('howtoplay') },
      { label: 'SETTINGS', icon: '⚙', action: () => this.showOverlay('settings') },
    ];

    const totalSmallWidth = smallBtns.length * 190 - 10;
    const smallStartX = centerX - totalSmallWidth / 2 + 90;

    smallBtns.forEach((btn, i) => {
      const bx = smallStartX + i * 190;
      const bContainer = this.add.container(bx, smallY).setDepth(15);

      const bBg = this.add.graphics();
      bBg.fillStyle(0x1a3a7a, 0.85);
      bBg.fillRoundedRect(-83, -18, 166, 36, 18);
      bBg.lineStyle(1.5, 0x4a80cc, 0.9);
      bBg.strokeRoundedRect(-83, -18, 166, 36, 18);

      const bIcon = this.add.text(-45, 0, btn.icon, {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: '#7fb3ff',
      }).setOrigin(0.5);

      const bText = this.add.text(15, 0, btn.label, {
        fontFamily: '"Space Grotesk", Arial, sans-serif',
        fontSize: '14px',
        fontStyle: 'bold',
        color: '#cce0ff',
      }).setOrigin(0.5);

      bContainer.add([bBg, bIcon, bText]);
      bContainer.setInteractive(new Phaser.Geom.Rectangle(-83, -18, 166, 36), Phaser.Geom.Rectangle.Contains);

      bContainer.on('pointerover', () => {
        this.tweens.add({ targets: bContainer, scaleX: 1.06, scaleY: 1.06, duration: 100, ease: 'Cubic.Out' });
        bBg.clear();
        bBg.fillStyle(0x2a50a0, 0.95);
        bBg.fillRoundedRect(-83, -18, 166, 36, 18);
        bBg.lineStyle(1.5, 0x7ab0ff, 1);
        bBg.strokeRoundedRect(-83, -18, 166, 36, 18);
      });
      bContainer.on('pointerout', () => {
        this.tweens.add({ targets: bContainer, scaleX: 1.0, scaleY: 1.0, duration: 100, ease: 'Cubic.Out' });
        bBg.clear();
        bBg.fillStyle(0x1a3a7a, 0.85);
        bBg.fillRoundedRect(-83, -18, 166, 36, 18);
        bBg.lineStyle(1.5, 0x4a80cc, 0.9);
        bBg.strokeRoundedRect(-83, -18, 166, 36, 18);
      });
      bContainer.on('pointerdown', () => {
        this.tweens.add({
          targets: bContainer, scaleX: 0.96, scaleY: 0.96, duration: 80, yoyo: true, ease: 'Cubic.In',
          onComplete: btn.action,
        });
      });
    });
  }

  private createOverlay(W: number, H: number) {
    this.overlayContainer = this.add.container(W / 2, H / 2).setDepth(100).setVisible(false);

    const dimBg = this.add.graphics();
    dimBg.fillStyle(0x000000, 0.75);
    dimBg.fillRect(-W / 2, -H / 2, W, H);

    const panel = this.add.graphics();
    panel.fillStyle(0x1a0a3e, 0.97);
    panel.fillRoundedRect(-280, -200, 560, 400, 20);
    panel.lineStyle(2, 0x7e3fc7, 1);
    panel.strokeRoundedRect(-280, -200, 560, 400, 20);

    this.overlayContainer.add([dimBg, panel]);

    // Title (updated per showOverlay call)
    const overlayTitle = this.add.text(0, -160, '', {
      fontFamily: '"Space Grotesk", Arial, sans-serif',
      fontSize: '28px',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Content text
    const overlayContent = this.add.text(0, -30, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      color: '#d0c0ff',
      align: 'center',
      wordWrap: { width: 480 },
    }).setOrigin(0.5);

    // Close button
    const closeBtn = this.add.container(0, 160);
    const closeBg = this.add.graphics();
    closeBg.fillStyle(0x7e3fc7, 1);
    closeBg.fillRoundedRect(-60, -18, 120, 36, 10);
    const closeTxt = this.add.text(0, 0, 'CLOSE', {
      fontFamily: '"Space Grotesk", Arial, sans-serif',
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5);
    closeBtn.add([closeBg, closeTxt]);
    closeBtn.setInteractive(new Phaser.Geom.Rectangle(-60, -18, 120, 36), Phaser.Geom.Rectangle.Contains);
    closeBtn.on('pointerdown', () => this.hideOverlay());
    closeBtn.on('pointerover', () => { closeBg.clear(); closeBg.fillStyle(0x904ed9, 1); closeBg.fillRoundedRect(-60, -18, 120, 36, 10); });
    closeBtn.on('pointerout', () => { closeBg.clear(); closeBg.fillStyle(0x7e3fc7, 1); closeBg.fillRoundedRect(-60, -18, 120, 36, 10); });

    this.overlayContainer.add([overlayTitle, overlayContent, closeBtn]);

    // Store refs for later use
    (this.overlayContainer as any).overlayTitle = overlayTitle;
    (this.overlayContainer as any).overlayContent = overlayContent;
  }

  private showOverlay(type: 'howtoplay' | 'settings') {
    const title = (this.overlayContainer as any).overlayTitle as Phaser.GameObjects.Text;
    const content = (this.overlayContainer as any).overlayContent as Phaser.GameObjects.Text;

    if (type === 'howtoplay') {
      title.setText('HOW TO PLAY');
      content.setText(
        '← / A   →  / D\nMove Left / Right\n\n' +
        'SPACE / W / ↑\nJump — press against walls to Wall-Bounce!\n\n' +
        'Collect all 🍓 Berries to unlock the Portal\n\n' +
        'Step into the Portal to complete the level\n\n' +
        'Avoid Spikes — they cost you a Life!'
      );
    } else {
      title.setText('SETTINGS');
      content.setText(
        '🔊 Sound  —  Coming Soon\n\n' +
        '🎵 Music  —  Coming Soon\n\n' +
        '⌨️ Controls\nDesktop: Arrow Keys / WASD + Space\nMobile: On-screen touch buttons\n\n' +
        '↕ Fullscreen\nClick the [ ] icon at the top-right'
      );
    }

    this.overlayContainer.setVisible(true);
    this.overlayContainer.setAlpha(0);
    this.tweens.add({ targets: this.overlayContainer, alpha: 1, duration: 200, ease: 'Cubic.Out' });
  }

  private hideOverlay() {
    this.tweens.add({
      targets: this.overlayContainer, alpha: 0, duration: 180, ease: 'Cubic.In',
      onComplete: () => this.overlayContainer.setVisible(false),
    });
  }

  update() {
    this.bgTimer += 0.016;
    this.islandBob += 0.02;

    const W = this.cameras.main.width;
    const H = this.cameras.main.height;
    const g = this.dynamicGraphics;
    g.clear();

    // --- Twinkling stars ---
    for (const s of this.stars) {
      const twinkle = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(this.bgTimer * s.speed * 80));
      g.fillStyle(0xffffff, s.alpha * twinkle);
      g.fillCircle(s.x, s.y, s.r);
    }

    // --- Occasional shooting star ---
    if (Math.random() < 0.003) {
      this.shootingStars.push({
        x: Math.random() * W * 0.7,
        y: Math.random() * H * 0.3,
        vx: 8 + Math.random() * 5,
        vy: 3 + Math.random() * 2,
        life: 0,
        maxLife: 40,
      });
    }
    for (let i = this.shootingStars.length - 1; i >= 0; i--) {
      const ss = this.shootingStars[i];
      ss.x += ss.vx;
      ss.y += ss.vy;
      ss.life++;
      const progress = ss.life / ss.maxLife;
      g.lineStyle(2, 0xffffff, 1 - progress);
      g.beginPath();
      g.moveTo(ss.x, ss.y);
      g.lineTo(ss.x - ss.vx * 4, ss.y - ss.vy * 4);
      g.strokePath();
      if (ss.life >= ss.maxLife) this.shootingStars.splice(i, 1);
    }

    // --- Animated waterfall lines on islands ---
    const islandDefs = [
      { x: W * 0.12, y: H * 0.42 + Math.sin(this.islandBob) * 4 },
      { x: W * 0.84, y: H * 0.38 + Math.sin(this.islandBob + 1) * 4 },
      { x: W * 0.22, y: H * 0.28 + Math.sin(this.islandBob + 0.5) * 3 },
    ];
    islandDefs.forEach((isl, i) => {
      // Waterfall cascade
      const wOffset = (this.bgTimer * 60 + i * 30) % 80;
      for (let drop = 0; drop < 3; drop++) {
        const dy = (wOffset + drop * 26) % 80;
        const alpha = 0.4 * (1 - dy / 80);
        g.lineStyle(3, 0xaaddff, alpha);
        g.beginPath();
        g.moveTo(isl.x - 30, isl.y + 10 + dy);
        g.lineTo(isl.x - 28, isl.y + 22 + dy);
        g.strokePath();
      }
    });

    // --- Drifting mist clouds ---
    for (let c = 0; c < 4; c++) {
      const cx = ((W * 0.15 * c + this.bgTimer * 12 * (c % 2 === 0 ? 1 : -1)) % (W + 200)) - 100;
      const cy = H * 0.72 + c * 18;
      g.fillStyle(0xffffff, 0.04 + c * 0.015);
      g.fillEllipse(cx, cy, 180 + c * 30, 50 + c * 10);
    }
  }
}
