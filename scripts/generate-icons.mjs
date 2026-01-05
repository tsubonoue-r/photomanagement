import sharp from 'sharp';
import { readFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconDir = join(rootDir, 'public', 'icons');

// Ensure directory exists
if (!existsSync(iconDir)) {
  mkdirSync(iconDir, { recursive: true });
}

// Read SVG file
const svgBuffer = readFileSync(join(iconDir, 'icon.svg'));

// Generate PNG icons for each size
for (const size of sizes) {
  const outputPath = join(iconDir, `icon-${size}x${size}.png`);

  await sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toFile(outputPath);

  console.log(`Generated: icon-${size}x${size}.png`);
}

// Generate shortcut icons
await sharp(svgBuffer)
  .resize(96, 96)
  .png()
  .toFile(join(iconDir, 'camera-shortcut.png'));
console.log('Generated: camera-shortcut.png');

await sharp(svgBuffer)
  .resize(96, 96)
  .png()
  .toFile(join(iconDir, 'projects-shortcut.png'));
console.log('Generated: projects-shortcut.png');

// Generate Apple touch icon
await sharp(svgBuffer)
  .resize(180, 180)
  .png()
  .toFile(join(iconDir, 'apple-touch-icon.png'));
console.log('Generated: apple-touch-icon.png');

// Generate favicon
await sharp(svgBuffer)
  .resize(32, 32)
  .png()
  .toFile(join(iconDir, 'favicon-32x32.png'));
console.log('Generated: favicon-32x32.png');

await sharp(svgBuffer)
  .resize(16, 16)
  .png()
  .toFile(join(iconDir, 'favicon-16x16.png'));
console.log('Generated: favicon-16x16.png');

console.log('\nAll icons generated successfully!');
