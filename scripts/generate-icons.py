#!/usr/bin/env python3
"""
Icon Generator for SolarTrack Pro PWA
Generates all required icon sizes from a source image
"""

import os
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("ERROR: Pillow not installed")
    print("Install with: pip install Pillow --break-system-packages")
    sys.exit(1)

# Define required icon sizes
ICON_SIZES = [
    (72, 72),
    (96, 96),
    (128, 128),
    (144, 144),
    (152, 152),
    (192, 192),
    (384, 384),
    (512, 512),
]

def get_source_image(custom_path=None):
    """Find and return source image"""
    # Default paths to check
    default_paths = [
        Path('source-icon.png'),
        Path('logo.png'),
        Path('icon.png'),
        Path('app-icon.png'),
    ]

    if custom_path:
        path = Path(custom_path)
        if not path.exists():
            print(f"ERROR: Source image not found: {path}")
            sys.exit(1)
        return path

    for path in default_paths:
        if path.exists():
            print(f"✅ Found source image: {path}")
            return path

    print("ERROR: No source image found")
    print("\nPlace your icon image in one of these locations:")
    for path in default_paths:
        print(f"  - {path}")
    print("\nUsage: python scripts/generate-icons.py --source /path/to/icon.png")
    sys.exit(1)

def create_output_directory():
    """Create output directory if it doesn't exist"""
    output_dir = Path('public/icons')
    output_dir.mkdir(parents=True, exist_ok=True)
    print(f"✅ Output directory: {output_dir}")
    return output_dir

def generate_icons(source_path, output_dir):
    """Generate all icon sizes"""
    try:
        # Open source image
        source = Image.open(source_path)

        # Convert to RGBA if needed (to handle transparency)
        if source.mode != 'RGBA':
            source = source.convert('RGBA')

        print(f"📸 Source image: {source.size[0]}x{source.size[1]}")

        # Generate each size
        generated = []
        failed = []

        for size in ICON_SIZES:
            try:
                # Resize with high quality
                icon = source.resize(size, Image.Resampling.LANCZOS)

                # Save as PNG
                filename = f'icon-{size[0]}x{size[1]}.png'
                filepath = output_dir / filename
                icon.save(filepath, 'PNG', optimize=True)

                file_size = filepath.stat().st_size / 1024  # KB
                print(f"✅ Generated: {filename} ({file_size:.1f} KB)")
                generated.append(filename)
            except Exception as e:
                error_msg = f"icon-{size[0]}x{size[1]}.png"
                print(f"❌ Failed: {error_msg} - {str(e)}")
                failed.append(error_msg)

        # Summary
        print(f"\n📊 Summary:")
        print(f"   Generated: {len(generated)}/{len(ICON_SIZES)}")
        if failed:
            print(f"   Failed: {len(failed)}")
            for f in failed:
                print(f"     - {f}")
        else:
            print(f"   ✅ All icons generated successfully!")

        return len(failed) == 0

    except Exception as e:
        print(f"ERROR: Failed to process image: {str(e)}")
        return False

def verify_icons(output_dir):
    """Verify all icons were created"""
    print(f"\n🔍 Verifying icons...")
    all_exist = True
    total_size = 0

    for size in ICON_SIZES:
        filename = f'icon-{size[0]}x{size[1]}.png'
        filepath = output_dir / filename

        if filepath.exists():
            file_size = filepath.stat().st_size / 1024
            total_size += file_size
            print(f"   ✅ {filename}")
        else:
            print(f"   ❌ {filename} - MISSING")
            all_exist = False

    if all_exist:
        print(f"\n✅ All icons verified!")
        print(f"   Total size: {total_size:.1f} KB")
        print(f"   Location: {output_dir}")
        return True
    else:
        print(f"\n⚠️  Some icons are missing!")
        return False

def main():
    """Main execution"""
    print("=" * 50)
    print("🎨 SolarTrack Pro Icon Generator")
    print("=" * 50)

    # Parse arguments
    source_path = None
    if len(sys.argv) > 1:
        if sys.argv[1] == '--source' and len(sys.argv) > 2:
            source_path = sys.argv[2]
        else:
            print(f"Usage: python scripts/generate-icons.py [--source /path/to/icon.png]")
            sys.exit(1)

    # Find source image
    print("\n📁 Finding source image...")
    source = get_source_image(source_path)

    # Create output directory
    print("\n📁 Creating output directory...")
    output_dir = create_output_directory()

    # Generate icons
    print("\n🎨 Generating icons...")
    success = generate_icons(source, output_dir)

    # Verify
    if success:
        verify_icons(output_dir)

    # Instructions
    print("\n" + "=" * 50)
    print("📋 NEXT STEPS:")
    print("=" * 50)
    print("""
1. Verify icons look correct:
   - Open public/icons/ folder
   - Check icon at 192x192 (most important)
   - Check icon at 512x512 (splash screens)

2. Test installation:
   - Run: npm run dev
   - Open app in browser
   - Click install button
   - Verify icon appears on home screen

3. Check manifest.json:
   - Verify paths are: /icons/icon-XXxXX.png
   - All icon entries present
   - Sizes match filenames

4. Ready to deploy!
   - Follow PHASE3C_TESTING_DEPLOYMENT.md
""")

    sys.exit(0 if success else 1)

if __name__ == '__main__':
    main()
