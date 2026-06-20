const sharp = require('sharp');

const sizes = [16, 32, 72, 96, 128, 144, 152, 180, 192, 384, 512];
const logoPath = 'public/logo.png';

async function generate() {
  for (const size of sizes) {
    let outPath = `public/icons/icon-${size}x${size}.png`;
    if (size === 16 || size === 32) outPath = `public/favicon-${size}x${size}.png`;
    if (size === 180) outPath = `public/apple-touch-icon.png`;

    await sharp(logoPath)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent padding
      })
      .toFile(outPath);
    console.log(`Generated ${outPath}`);
  }
}

generate().catch(console.error);
