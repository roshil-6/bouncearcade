import Phaser from 'phaser';

export class TextureFactory {
  static generate(scene: Phaser.Scene) {
    if (scene.textures.exists('hero_body')) return;

    this.createHeroBody(scene);
    this.createHeroFace(scene);
    this.createTileGrass(scene);
    this.createTileDirt(scene);
    this.createTileStone(scene);
    this.createSpike(scene);
    this.createBerry(scene);
    this.createPortal(scene);
    this.createSign(scene);
    this.createFullscreenIcon(scene);
  }

  private static createFullscreenIcon(scene: Phaser.Scene) {
    const key = 'fullscreen_icon';
    const size = 32;
    const canvasTexture = scene.textures.createCanvas(key, size, size);
    if (!canvasTexture) return;
    const ctx = canvasTexture.context;
    
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    
    // Top-Left Corner Tick
    ctx.beginPath();
    ctx.moveTo(10, 4); ctx.lineTo(4, 4); ctx.lineTo(4, 10);
    // Top-Right Corner Tick
    ctx.moveTo(22, 4); ctx.lineTo(28, 4); ctx.lineTo(28, 10);
    // Bottom-Left Corner Tick
    ctx.moveTo(10, 28); ctx.lineTo(4, 28); ctx.lineTo(4, 22);
    // Bottom-Right Corner Tick
    ctx.moveTo(22, 28); ctx.lineTo(28, 28); ctx.lineTo(28, 22);
    
    ctx.stroke();
    canvasTexture.refresh();
  }

  private static createHeroBody(scene: Phaser.Scene) {
    const key = 'hero_body';
    const width = 40;
    const height = 60;
    const canvasTexture = scene.textures.createCanvas(key, width, height);
    if (!canvasTexture) return;
    const ctx = canvasTexture.context;

    const drawRoundRect = (x: number, y: number, w: number, h: number, r: number) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    };

    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#7e3fc7');
    grad.addColorStop(1, '#562391');
    ctx.fillStyle = grad;
    drawRoundRect(0, 0, width, height, 20);
    ctx.fill();

    ctx.strokeStyle = '#2b104d';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.save();
    drawRoundRect(0, 0, width, height, 20);
    ctx.clip();
    ctx.fillStyle = '#ff6200';
    ctx.fillRect(0, 26, width, 10);
    
    ctx.strokeStyle = '#2b104d';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, 26);
    ctx.lineTo(width, 26);
    ctx.moveTo(0, 36);
    ctx.lineTo(width, 36);
    ctx.stroke();
    ctx.restore();

    canvasTexture.refresh();
  }

  private static createHeroFace(scene: Phaser.Scene) {
    const key = 'hero_face';
    const width = 40;
    const height = 60;
    const canvasTexture = scene.textures.createCanvas(key, width, height);
    if (!canvasTexture) return;
    const ctx = canvasTexture.context;

    // Draw left and right eye ovals (larger and more expressive!)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(13.5, 19, 6.5, 10, 0, 0, 2 * Math.PI);
    ctx.ellipse(26.5, 19, 6.5, 10, 0, 0, 2 * Math.PI);
    ctx.fill();

    ctx.strokeStyle = '#2b104d';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.ellipse(13.5, 19, 6.5, 10, 0, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(26.5, 19, 6.5, 10, 0, 0, 2 * Math.PI);
    ctx.stroke();

    // Pupils - positioned slightly inward/looking forward
    ctx.fillStyle = '#005f73';
    ctx.beginPath();
    ctx.arc(15.0, 19, 3, 0, 2 * Math.PI);
    ctx.arc(25.0, 19, 3, 0, 2 * Math.PI);
    ctx.fill();

    // White glare reflection dots in pupils
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(16.0, 18, 1.2, 0, 2 * Math.PI);
    ctx.arc(26.0, 18, 1.2, 0, 2 * Math.PI);
    ctx.fill();

    canvasTexture.refresh();
  }

  private static createTileGrass(scene: Phaser.Scene) {
    const key = 'tile_grass';
    const size = 32;
    const canvasTexture = scene.textures.createCanvas(key, size, size);
    if (!canvasTexture) return;
    const ctx = canvasTexture.context;

    ctx.fillStyle = '#663311';
    ctx.fillRect(0, 0, size, size);

    ctx.fillStyle = '#552a0e';
    ctx.fillRect(0, 12, size, 3);
    ctx.fillRect(0, 22, size, 3);

    ctx.fillStyle = '#58d626';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(size, 0);
    
    const waveCount = 4;
    const step = size / waveCount;
    for (let i = 0; i <= waveCount; i++) {
      const x = i * step;
      if (i > 0) {
        ctx.lineTo(x - step/2, 9);
      }
      ctx.lineTo(x, 4);
    }
    ctx.lineTo(size, 10);
    ctx.lineTo(size, 0);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#2b1000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 4);
    for (let i = 1; i <= waveCount; i++) {
      const x = i * step;
      ctx.lineTo(x - step/2, 9);
      ctx.lineTo(x, 4);
    }
    ctx.stroke();

    ctx.strokeStyle = '#2b1000';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(0, 0, size, size);

    canvasTexture.refresh();
  }

  private static createTileDirt(scene: Phaser.Scene) {
    const key = 'tile_dirt';
    const size = 32;
    const canvasTexture = scene.textures.createCanvas(key, size, size);
    if (!canvasTexture) return;
    const ctx = canvasTexture.context;

    ctx.fillStyle = '#663311';
    ctx.fillRect(0, 0, size, size);

    ctx.fillStyle = '#552a0e';
    ctx.fillRect(0, 8, size, 4);
    ctx.fillRect(0, 20, size, 4);

    ctx.strokeStyle = '#2b1000';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(0, 0, size, size);

    canvasTexture.refresh();
  }

  private static createTileStone(scene: Phaser.Scene) {
    const key = 'tile_stone';
    const size = 32;
    const canvasTexture = scene.textures.createCanvas(key, size, size);
    if (!canvasTexture) return;
    const ctx = canvasTexture.context;

    const grad = ctx.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0, '#4ea8de');
    grad.addColorStop(1, '#0077b6');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.strokeRect(2, 2, size - 4, size - 4);

    ctx.strokeStyle = '#003049';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, size, size);

    canvasTexture.refresh();
  }

  private static createSpike(scene: Phaser.Scene) {
    const key = 'spike';
    const size = 32;
    const canvasTexture = scene.textures.createCanvas(key, size, size);
    if (!canvasTexture) return;
    const ctx = canvasTexture.context;

    ctx.beginPath();
    ctx.moveTo(16, 2);
    ctx.lineTo(31, 30);
    ctx.lineTo(1, 30);
    ctx.closePath();

    const grad = ctx.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0, '#b0b5bc');
    grad.addColorStop(1, '#767d87');
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.strokeStyle = '#1e2229';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    canvasTexture.refresh();
  }

  private static createBerry(scene: Phaser.Scene) {
    const key = 'berry';
    const size = 24;
    const canvasTexture = scene.textures.createCanvas(key, size, size);
    if (!canvasTexture) return;
    const ctx = canvasTexture.context;

    ctx.fillStyle = '#58d626';
    ctx.beginPath();
    ctx.fillRect(11, 2, 2, 6);
    ctx.ellipse(8, 5, 3, 2, -Math.PI / 6, 0, 2 * Math.PI);
    ctx.ellipse(16, 5, 3, 2, Math.PI / 6, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = '#ff2277';
    ctx.beginPath();
    ctx.arc(8, 16, 5, 0, 2 * Math.PI);
    ctx.arc(16, 16, 5, 0, 2 * Math.PI);
    ctx.arc(12, 11, 5.5, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = '#cc0055';
    ctx.beginPath();
    ctx.arc(8, 17, 3, 0, 2 * Math.PI);
    ctx.arc(16, 17, 3, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(10, 9, 1.2, 0, 2 * Math.PI);
    ctx.arc(6, 14, 1, 0, 2 * Math.PI);
    ctx.arc(14, 14, 1, 0, 2 * Math.PI);
    ctx.fill();

    ctx.strokeStyle = '#4a001a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(8, 16, 5, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(16, 16, 5, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(12, 11, 5.5, 0, 2 * Math.PI);
    ctx.stroke();

    canvasTexture.refresh();
  }

  private static createPortal(scene: Phaser.Scene) {
    const key = 'portal';
    const size = 64;
    const canvasTexture = scene.textures.createCanvas(key, size, size);
    if (!canvasTexture) return;
    const ctx = canvasTexture.context;

    const cx = size / 2;
    const cy = size / 2;

    for (let r = 8; r <= 28; r += 5) {
      const alpha = 1 - (r / 32);
      ctx.strokeStyle = `rgba(0, 255, 255, ${alpha})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, 2 * Math.PI);
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(0, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, 2 * Math.PI);
    ctx.fill();

    canvasTexture.refresh();
  }

  private static createSign(scene: Phaser.Scene) {
    const key = 'sign';
    const size = 32;
    const canvasTexture = scene.textures.createCanvas(key, size, size);
    if (!canvasTexture) return;
    const ctx = canvasTexture.context;

    ctx.fillStyle = '#8c5225';
    ctx.fillRect(14, 16, 4, 16);
    ctx.strokeStyle = '#5c3210';
    ctx.lineWidth = 1;
    ctx.strokeRect(14, 16, 4, 16);

    ctx.fillStyle = '#a05e2b';
    ctx.fillRect(2, 2, 28, 16);
    ctx.strokeStyle = '#5c3210';
    ctx.lineWidth = 2;
    ctx.strokeRect(2, 2, 28, 16);

    ctx.fillStyle = '#5c3210';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('?', 16, 11);
    ctx.fillStyle = '#ffffff';
    ctx.fillText('?', 16, 10);

    canvasTexture.refresh();
  }
}
