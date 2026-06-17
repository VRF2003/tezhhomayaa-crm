import sharp from 'sharp';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = resolve(__dirname, '../public/icon-source.png');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

for (const size of sizes) {
  await sharp(src)
    .resize(size, size)
    .toFile(resolve(__dirname, `../public/icons/icon-${size}x${size}.png`));
  console.log(`Generated icon-${size}x${size}.png`);
}

// Apple touch icon 180x180
await sharp(src)
  .resize(180, 180)
  .toFile(resolve(__dirname, '../public/apple-touch-icon.png'));
console.log('Generated apple-touch-icon.png');

// Favicon 32x32
await sharp(src)
  .resize(32, 32)
  .toFile(resolve(__dirname, '../public/favicon-32x32.png'));
console.log('Generated favicon-32x32.png');

// Favicon 16x16
await sharp(src)
  .resize(16, 16)
  .toFile(resolve(__dirname, '../public/favicon-16x16.png'));
console.log('Generated favicon-16x16.png');

console.log('All icons generated successfully!');
