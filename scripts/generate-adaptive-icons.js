const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const BASE_DIR = path.join(__dirname, '..');
const ASSETS_DIR = path.join(BASE_DIR, 'assets');
const ANDROID_RES_DIR = path.join(BASE_DIR, 'android', 'app', 'src', 'main', 'res');

// Colors
const BACKGROUND_COLOR = '#F4C542'; // Yellow/Gold

// Density specifications
const DENSITIES = {
  mdpi: { size: 48, scale: 1 },
  hdpi: { size: 72, scale: 1.5 },
  xhdpi: { size: 96, scale: 2 },
  xxhdpi: { size: 144, scale: 3 },
  xxxhdpi: { size: 192, scale: 4 }
};

async function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

async function createBaseAppIcon() {
  console.log('Step 1: Creating base app-icon.png (1024x1024)...');
  
  // Read the existing launcher icon at highest resolution
  const existingIconPath = path.join(ANDROID_RES_DIR, 'mipmap-xxxhdpi', 'ic_launcher.png');
  
  if (fs.existsSync(existingIconPath)) {
    // Scale up the existing icon to 1024x1024
    await sharp(existingIconPath)
      .resize(1024, 1024, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .toFile(path.join(ASSETS_DIR, 'app-icon.png'));
    
    console.log('✓ Created assets/app-icon.png from existing launcher icon');
  } else {
    // Create a simple placeholder icon with yellow background and "Y" text
    const svg = `
      <svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
        <rect width="1024" height="1024" fill="${BACKGROUND_COLOR}"/>
        <text x="512" y="700" font-family="Arial, sans-serif" font-size="600" font-weight="bold" 
              text-anchor="middle" fill="#FFFFFF">Y</text>
      </svg>
    `;
    
    await sharp(Buffer.from(svg))
      .png()
      .toFile(path.join(ASSETS_DIR, 'app-icon.png'));
    
    console.log('✓ Created placeholder assets/app-icon.png');
  }
}

async function createAdaptiveIconLayers() {
  console.log('\nStep 2: Creating adaptive icon layers...');
  
  const appIconPath = path.join(ASSETS_DIR, 'app-icon.png');
  
  // Create foreground layer (624x624 centered in 1024x1024)
  // This respects the 61% safe zone for adaptive icons
  const padding = 200; // (1024 - 624) / 2 = 200, provides even padding
  
  await sharp(appIconPath)
    .resize(624, 624, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .extend({
      top: padding,
      bottom: padding,
      left: padding,
      right: padding, // 200 + 200 + 624 = 1024
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .toFile(path.join(ASSETS_DIR, 'app-icon-foreground.png'));
  
  console.log('✓ Created assets/app-icon-foreground.png (1024x1024 with 624x624 safe zone)');
  
  // Create background layer (solid color 1024x1024)
  const backgroundSvg = `
    <svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
      <rect width="1024" height="1024" fill="${BACKGROUND_COLOR}"/>
    </svg>
  `;
  
  await sharp(Buffer.from(backgroundSvg))
    .png()
    .toFile(path.join(ASSETS_DIR, 'app-icon-background.png'));
  
  console.log('✓ Created assets/app-icon-background.png (1024x1024 solid color)');
}

async function generateDensitySpecificIcons() {
  console.log('\nStep 3: Generating density-specific mipmap resources...');
  
  const foregroundPath = path.join(ASSETS_DIR, 'app-icon-foreground.png');
  const backgroundPath = path.join(ASSETS_DIR, 'app-icon-background.png');
  const appIconPath = path.join(ASSETS_DIR, 'app-icon.png');
  
  for (const [density, config] of Object.entries(DENSITIES)) {
    const mipmapDir = path.join(ANDROID_RES_DIR, `mipmap-${density}`);
    await ensureDirectoryExists(mipmapDir);
    
    const size = config.size;
    
    // Generate ic_launcher_foreground.png
    await sharp(foregroundPath)
      .resize(size, size)
      .toFile(path.join(mipmapDir, 'ic_launcher_foreground.png'));
    
    // Generate ic_launcher_background.png
    await sharp(backgroundPath)
      .resize(size, size)
      .toFile(path.join(mipmapDir, 'ic_launcher_background.png'));
    
    // Generate ic_launcher.png (legacy - composite foreground over background)
    const background = await sharp(backgroundPath)
      .resize(size, size)
      .toBuffer();
    
    await sharp(background)
      .composite([
        {
          input: await sharp(foregroundPath).resize(size, size).toBuffer(),
          blend: 'over'
        }
      ])
      .toFile(path.join(mipmapDir, 'ic_launcher.png'));
    
    console.log(`✓ Generated icons for ${density} (${size}x${size})`);
  }
}

async function createAdaptiveIconXML() {
  console.log('\nStep 4: Creating adaptive icon XML configurations...');
  
  const anydpiDir = path.join(ANDROID_RES_DIR, 'mipmap-anydpi-v26');
  await ensureDirectoryExists(anydpiDir);
  
  const adaptiveIconXML = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>`;
  
  // Create ic_launcher.xml
  fs.writeFileSync(
    path.join(anydpiDir, 'ic_launcher.xml'),
    adaptiveIconXML
  );
  console.log('✓ Created mipmap-anydpi-v26/ic_launcher.xml');
  
  // Create ic_launcher_round.xml
  fs.writeFileSync(
    path.join(anydpiDir, 'ic_launcher_round.xml'),
    adaptiveIconXML
  );
  console.log('✓ Created mipmap-anydpi-v26/ic_launcher_round.xml');
}

async function verifyFiles() {
  console.log('\nStep 5: Verifying all required files...');
  
  const requiredFiles = [
    // Assets
    'assets/app-icon.png',
    'assets/app-icon-foreground.png',
    'assets/app-icon-background.png',
    
    // XML configs
    'android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml',
    'android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml',
  ];
  
  // Add density-specific files
  for (const density of Object.keys(DENSITIES)) {
    requiredFiles.push(
      `android/app/src/main/res/mipmap-${density}/ic_launcher.png`,
      `android/app/src/main/res/mipmap-${density}/ic_launcher_foreground.png`,
      `android/app/src/main/res/mipmap-${density}/ic_launcher_background.png`
    );
  }
  
  let allFilesExist = true;
  for (const file of requiredFiles) {
    const filePath = path.join(BASE_DIR, file);
    if (fs.existsSync(filePath)) {
      console.log(`✓ ${file}`);
    } else {
      console.log(`✗ ${file} - MISSING`);
      allFilesExist = false;
    }
  }
  
  if (allFilesExist) {
    console.log('\n✅ All required files have been generated successfully!');
  } else {
    console.log('\n⚠️  Some files are missing. Please review the errors above.');
    process.exit(1);
  }
}

async function printBuildInstructions() {
  console.log('\n' + '='.repeat(60));
  console.log('Build Cleanup Instructions (PowerShell)');
  console.log('='.repeat(60));
  console.log(`
# Clean Android build cache
cd android
.\\gradlew clean
cd ..

# Clean Metro bundler cache
npx react-native start --reset-cache

# Rebuild and run on Android
npx react-native run-android
`);
  console.log('='.repeat(60));
}

async function main() {
  try {
    console.log('🎨 Android Adaptive Icon Generator');
    console.log('='.repeat(60));
    
    // Ensure assets directory exists
    await ensureDirectoryExists(ASSETS_DIR);
    
    // Step 1: Create base app icon
    await createBaseAppIcon();
    
    // Step 2: Create adaptive icon layers
    await createAdaptiveIconLayers();
    
    // Step 3: Generate density-specific icons
    await generateDensitySpecificIcons();
    
    // Step 4: Create XML configurations
    await createAdaptiveIconXML();
    
    // Step 5: Verify all files
    await verifyFiles();
    
    // Print build instructions
    await printBuildInstructions();
    
  } catch (error) {
    console.error('❌ Error generating adaptive icons:', error);
    process.exit(1);
  }
}

main();
