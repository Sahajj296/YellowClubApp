const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const BASE_DIR = path.join(__dirname, '..');
const ASSETS_DIR = path.join(BASE_DIR, 'assets');
const ANDROID_RES_DIR = path.join(BASE_DIR, 'android', 'app', 'src', 'main', 'res');

// Colors for YellowClub branding
const DARK_BACKGROUND_COLOR = '#2D2D2D'; // Dark gray/charcoal
const YELLOW_RING_COLOR = '#F4C542'; // Yellow/Gold rings

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

async function createYellowClubLogo() {
  console.log('Creating YellowClub logo placeholder...');
  console.log('NOTE: This creates a placeholder. Replace assets/app-icon-original-backup.png');
  console.log('      with your actual YellowClub logo (three interlocking yellow rings on dark background).\n');
  
  // Create a placeholder logo with three interlocking rings
  // This is a simplified version - the actual logo should be provided by the designer
  const logoSvg = `
    <svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
      <!-- Dark background circle -->
      <circle cx="512" cy="512" r="512" fill="${DARK_BACKGROUND_COLOR}"/>
      
      <!-- Three interlocking rings representing connection/community -->
      <!-- Ring 1 (left) -->
      <circle cx="412" cy="512" r="120" fill="none" stroke="${YELLOW_RING_COLOR}" stroke-width="24"/>
      
      <!-- Ring 2 (right) -->
      <circle cx="612" cy="512" r="120" fill="none" stroke="${YELLOW_RING_COLOR}" stroke-width="24"/>
      
      <!-- Ring 3 (bottom center) -->
      <circle cx="512" cy="590" r="120" fill="none" stroke="${YELLOW_RING_COLOR}" stroke-width="24"/>
    </svg>
  `;
  
  const originalBackupPath = path.join(ASSETS_DIR, 'app-icon-original-backup.png');
  
  // Only create if it doesn't exist
  if (!fs.existsSync(originalBackupPath)) {
    await sharp(Buffer.from(logoSvg))
      .png()
      .toFile(originalBackupPath);
    console.log('✓ Created placeholder assets/app-icon-original-backup.png');
    console.log('  (Replace this with your actual logo file)\n');
  } else {
    console.log('✓ Using existing assets/app-icon-original-backup.png\n');
  }
}

async function extractDarkBackgroundColor() {
  console.log('Step 1: Extracting background color from source icon...');
  
  const sourcePath = path.join(ASSETS_DIR, 'app-icon-original-backup.png');
  
  if (!fs.existsSync(sourcePath)) {
    console.error('❌ Source file not found: assets/app-icon-original-backup.png');
    console.error('   Please provide the YellowClub logo file first.');
    process.exit(1);
  }
  
  // Sample the edge pixels to get the background color
  const { data, info } = await sharp(sourcePath)
    .raw()
    .toBuffer({ resolveWithObject: true });
  
  // Sample multiple edge pixels and average them
  const samples = [
    { x: 50, y: 50 },
    { x: 974, y: 50 },
    { x: 50, y: 974 },
    { x: 974, y: 974 }
  ];
  
  let totalR = 0, totalG = 0, totalB = 0;
  
  for (const { x, y } of samples) {
    const idx = (y * info.width + x) * 4;
    totalR += data[idx];
    totalG += data[idx + 1];
    totalB += data[idx + 2];
  }
  
  const avgR = Math.round(totalR / samples.length);
  const avgG = Math.round(totalG / samples.length);
  const avgB = Math.round(totalB / samples.length);
  
  const extractedColor = `#${avgR.toString(16).padStart(2, '0')}${avgG.toString(16).padStart(2, '0')}${avgB.toString(16).padStart(2, '0')}`;
  
  console.log(`✓ Extracted background color: ${extractedColor} (RGB: ${avgR}, ${avgG}, ${avgB})`);
  
  // Use the extracted color or fallback to our defined dark color
  return extractedColor;
}

async function createAppIconFromBackup() {
  console.log('\nStep 2: Copying original backup to app-icon.png...');
  
  const sourcePath = path.join(ASSETS_DIR, 'app-icon-original-backup.png');
  const destPath = path.join(ASSETS_DIR, 'app-icon.png');
  
  await sharp(sourcePath)
    .resize(1024, 1024, {
      fit: 'cover',
      background: { r: 45, g: 45, b: 45, alpha: 1 }
    })
    .toFile(destPath);
  
  console.log('✓ Created assets/app-icon.png (1024×1024)');
}

async function createForegroundLayer() {
  console.log('\nStep 3: Creating transparent foreground layer (yellow rings only)...');
  
  const sourcePath = path.join(ASSETS_DIR, 'app-icon-original-backup.png');
  
  // Load the source image
  const sourceImage = await sharp(sourcePath).raw().toBuffer({ resolveWithObject: true });
  const { data, info } = sourceImage;
  
  // Create a new buffer for the foreground (yellow rings with transparency)
  const foregroundData = Buffer.alloc(info.width * info.height * 4);
  
  // Define threshold for detecting dark background vs yellow rings
  // Dark background: low RGB values (< 100)
  // Yellow rings: high R, moderate-high G, low-moderate B
  const isDarkPixel = (r, g, b) => {
    return r < 80 && g < 80 && b < 80; // Dark gray/charcoal pixels
  };
  
  const isYellowPixel = (r, g, b) => {
    // Yellow pixels have high R, moderate-high G, low B
    return r > 150 && g > 120 && b < 150 && (r - b) > 50;
  };
  
  // Process each pixel
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    
    if (isDarkPixel(r, g, b)) {
      // Make dark background pixels fully transparent
      foregroundData[i] = 0;
      foregroundData[i + 1] = 0;
      foregroundData[i + 2] = 0;
      foregroundData[i + 3] = 0;
    } else if (isYellowPixel(r, g, b)) {
      // Keep yellow ring pixels
      foregroundData[i] = r;
      foregroundData[i + 1] = g;
      foregroundData[i + 2] = b;
      foregroundData[i + 3] = a;
    } else {
      // For any transitional pixels, keep them but apply transparency based on brightness
      const brightness = (r + g + b) / 3;
      const alpha = brightness > 100 ? a : 0;
      foregroundData[i] = r;
      foregroundData[i + 1] = g;
      foregroundData[i + 2] = b;
      foregroundData[i + 3] = alpha;
    }
  }
  
  // Create foreground with safe zone padding (199px as specified, though 200px is more standard)
  // Using 199px padding: (1024 - 199*2) = 626px safe zone
  const safeZoneSize = 626; // 1024 - 199*2
  const padding = 199;
  
  // First resize to safe zone, keeping aspect ratio
  const foregroundWithSafeZone = await sharp(foregroundData, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4
    }
  })
    .resize(safeZoneSize, safeZoneSize, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .extend({
      top: padding,
      bottom: padding,
      left: padding,
      right: padding,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toFile(path.join(ASSETS_DIR, 'app-icon-foreground.png'));
  
  console.log('✓ Created assets/app-icon-foreground.png (1024×1024 with 199px padding)');
  console.log('  Yellow rings extracted with transparency, safe zone respected');
}

async function createBackgroundLayer(backgroundColor) {
  console.log('\nStep 4: Creating solid background layer...');
  
  // Create background layer (solid color 1024x1024)
  const backgroundSvg = `
    <svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
      <rect width="1024" height="1024" fill="${backgroundColor}"/>
    </svg>
  `;
  
  await sharp(Buffer.from(backgroundSvg))
    .png()
    .toFile(path.join(ASSETS_DIR, 'app-icon-background.png'));
  
  console.log(`✓ Created assets/app-icon-background.png (1024×1024 solid ${backgroundColor})`);
}

async function generateDensitySpecificIcons() {
  console.log('\nStep 5: Generating density-specific mipmap resources...');
  
  const foregroundPath = path.join(ASSETS_DIR, 'app-icon-foreground.png');
  const backgroundPath = path.join(ASSETS_DIR, 'app-icon-background.png');
  
  for (const [density, config] of Object.entries(DENSITIES)) {
    const mipmapDir = path.join(ANDROID_RES_DIR, `mipmap-${density}`);
    await ensureDirectoryExists(mipmapDir);
    
    const size = config.size;
    
    // Generate ic_launcher_foreground.png
    await sharp(foregroundPath)
      .resize(size, size, {
        kernel: 'lanczos3' // High-quality downscaling
      })
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
          input: await sharp(foregroundPath).resize(size, size, { kernel: 'lanczos3' }).toBuffer(),
          blend: 'over'
        }
      ])
      .toFile(path.join(mipmapDir, 'ic_launcher.png'));
    
    // Also create round variant (same as regular)
    await sharp(background)
      .composite([
        {
          input: await sharp(foregroundPath).resize(size, size, { kernel: 'lanczos3' }).toBuffer(),
          blend: 'over'
        }
      ])
      .toFile(path.join(mipmapDir, 'ic_launcher_round.png'));
    
    console.log(`✓ Generated icons for ${density} (${size}×${size})`);
  }
}

async function verifyXMLFiles() {
  console.log('\nStep 6: Verifying adaptive icon XML configurations...');
  
  const anydpiDir = path.join(ANDROID_RES_DIR, 'mipmap-anydpi-v26');
  const icLauncherXML = path.join(anydpiDir, 'ic_launcher.xml');
  const icLauncherRoundXML = path.join(anydpiDir, 'ic_launcher_round.xml');
  
  if (fs.existsSync(icLauncherXML)) {
    console.log('✓ mipmap-anydpi-v26/ic_launcher.xml exists (unchanged)');
  } else {
    console.log('⚠️  mipmap-anydpi-v26/ic_launcher.xml not found');
  }
  
  if (fs.existsSync(icLauncherRoundXML)) {
    console.log('✓ mipmap-anydpi-v26/ic_launcher_round.xml exists (unchanged)');
  } else {
    console.log('⚠️  mipmap-anydpi-v26/ic_launcher_round.xml not found');
  }
}

async function verifyAllFiles() {
  console.log('\nStep 7: Verifying all generated files...');
  
  const requiredFiles = [
    'assets/app-icon-original-backup.png',
    'assets/app-icon.png',
    'assets/app-icon-foreground.png',
    'assets/app-icon-background.png',
  ];
  
  // Add density-specific files
  for (const density of Object.keys(DENSITIES)) {
    requiredFiles.push(
      `android/app/src/main/res/mipmap-${density}/ic_launcher.png`,
      `android/app/src/main/res/mipmap-${density}/ic_launcher_foreground.png`,
      `android/app/src/main/res/mipmap-${density}/ic_launcher_background.png`,
      `android/app/src/main/res/mipmap-${density}/ic_launcher_round.png`
    );
  }
  
  let allFilesExist = true;
  for (const file of requiredFiles) {
    const filePath = path.join(BASE_DIR, file);
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      console.log(`✓ ${file} (${(stats.size / 1024).toFixed(1)} KB)`);
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

async function printCompletionMessage() {
  console.log('\n' + '='.repeat(70));
  console.log('🎨 YellowClub Adaptive Icon Generation Complete!');
  console.log('='.repeat(70));
  console.log('\n📋 Summary:');
  console.log('  ✓ Foreground: Three yellow rings with transparency');
  console.log('  ✓ Background: Dark gray (#2D2D2D) solid color');
  console.log('  ✓ Safe zone: 199px padding respected');
  console.log('  ✓ All mipmap densities: mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi');
  console.log('\n🧪 Testing Instructions:');
  console.log('  1. Clean build cache:');
  console.log('     cd android && ./gradlew clean && cd ..');
  console.log('  2. Run on Android:');
  console.log('     npx react-native run-android');
  console.log('  3. Check home screen and app drawer for the new icon');
  console.log('\n' + '='.repeat(70));
}

async function main() {
  try {
    console.log('🎨 YellowClub Adaptive Icon Generator');
    console.log('='.repeat(70));
    console.log('Generating custom icons with three interlocking yellow rings');
    console.log('on dark background (#2D2D2D)\n');
    
    // Ensure assets directory exists
    await ensureDirectoryExists(ASSETS_DIR);
    
    // Create placeholder logo if needed (will be skipped if file exists)
    await createYellowClubLogo();
    
    // Extract background color from source
    const backgroundColor = await extractDarkBackgroundColor();
    
    // Step 1: Copy original backup to app-icon.png
    await createAppIconFromBackup();
    
    // Step 2: Create transparent foreground (yellow rings only)
    await createForegroundLayer();
    
    // Step 3: Create solid background
    await createBackgroundLayer(backgroundColor);
    
    // Step 4: Generate all density-specific icons
    await generateDensitySpecificIcons();
    
    // Step 5: Verify XML files exist
    await verifyXMLFiles();
    
    // Step 6: Verify all files
    await verifyAllFiles();
    
    // Print completion message
    await printCompletionMessage();
    
  } catch (error) {
    console.error('❌ Error generating adaptive icons:', error);
    process.exit(1);
  }
}

main();
