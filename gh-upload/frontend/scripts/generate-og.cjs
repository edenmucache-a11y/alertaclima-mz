// scripts/generate-og.cjs — converte og-image.svg em og-image.png + favicon.png
const sharp = require('sharp');
const path = require('node:path');
const fs = require('node:fs');

const publicDir = path.join(__dirname, '..', 'public');

async function run() {
  // OG image 1200x630
  const svgOg = fs.readFileSync(path.join(publicDir, 'og-image.svg'));
  await sharp(svgOg, { density: 96 })
    .resize(1200, 630)
    .png({ quality: 90, compressionLevel: 9 })
    .toFile(path.join(publicDir, 'og-image.png'));
  console.log('✓ og-image.png (1200x630) gerado');

  // Favicon 32x32 (para o browser tab)
  const svgFav = fs.readFileSync(path.join(publicDir, 'favicon.svg'));
  await sharp(svgFav, { density: 96 })
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, 'favicon.png'));
  console.log('✓ favicon.png (32x32) gerado');

  // Ícones PWA
  for (const size of [192, 512]) {
    await sharp(svgFav, { density: 96 })
      .resize(size, size)
      .png()
      .toFile(path.join(publicDir, `icon-${size}.png`));
    console.log(`✓ icon-${size}.png gerado`);
  }
}
run().catch((e) => { console.error(e); process.exit(1); });
