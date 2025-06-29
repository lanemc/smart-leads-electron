const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Ensure sharp is installed
try {
  require('sharp');
} catch (error) {
  console.log('Installing sharp for icon generation...');
  require('child_process').execSync('npm install sharp', { stdio: 'inherit' });
}

const svgPath = path.join(__dirname, '../assets/icon.svg');
const assetsDir = path.join(__dirname, '../assets');

// Icon sizes for different platforms
const iconSizes = {
  // macOS .icns (multiple sizes in one file)
  mac: [16, 32, 64, 128, 256, 512, 1024],
  // Windows .ico
  win: [16, 24, 32, 48, 64, 128, 256],
  // Linux .png
  linux: [16, 24, 32, 48, 64, 96, 128, 256, 512]
};

async function createIcons() {
  console.log('Creating application icons...');

  // Read SVG file
  const svgBuffer = fs.readFileSync(svgPath);

  // Create PNG files for all sizes
  for (const platform in iconSizes) {
    for (const size of iconSizes[platform]) {
      const outputPath = path.join(assetsDir, `icon-${size}x${size}.png`);
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(outputPath);
      console.log(`Created ${outputPath}`);
    }
  }

  // Create main icon.png for Linux
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(assetsDir, 'icon.png'));
  
  console.log('Icons created successfully!');
  console.log('Note: For production, you should:');
  console.log('1. Create icon.icns from the PNGs using iconutil (macOS)');
  console.log('2. Create icon.ico from the PNGs using an icon editor (Windows)');
  console.log('3. Use icon.png for Linux');
}

createIcons().catch(console.error);