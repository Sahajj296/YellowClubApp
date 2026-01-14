# YellowClub Custom Adaptive Icon Setup

This document describes the custom YellowClub adaptive icon implementation featuring three interlocking yellow rings on a dark background.

## Overview

The YellowClub app icon features:
- **Brand identity**: Three interlocking yellow/gold rings symbolizing connection and community
- **Color scheme**: Yellow/gold (#F4C542) rings on dark gray (#2D2D2D) background
- **Style**: Modern, professional, geometric design
- **Format**: Adaptive icon system for Android 8.0+ with proper safe zone compliance

## Icon Structure

### Source Icon
**File**: `assets/app-icon-original-backup.png` (1024×1024)
- Contains the complete YellowClub logo
- Three interlocking yellow rings on dark circular background
- This is the master source file for all icon generation

### Generated Assets

#### 1. Base Assets (`assets/`)

**app-icon.png** (1024×1024)
- Copy of the original backup icon
- High-resolution master icon

**app-icon-foreground.png** (1024×1024)
- Foreground layer with **transparency**
- Contains only the three yellow rings
- Dark background removed completely
- 199px padding on all sides (safe zone: 626×626px centered)
- Ensures rings aren't cropped on any Android launcher shape

**app-icon-background.png** (1024×1024)
- Background layer with solid dark gray color (#2D2D2D)
- Provides consistent background across all launcher shapes

#### 2. Android Mipmap Resources

For each density folder (`mipmap-mdpi`, `mipmap-hdpi`, `mipmap-xhdpi`, `mipmap-xxhdpi`, `mipmap-xxxhdpi`):

| Density | Size | Files Generated |
|---------|------|-----------------|
| mdpi | 48×48 | ic_launcher.png, ic_launcher_foreground.png, ic_launcher_background.png, ic_launcher_round.png |
| hdpi | 72×72 | ic_launcher.png, ic_launcher_foreground.png, ic_launcher_background.png, ic_launcher_round.png |
| xhdpi | 96×96 | ic_launcher.png, ic_launcher_foreground.png, ic_launcher_background.png, ic_launcher_round.png |
| xxhdpi | 144×144 | ic_launcher.png, ic_launcher_foreground.png, ic_launcher_background.png, ic_launcher_round.png |
| xxxhdpi | 192×192 | ic_launcher.png, ic_launcher_foreground.png, ic_launcher_background.png, ic_launcher_round.png |

**File Descriptions:**
- `ic_launcher_foreground.png`: Scaled yellow rings with transparency
- `ic_launcher_background.png`: Scaled dark gray background
- `ic_launcher.png`: Legacy composite icon (foreground + background) for Android < 8.0
- `ic_launcher_round.png`: Round variant of the composite icon

#### 3. Adaptive Icon XML Configuration

Located in `android/app/src/main/res/mipmap-anydpi-v26/`:

**ic_launcher.xml** and **ic_launcher_round.xml**:
```xml
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
```

These files define how Android 8.0+ devices combine the foreground and background layers.

## Color Specifications

### Primary Colors
- **Yellow/Gold Rings**: `#F4C542` (RGB: 244, 197, 66)
- **Dark Gray Background**: `#2D2D2D` (RGB: 45, 45, 45)

These colors were carefully chosen to:
- Maintain high contrast for visibility
- Match the YellowClub brand identity
- Work well on both light and dark home screens

## Safe Zone Compliance

Android adaptive icons require content to stay within a safe zone to prevent cropping on different device shapes:

- **Full canvas**: 1024×1024px
- **Safe zone**: 626×626px (center area)
- **Padding**: 199px on all sides
- **Safe zone percentage**: ~61% of total icon area

The three yellow rings are scaled and positioned to fit comfortably within this safe zone, ensuring they're fully visible regardless of the launcher mask shape (circle, squircle, rounded square, teardrop, etc.).

## Regenerating Icons

### Using the YellowClub Icon Generator Script

To regenerate all icon assets from the source:

```bash
node scripts/generate-yellowclub-icons.js
```

This script will:
1. ✓ Use `assets/app-icon-original-backup.png` as the source
2. ✓ Extract the background color from the source (or use #2D2D2D)
3. ✓ Copy the source to `app-icon.png`
4. ✓ Create transparent foreground layer (yellow rings only)
5. ✓ Create solid dark gray background layer
6. ✓ Generate all density-specific mipmap resources
7. ✓ Verify XML configurations exist
8. ✓ Verify all required files are generated

### Script Features

The `generate-yellowclub-icons.js` script includes:
- **Smart color detection**: Automatically extracts background color from source icon
- **Intelligent foreground extraction**: Isolates yellow rings by detecting and removing dark pixels
- **Safe zone handling**: Properly scales and pads foreground to respect the 199px safe zone
- **High-quality scaling**: Uses lanczos3 kernel for optimal downscaling quality
- **Comprehensive verification**: Checks all generated files and reports missing assets
- **Clear progress reporting**: Step-by-step console output with file sizes

### Placeholder Logo Note

If `app-icon-original-backup.png` doesn't exist, the script will create a placeholder with three simple interlocking rings. **Replace this placeholder with your actual YellowClub logo** for production use.

## Testing the Icons

After generating icons, follow these steps to test:

### 1. Clean Build Cache
```bash
cd android
./gradlew clean
cd ..
```

### 2. Clear Metro Bundler Cache
```bash
npx react-native start --reset-cache
```

### 3. Run on Android Device/Emulator
```bash
npx react-native run-android
```

### 4. Verify Icon Display

Check the app icon in:
- **Home screen**: Long press and add app to home screen
- **App drawer**: Open app drawer and locate YellowClubApp
- **Recent apps**: Open recent apps view
- **Settings > Apps**: Check in app list

Verify on different launcher shapes:
- Circular masks (Pixel devices)
- Squircle masks (OnePlus, Oppo)
- Rounded square masks (Samsung)
- Teardrop masks (some Asian manufacturers)

### Visual Checklist

Ensure:
- ✅ Three yellow rings are clearly visible
- ✅ Rings are not cropped or cut off on any edge
- ✅ Dark gray background is consistently displayed
- ✅ Foreground has proper transparency (no white/black box around rings)
- ✅ Icon looks sharp and clear at all sizes
- ✅ Colors match the design specification

## Updating the Logo

If you need to update the YellowClub logo:

1. **Replace the source file**:
   ```bash
   # Back up the current icon first
   cp assets/app-icon-original-backup.png assets/app-icon-original-backup-old.png
   
   # Add your new icon (must be 1024×1024 PNG)
   cp /path/to/new-logo.png assets/app-icon-original-backup.png
   ```

2. **Verify the source icon requirements**:
   - Format: PNG with transparency
   - Size: 1024×1024 pixels
   - Content: Three yellow rings on dark background
   - Background: Dark gray/charcoal color (~#2D2D2D)
   - Rings: Yellow/gold color (~#F4C542)

3. **Regenerate all icons**:
   ```bash
   node scripts/generate-yellowclub-icons.js
   ```

4. **Test the new icons** following the testing steps above

## Troubleshooting

### Icons not updating on device
- Run `cd android && ./gradlew clean` to clear build cache
- Uninstall the app completely and reinstall
- Restart the device (some launchers cache aggressively)

### Foreground layer shows dark background
- Verify `app-icon-original-backup.png` has the expected dark color values
- The script detects dark pixels (RGB < 80) and makes them transparent
- If your dark background is lighter, adjust the `isDarkPixel` threshold in the script

### Rings are cropped on some devices
- Verify the foreground layer has proper 199px padding
- Check that rings fit within the 626×626px safe zone
- Test on devices with different launcher shapes

### Colors don't match design
- Verify source icon uses correct colors (#F4C542 yellow, #2D2D2D dark gray)
- Check that background layer is solid #2D2D2D
- Review extracted foreground for color accuracy

### Script errors
- Ensure Node.js 18+ is installed
- Verify `sharp` package is installed: `npm install`
- Check that `assets/app-icon-original-backup.png` exists and is valid

## Design Guidelines

### Creating a New Logo

If designing a new YellowClub logo for the app icon:

1. **Use vector graphics** (SVG, Illustrator, Figma) for precise ring shapes
2. **Ensure rings interlock** for the connection/community symbolism
3. **Keep ring thickness consistent** for professional appearance
4. **Test at small sizes** (48×48px) to ensure visibility
5. **Use proper colors**:
   - Rings: #F4C542 (or similar gold/yellow)
   - Background: #2D2D2D (or similar dark gray)
6. **Export at 1024×1024px** with transparency support
7. **Position rings centrally** within the safe zone

### Brand Consistency

The three interlocking rings represent:
- **Connection**: Members connecting with each other
- **Community**: Building a strong community
- **Unity**: Coming together as one club

Maintain this symbolism across all branding materials.

## File Structure

```
YellowClubApp/
├── assets/
│   ├── app-icon-original-backup.png    # Master source icon (1024×1024)
│   ├── app-icon.png                    # Base icon (1024×1024)
│   ├── app-icon-foreground.png         # Transparent yellow rings (1024×1024)
│   └── app-icon-background.png         # Dark gray background (1024×1024)
├── android/app/src/main/res/
│   ├── mipmap-anydpi-v26/
│   │   ├── ic_launcher.xml             # Adaptive icon config
│   │   └── ic_launcher_round.xml       # Round adaptive icon config
│   ├── mipmap-mdpi/                    # 48×48px icons
│   │   ├── ic_launcher.png
│   │   ├── ic_launcher_foreground.png
│   │   ├── ic_launcher_background.png
│   │   └── ic_launcher_round.png
│   ├── mipmap-hdpi/                    # 72×72px icons
│   ├── mipmap-xhdpi/                   # 96×96px icons
│   ├── mipmap-xxhdpi/                  # 144×144px icons
│   └── mipmap-xxxhdpi/                 # 192×192px icons
└── scripts/
    ├── generate-adaptive-icons.js       # Original generic icon generator
    └── generate-yellowclub-icons.js     # YellowClub-specific icon generator
```

## Comparison with Original Script

The original `generate-adaptive-icons.js` script was designed for generic icon generation and used a yellow background with white text. The new `generate-yellowclub-icons.js` script is specifically designed for the YellowClub brand and:

- Uses the actual YellowClub logo (three interlocking rings)
- Extracts foreground by detecting and removing dark background pixels
- Uses dark gray background instead of yellow
- Implements precise 199px padding (vs 200px in original)
- Includes intelligent color sampling from source icon
- Provides detailed progress reporting and verification

## References

- [Android Adaptive Icons Guide](https://developer.android.com/guide/practices/ui_guidelines/icon_design_adaptive)
- [Material Design Product Icons](https://material.io/design/iconography/product-icons.html)
- [React Native App Icon Setup](https://reactnative.dev/docs/signed-apk-android#setting-up-gradle-variables)
- [Sharp Image Processing Library](https://sharp.pixelplumbing.com/)

## Version History

### v1.0.0 (Current)
- Initial YellowClub custom icon implementation
- Three interlocking yellow rings on dark background
- Full adaptive icon support with safe zone compliance
- Automated generation script with foreground extraction
