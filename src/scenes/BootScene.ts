import Phaser from 'phaser';
import { TextureFactory } from '../utils/TextureFactory';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const loadingText = this.make.text({
      x: width / 2,
      y: height / 2 - 50,
      text: 'BOUNCE BOUND',
      style: {
        font: 'bold 32px Arial',
        color: '#ffffff'
      }
    });
    loadingText.setOrigin(0.5, 0.5);

    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x1e293b, 0.8);
    progressBox.fillRoundedRect(width / 2 - 160, height / 2 - 15, 320, 30, 8);

    const progressBar = this.add.graphics();
    
    // Simulate loading since procedural generation is instantaneous
    let progress = 0;
    const timer = this.time.addEvent({
      delay: 50,
      callback: () => {
        progress += 0.1;
        progressBar.clear();
        progressBar.fillStyle(0x7e3fc7, 1);
        progressBar.fillRoundedRect(width / 2 - 150, height / 2 - 10, 300 * Math.min(progress, 1), 20, 6);
        
        if (progress >= 1.0) {
          timer.destroy();
          progressBar.destroy();
          progressBox.destroy();
          loadingText.destroy();
          this.scene.start('MenuScene');
        }
      },
      loop: true
    });
  }

  create() {
    try {
      if (window.screen && window.screen.orientation && (window.screen.orientation as any).lock) {
        (window.screen.orientation as any).lock('landscape').catch(() => {});
      }
    } catch (e) {}
    
    // Generate the procedural textures
    TextureFactory.generate(this);
  }
}
