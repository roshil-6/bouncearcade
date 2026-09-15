import Phaser from 'phaser';

export class LevelSelectScene extends Phaser.Scene {
  private bgTimer = 0;
  private dynamicGraphics!: Phaser.GameObjects.Graphics;
  private stars: { x: number; y: number; r: number; alpha: number; speed: number }[] = [];

  constructor() {
    super('LevelSelectScene');
  }

  create() {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    // --- STATIC BACKGROUND (same style as menu) ---
    const bg = this.add.graphics().setDepth(0);
    // Sky
    bg.fillGradientStyle(0x0d0025, 0x0d0025, 0x1a0a4e, 0x1a0a4e, 1);
    bg.fillRect(0, 0, W, H * 0.4);
    bg.fillGradientStyle(0x1a0a4e, 0x1a0a4e, 0x2d1b69, 0x2d1b69, 1);
    bg.fillRect(0, H * 0.3, W, H * 0.4);
    bg.fillGradientStyle(0x2d1b69, 0x2d1b69, 0x311b92, 0x311b92, 1);
    bg.fillRect(0, H * 0.6, W, H * 0.4);

    // Moon (smaller, offset)
    const moonX = W * 0.82;
    const moonY = H * 0.18;
    for (let i = 4; i >= 1; i--) {
      bg.fillStyle(0xd0e8ff, 0.04 * i);
      bg.fillCircle(moonX, moonY, 55 + i * 14);
    }
    bg.fillStyle(0xdce8ff, 0.2);
    bg.fillCircle(moonX, moonY, 55);
    bg.fillStyle(0xf0f6ff, 0.55);
    bg.fillCircle(moonX, moonY, 35);
    bg.fillStyle(0xfcfeff, 0.8);
    bg.fillCircle(moonX, moonY, 18);

    // Mountains
    bg.fillStyle(0x1a1040, 1);
    bg.beginPath();
    const mpts = [[0,0],[0.12,-0.12],[0.22,-0.08],[0.35,-0.22],[0.48,-0.1],[0.62,-0.2],[0.75,-0.08],[0.88,-0.16],[1,0]];
    mpts.forEach(([rx,ry],i) => {
      if (i===0) bg.moveTo(rx*W, H*0.68+ry*H*0.35);
      else bg.lineTo(rx*W, H*0.68+ry*H*0.35);
    });
    bg.lineTo(W, H); bg.lineTo(0, H); bg.closePath(); bg.fill();

    // Bottom mist
    bg.fillStyle(0x3d1f7a, 0.5);
    bg.fillRect(0, H * 0.8, W, H * 0.2);

    // Star field
    this.dynamicGraphics = this.add.graphics().setDepth(1);
    for (let i = 0; i < 50; i++) {
      this.stars.push({
        x: Math.random() * W,
        y: Math.random() * H * 0.65,
        r: Math.random() * 1.8 + 0.4,
        alpha: Math.random() * 0.4 + 0.15,
        speed: Math.random() * 0.01 + 0.004,
      });
    }

    // --- TITLE ---
    this.add.text(W / 2 + 2, 48 + 3, 'SELECT LEVEL', {
      fontFamily: '"Space Grotesk", "Arial Black", sans-serif',
      fontSize: '44px',
      fontStyle: 'bold',
      color: '#2d0050',
    }).setOrigin(0.5).setDepth(9).setAlpha(0.5);

    const title = this.add.text(W / 2, 48, 'SELECT LEVEL', {
      fontFamily: '"Space Grotesk", "Arial Black", sans-serif',
      fontSize: '44px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#4a0080',
      strokeThickness: 5,
    }).setOrigin(0.5).setDepth(10);

    const titleGrad = title.context.createLinearGradient(0, 0, 0, title.height);
    titleGrad.addColorStop(0, '#ffffff');
    titleGrad.addColorStop(1, '#c084fc');
    title.setFill(titleGrad);

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

    // --- LEVEL CARDS — 5 levels in a grid ---
    // Row 1: levels 1, 2, 3  |  Row 2 (centered): levels 4, 5
    const levelDefs = [
      { num: 1, label: 'Grassy Start',   stars: 3 },
      { num: 2, label: 'Wall Jumper',    stars: 3 },
      { num: 3, label: 'Stone Maze',     stars: 3 },
      { num: 4, label: 'Sky Rush',       stars: 0 },
      { num: 5, label: 'Final Gauntlet', stars: 0 },
    ];

    const cardW = 160;
    const cardH = 180;
    const gapX = 20;
    const row1Y = H * 0.44;
    const row2Y = H * 0.73;

    const row1 = levelDefs.slice(0, 3);
    const row2 = levelDefs.slice(3, 5);

    const drawRow = (levels: typeof levelDefs, centerY: number, totalInRow: number) => {
      const rowTotalW = totalInRow * cardW + (totalInRow - 1) * gapX;
      const rowStartX = W / 2 - rowTotalW / 2 + cardW / 2;

      levels.forEach((lvl, i) => {
        const cx = rowStartX + i * (cardW + gapX);
        const cy = centerY;

        const card = this.add.container(cx, cy).setDepth(15);

        // Island base (grass platform card)
        const cardGfx = this.add.graphics();

        // Stone body of island
        cardGfx.fillStyle(0x3d2d66, 1);
        cardGfx.fillRoundedRect(-cardW/2, -cardH/2 + 20, cardW, cardH, 14);
        cardGfx.fillStyle(0x4e3a7a, 1);
        cardGfx.fillRoundedRect(-cardW/2, -cardH/2 + 10, cardW, cardH - 10, 14);

        // Grass top strip
        cardGfx.fillStyle(0x3d8a3d, 1);
        cardGfx.fillRoundedRect(-cardW/2, -cardH/2, cardW, 28, { tl: 14, tr: 14, bl: 0, br: 0 });
        cardGfx.fillStyle(0x50b050, 1);
        cardGfx.fillRoundedRect(-cardW/2 + 4, -cardH/2, cardW - 8, 18, { tl: 12, tr: 12, bl: 0, br: 0 });

        // Border glow
        cardGfx.lineStyle(2, 0xc084fc, 0.6);
        cardGfx.strokeRoundedRect(-cardW/2, -cardH/2 + 10, cardW, cardH - 10, 14);

        card.add(cardGfx);

        // Level number
        const numText = this.add.text(0, -10, lvl.num.toString(), {
          fontFamily: '"Space Grotesk", "Arial Black", sans-serif',
          fontSize: '52px',
          fontStyle: 'bold',
          color: '#ffffff',
          stroke: '#4a0080',
          strokeThickness: 5,
        }).setOrigin(0.5);
        const numGrad = numText.context.createLinearGradient(0, 0, 0, numText.height);
        numGrad.addColorStop(0, '#ffffff');
        numGrad.addColorStop(1, '#c084fc');
        numText.setFill(numGrad);
        card.add(numText);

        // Level sublabel
        const subText = this.add.text(0, 38, lvl.label, {
          fontFamily: 'Arial, sans-serif',
          fontSize: '11px',
          color: '#b0a0d8',
          align: 'center',
        }).setOrigin(0.5);
        card.add(subText);

        // Stars row
        const starY = 60;
        for (let s = 0; s < 3; s++) {
          const starTxt = this.add.text(-18 + s * 18, starY, '★', {
            fontFamily: 'Arial',
            fontSize: '18px',
            color: s < lvl.stars ? '#ffd700' : '#333355',
          }).setOrigin(0.5);
          card.add(starTxt);
        }

        // Floating animation
        this.tweens.add({
          targets: card,
          y: cy - 8,
          duration: 1600 + i * 200,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.InOut',
        });

        // Interactivity
        card.setInteractive(new Phaser.Geom.Rectangle(-cardW/2, -cardH/2, cardW, cardH), Phaser.Geom.Rectangle.Contains);

        card.on('pointerover', () => {
          this.tweens.add({ targets: card, scaleX: 1.08, scaleY: 1.08, duration: 130, ease: 'Cubic.Out' });
          cardGfx.clear();
          cardGfx.fillStyle(0x4e3a7a, 1);
          cardGfx.fillRoundedRect(-cardW/2, -cardH/2 + 20, cardW, cardH, 14);
          cardGfx.fillStyle(0x6048a0, 1);
          cardGfx.fillRoundedRect(-cardW/2, -cardH/2 + 10, cardW, cardH - 10, 14);
          cardGfx.fillStyle(0x3d8a3d, 1);
          cardGfx.fillRoundedRect(-cardW/2, -cardH/2, cardW, 28, { tl: 14, tr: 14, bl: 0, br: 0 });
          cardGfx.fillStyle(0x50b050, 1);
          cardGfx.fillRoundedRect(-cardW/2 + 4, -cardH/2, cardW - 8, 18, { tl: 12, tr: 12, bl: 0, br: 0 });
          cardGfx.lineStyle(2.5, 0xff80c0, 1);
          cardGfx.strokeRoundedRect(-cardW/2, -cardH/2 + 10, cardW, cardH - 10, 14);
        });

        card.on('pointerout', () => {
          this.tweens.add({ targets: card, scaleX: 1.0, scaleY: 1.0, duration: 130, ease: 'Cubic.Out' });
          cardGfx.clear();
          cardGfx.fillStyle(0x3d2d66, 1);
          cardGfx.fillRoundedRect(-cardW/2, -cardH/2 + 20, cardW, cardH, 14);
          cardGfx.fillStyle(0x4e3a7a, 1);
          cardGfx.fillRoundedRect(-cardW/2, -cardH/2 + 10, cardW, cardH - 10, 14);
          cardGfx.fillStyle(0x3d8a3d, 1);
          cardGfx.fillRoundedRect(-cardW/2, -cardH/2, cardW, 28, { tl: 14, tr: 14, bl: 0, br: 0 });
          cardGfx.fillStyle(0x50b050, 1);
          cardGfx.fillRoundedRect(-cardW/2 + 4, -cardH/2, cardW - 8, 18, { tl: 12, tr: 12, bl: 0, br: 0 });
          cardGfx.lineStyle(2, 0xc084fc, 0.6);
          cardGfx.strokeRoundedRect(-cardW/2, -cardH/2 + 10, cardW, cardH - 10, 14);
        });

        card.on('pointerdown', () => {
          this.tweens.add({
            targets: card, scaleX: 0.95, scaleY: 0.95, duration: 80, yoyo: true, ease: 'Cubic.In',
            onComplete: () => this.scene.start('PlayScene', { level: lvl.num, lives: 3 }),
          });
        });
      });
    };

    drawRow(row1, row1Y, 3);
    drawRow(row2, row2Y, 2);

    // --- BACK BUTTON ---
    const backBtn = this.add.container(W / 2, H - 28).setDepth(20);
    const backBg = this.add.graphics();
    backBg.fillStyle(0x2a1055, 0.9);
    backBg.fillRoundedRect(-60, -16, 120, 32, 10);
    backBg.lineStyle(1.5, 0x6040a0, 0.9);
    backBg.strokeRoundedRect(-60, -16, 120, 32, 10);
    const backTxt = this.add.text(0, 0, '← BACK', {
      fontFamily: '"Space Grotesk", Arial, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#c0a0ff',
    }).setOrigin(0.5);
    backBtn.add([backBg, backTxt]);
    backBtn.setInteractive(new Phaser.Geom.Rectangle(-60, -16, 120, 32), Phaser.Geom.Rectangle.Contains);
    backBtn.on('pointerover', () => { backBg.clear(); backBg.fillStyle(0x3d1f7a, 0.9); backBg.fillRoundedRect(-60, -16, 120, 32, 10); backBg.lineStyle(1.5, 0x9060d0, 1); backBg.strokeRoundedRect(-60, -16, 120, 32, 10); });
    backBtn.on('pointerout', () => { backBg.clear(); backBg.fillStyle(0x2a1055, 0.9); backBg.fillRoundedRect(-60, -16, 120, 32, 10); backBg.lineStyle(1.5, 0x6040a0, 0.9); backBg.strokeRoundedRect(-60, -16, 120, 32, 10); });
    backBtn.on('pointerdown', () => this.scene.start('MenuScene'));
  }

  update() {
    this.bgTimer += 0.016;
    const g = this.dynamicGraphics;
    g.clear();

    // Twinkling stars
    for (const s of this.stars) {
      const twinkle = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(this.bgTimer * s.speed * 80));
      g.fillStyle(0xffffff, s.alpha * twinkle);
      g.fillCircle(s.x, s.y, s.r);
    }
  }
}
