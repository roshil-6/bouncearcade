import Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
  private wavesGraphics!: Phaser.GameObjects.Graphics;
  private bgTimer = 0;

  constructor() {
    super('MenuScene');
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Draw solid gradient background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0f172a, 0x0f172a, 0x1e1b4b, 0x1e1b4b, 1);
    bg.fillRect(0, 0, width, height);

    // Setup waves graphics for drawing moving abstract wave shapes
    this.wavesGraphics = this.add.graphics();

    // Title
    const titleText = this.add.text(width / 2, height / 2 - 80, 'BOUNCE BOUND', {
      fontFamily: '"Space Grotesk", "Arial Black", sans-serif',
      fontSize: '84px',
      fontStyle: 'bold',
      color: '#ffffff'
    });
    titleText.setOrigin(0.5);
    titleText.setShadow(0, 8, '#5b21b6', 12, true, true);

    // Apply linear gradient to the title text
    const gradient = titleText.context.createLinearGradient(0, 0, 0, titleText.height);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.3, '#f3e8ff');
    gradient.addColorStop(1, '#a78bfa');
    titleText.setFill(gradient);

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

    // Play Button
    const playButton = this.add.container(width / 2, height / 2 + 50);
    const btnBg = this.add.graphics();
    
    // Glassmorphic look
    btnBg.fillStyle(0x7e3fc7, 0.95);
    btnBg.fillRoundedRect(-120, -25, 240, 50, 15);
    btnBg.lineStyle(2.5, 0xffaa00, 1);
    btnBg.strokeRoundedRect(-120, -25, 240, 50, 15);

    const btnText = this.add.text(0, 0, 'PLAY GAME', {
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#ffffff'
    });
    btnText.setOrigin(0.5);

    playButton.add([btnBg, btnText]);

    const hitArea = new Phaser.Geom.Rectangle(-120, -25, 240, 50);
    playButton.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

    playButton.on('pointerover', () => {
      this.tweens.add({
        targets: playButton,
        scaleX: 1.08,
        scaleY: 1.08,
        duration: 150,
        ease: 'Cubic.Out'
      });
      btnBg.clear();
      btnBg.fillStyle(0x904ed9, 0.95);
      btnBg.fillRoundedRect(-120, -25, 240, 50, 15);
      btnBg.lineStyle(2.5, 0xffbb00, 1);
      btnBg.strokeRoundedRect(-120, -25, 240, 50, 15);
    });

    playButton.on('pointerout', () => {
      this.tweens.add({
        targets: playButton,
        scaleX: 1.0,
        scaleY: 1.0,
        duration: 150,
        ease: 'Cubic.Out'
      });
      btnBg.clear();
      btnBg.fillStyle(0x7e3fc7, 0.95);
      btnBg.fillRoundedRect(-120, -25, 240, 50, 15);
      btnBg.lineStyle(2.5, 0xffaa00, 1);
      btnBg.strokeRoundedRect(-120, -25, 240, 50, 15);
    });

    playButton.on('pointerdown', () => {
      this.tweens.add({
        targets: playButton,
        scaleX: 0.95,
        scaleY: 0.95,
        duration: 80,
        yoyo: true,
        ease: 'Cubic.In',
        onComplete: () => {
          this.scene.start('LevelSelectScene');
        }
      });
    });

    // Add decorative floating hero body and face container
    const heroMenuContainer = this.add.container(width / 2, height / 2 + 180);
    heroMenuContainer.setScale(1.2);
    
    const body = this.add.sprite(0, 0, 'hero_body');
    const face = this.add.sprite(0, 0, 'hero_face');
    heroMenuContainer.add([body, face]);

    this.tweens.add({
      targets: heroMenuContainer,
      y: height / 2 + 155,
      angle: { from: -5, to: 5 },
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut'
    });
  }

  update() {
    this.bgTimer += 0.003;
    
    // Draw animated overlapping landscape curves in background
    this.wavesGraphics.clear();
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Wave 1 - Deep blue-purple wave
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

    // Wave 2 - Lighter violet-indigo wave
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
