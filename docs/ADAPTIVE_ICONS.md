# Android Adaptive Icon Setup

This document describes the Android adaptive icon implementation for YellowClubApp.

## Overview

Android adaptive icons were introduced in Android 8.0 (API level 26) and allow app icons to be displayed in different shapes across different device models. The system provides two layers:
- **Background layer**: A solid color or drawable
- **Foreground layer**: The app icon with transparency

The system automatically applies the appropriate mask (circle, squircle, rounded square, etc.) based on the device manufacturer's preferences.

## Generated Assets

### Base Assets (`assets/`)

1. **app-icon.png** (1024×1024)
   - The original/base app icon at high resolution
   - Source for generating all other icon variants

2. **app-icon-foreground.png** (1024×1024)
   - Foreground layer with transparency
   - Icon content is 624×624px centered (respects 61% safe zone)
   - 200px padding on all sides to prevent cropping

3. **app-icon-background.png** (1024×1024)
   - Background layer with solid color `#F4C542` (yellow/gold)
   - Provides consistent background across all launcher shapes

### Android Mipmap Resources

For each density (mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi), the following files are generated in `android/app/src/main/res/mipmap-{density}/`:

1. **ic_launcher.png**
   - Legacy launcher icon (fallback for Android < 8.0)
   - Composite of foreground over background
   - Sizes: 48×48 (mdpi), 72×72 (hdpi), 96×96 (xhdpi), 144×144 (xxhdpi), 192×192 (xxxhdpi)

2. **ic_launcher_foreground.png**
   - Foreground layer at density-specific size
   - Used by adaptive icon system on Android 8.0+

3. **ic_launcher_background.png**
   - Background layer at density-specific size
   - Used by adaptive icon system on Android 8.0+

### Adaptive Icon XML Configuration

Located in `android/app/src/main/res/mipmap-anydpi-v26/`:

1. **ic_launcher.xml**
   ```xml
   <?xml version="1.0" encoding="utf-8"?>
   <adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
       <background android:drawable="@mipmap/ic_launcher_background"/>
       <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
   </adaptive-icon>
   ```

2. **ic_launcher_round.xml**
   - Same configuration as ic_launcher.xml
   - Used for devices that prefer round icons

## Regenerating Icons

To regenerate all icon assets, run:

```bash
npm install --save-dev sharp
node scripts/generate-adaptive-icons.js
```

The script will:
1. Create base app-icon.png from existing launcher icon
2. Generate adaptive icon layers (foreground and background)
3. Create density-specific mipmap resources
4. Generate XML configuration files
5. Verify all required files exist

## Build Cleanup Instructions

After modifying icons, clean the build cache to ensure changes are reflected:

### Windows (PowerShell)

```powershell
# Clean Android build cache
cd android
.\gradlew clean
cd ..

# Clean Metro bundler cache
npx react-native start --reset-cache

# Rebuild and run on Android
npx react-native run-android
```

### macOS/Linux (Bash)

```bash
# Clean Android build cache
cd android
./gradlew clean
cd ..

# Clean Metro bundler cache
npx react-native start --reset-cache

# Rebuild and run on Android
npx react-native run-android
```

## Design Guidelines

### Safe Zone

Android adaptive icons use a safe zone to ensure the icon is visible regardless of the mask shape applied:
- **Safe zone**: Center 66×66dp circle (approximately 61% of the icon size)
- **Foreground content**: Should stay within 624×624px of the 1024×1024 canvas
- **Padding**: 200px on all sides ensures content isn't cropped

### Color Scheme

- **Background color**: `#F4C542` (yellow/gold)
- This color provides good contrast and matches the app's branding

### Testing Different Shapes

Test your adaptive icon on different launcher shapes:
- **Circle**: Most restrictive, shows ~66% of the icon
- **Squircle**: Rounded corners with more content visible
- **Rounded Square**: Shows more content than circle
- **Teardrop**: Unique to some devices

## Compatibility

- **Android 8.0+ (API 26+)**: Uses adaptive icon system with foreground/background layers
- **Android 7.1 and below**: Uses legacy ic_launcher.png files
- All Android versions are supported with appropriate fallbacks

## File Structure

```
YellowClubApp/
├── assets/
│   ├── app-icon.png                    # Base icon (1024×1024)
│   ├── app-icon-foreground.png         # Foreground layer (1024×1024)
│   └── app-icon-background.png         # Background layer (1024×1024)
├── android/app/src/main/res/
│   ├── mipmap-anydpi-v26/
│   │   ├── ic_launcher.xml             # Adaptive icon config
│   │   └── ic_launcher_round.xml       # Round adaptive icon config
│   ├── mipmap-mdpi/                    # 48×48px icons
│   ├── mipmap-hdpi/                    # 72×72px icons
│   ├── mipmap-xhdpi/                   # 96×96px icons
│   ├── mipmap-xxhdpi/                  # 144×144px icons
│   └── mipmap-xxxhdpi/                 # 192×192px icons
└── scripts/
    └── generate-adaptive-icons.js      # Icon generation script
```

## References

- [Android Adaptive Icons Guide](https://developer.android.com/guide/practices/ui_guidelines/icon_design_adaptive)
- [Material Design Icon Guidelines](https://material.io/design/iconography/product-icons.html)
