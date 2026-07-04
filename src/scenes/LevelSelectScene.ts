import Phaser from 'phaser';

export class LevelSelectScene extends Phaser.Scene {
  private wavesGraphics!: Phaser.GameObjects.Graphics;
  private bgTimer = 0;

  constructor() {
    super('LevelSelectScene');
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Background gradient
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0f172a, 0x0f172a, 0x1e1b4b, 0x1e1b4b, 1);
    bg.fillRect(0, 0, width, height);

    this.wavesGraphics = this.add.graphics();

    // Title
    const titleText = this.add.text(width / 2, 100, 'SELECT LEVEL', {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: '48px',
      fontStyle: 'bold',
      color: '#ffffff'
    });
    titleText.setOrigin(0.5);
    titleText.setShadow(0, 4, '#7e3fc7', 6, true, true);

    // Fullscreen Button
    const fsButton = this.add.sprite(width - 45, 45, 'fullscreen_icon');
    fsButton.setInteractive({ useHandCursor: true });
    fsButton.setDepth(30);
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

    // Levels grid configuration
    const levels = [1, 2, 3];
    const buttonSpacing = 180;
    const startX = width / 2 - ((levels.length - 1) * buttonSpacing) / 2;
    const startY = height / 2;

    levels.forEach((levelNum, index) => {
      const x = startX + index * buttonSpacing;
      const y = startY;

      // Card container
      const btn = this.add.container(x, y);

      const cardBg = this.add.graphics();
      // Glass card look
      cardBg.fillStyle(0x7e3fc7, 0.85);
      cardBg.fillRoundedRect(-60, -60, 120, 120, 15);
      cardBg.lineStyle(3, 0xffaa00, 1);
      cardBg.strokeRoundedRect(-60, -60, 120, 120, 15);

      const numText = this.add.text(0, -10, levelNum.toString(), {
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: '44px',
        fontStyle: 'bold',
        color: '#ffffff'
      });
      numText.setOrigin(0.5);

      const labelText = this.add.text(0, 30, 'LEVEL', {
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: '14px',
        fontStyle: 'bold',
        color: '#94a3b8'
      });
      labelText.setOrigin(0.5);

      btn.add([cardBg, numText, labelText]);

      // Interactive hit area
      const hitArea = new Phaser.Geom.Rectangle(-60, -60, 120, 120);
      btn.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

      btn.on('pointerover', () => {
        this.tweens.add({
          targets: btn,
          scaleX: 1.1,
          scaleY: 1.1,
          duration: 150,
          ease: 'Cubic.Out'
        });
        cardBg.clear();
        cardBg.fillStyle(0x904ed9, 0.95);
        cardBg.fillRoundedRect(-60, -60, 120, 120, 15);
        cardBg.lineStyle(3, 0xffbb00, 1);
        cardBg.strokeRoundedRect(-60, -60, 120, 120, 15);
      });

      btn.on('pointerout', () => {
        this.tweens.add({
          targets: btn,
          scaleX: 1.0,
          scaleY: 1.0,
          duration: 150,
          ease: 'Cubic.Out'
        });
        cardBg.clear();
        cardBg.fillStyle(0x7e3fc7, 0.85);
        cardBg.fillRoundedRect(-60, -60, 120, 120, 15);
        cardBg.lineStyle(3, 0xffaa00, 1);
        cardBg.strokeRoundedRect(-60, -60, 120, 120, 15);
      });

      btn.on('pointerdown', () => {
        this.tweens.add({
          targets: btn,
          scaleX: 0.95,
          scaleY: 0.95,
          duration: 80,
          yoyo: true,
          ease: 'Cubic.In',
          onComplete: () => {
            this.scene.start('PlayScene', { level: levelNum, lives: 3 });
          }
        });
      });
    });

    // Back Button
    const backBtn = this.add.container(width / 2, height - 100);
    const backBg = this.add.graphics();
    backBg.fillStyle(0x1e293b, 0.9);
    backBg.fillRoundedRect(-70, -20, 140, 40, 10);
    backBg.lineStyle(2, 0x475569, 1);
    backBg.strokeRoundedRect(-70, -20, 140, 40, 10);

    const backText = this.add.text(0, 0, 'BACK', {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#ffffff'
    });
    backText.setOrigin(0.5);

    backBtn.add([backBg, backText]);

    const backHitArea = new Phaser.Geom.Rectangle(-70, -20, 140, 40);
    backBtn.setInteractive(backHitArea, Phaser.Geom.Rectangle.Contains);

    backBtn.on('pointerover', () => {
      this.tweens.add({
        targets: backBtn,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 150,
        ease: 'Cubic.Out'
      });
      backBg.clear();
      backBg.fillStyle(0x334155, 0.9);
      backBg.fillRoundedRect(-70, -20, 140, 40, 10);
      backBg.lineStyle(2, 0x64748b, 1);
      backBg.strokeRoundedRect(-70, -20, 140, 40, 10);
    });

    backBtn.on('pointerout', () => {
      this.tweens.add({
        targets: backBtn,
        scaleX: 1.0,
        scaleY: 1.0,
        duration: 150,
        ease: 'Cubic.Out'
      });
      backBg.clear();
      backBg.fillStyle(0x1e293b, 0.9);
      backBg.fillRoundedRect(-70, -20, 140, 40, 10);
      backBg.lineStyle(2, 0x475569, 1);
      backBg.strokeRoundedRect(-70, -20, 140, 40, 10);
    });

    backBtn.on('pointerdown', () => {
      this.scene.start('MenuScene');
    });
  }

  update() {
    this.bgTimer += 0.003;
    this.wavesGraphics.clear();
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Background Wave 1
    this.wavesGraphics.fillStyle(0x312e81, 0.4);
    this.wavesGraphics.beginPath();
    this.wavesGraphics.moveTo(0, height);
    for (let x = 0; x <= width; x += 10) {
      const y = height - 120 + Math.sin(x * 0.003 + this.bgTimer) * 40 + Math.cos(x * 0.001 + this.bgTimer * 2) * 20;
      this.wavesGraphics.lineTo(x, y);
    }
    this.wavesGraphics.lineTo(width, height);
    this.wavesGraphics.closePath();
    this.wavesGraphics.fill();

    // Background Wave 2
    this.wavesGraphics.fillStyle(0x4338ca, 0.3);
    this.wavesGraphics.beginPath();
    this.wavesGraphics.moveTo(0, height);
    for (let x = 0; x <= width; x += 10) {
      const y = height - 180 + Math.sin(x * 0.002 - this.bgTimer * 1.5) * 50 + Math.cos(x * 0.004 + this.bgTimer) * 15;
      this.wavesGraphics.lineTo(x, y);
    }
    this.wavesGraphics.lineTo(width, height);
    this.wavesGraphics.closePath();
    this.wavesGraphics.fill();
  }
}
