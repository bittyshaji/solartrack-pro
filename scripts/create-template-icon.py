#!/usr/bin/env python3
"""
Create a template icon for SolarTrack Pro
Generates a simple sun + solar panel icon in orange and white
"""

import sys
from pathlib import Path

try:
    from PIL import Image, ImageDraw
except ImportError:
    print("ERROR: Pillow not installed")
    print("Install with: pip install Pillow --break-system-packages")
    sys.exit(1)

def create_template_icon(size=512):
    """Create a template icon for SolarTrack Pro"""

    # Create image with white background
    img = Image.new('RGBA', (size, size), (255, 255, 255, 255))
    draw = ImageDraw.Draw(img)

    # Colors
    orange = (249, 115, 22, 255)  # #f97316
    white = (255, 255, 255, 255)
    dark_orange = (194, 65, 12, 255)  # Darker orange for details

    # Padding
    padding = size // 10
    content_size = size - (padding * 2)

    # Draw orange circular background
    circle_bbox = [padding, padding, padding + content_size, padding + content_size]
    draw.ellipse(circle_bbox, fill=orange)

    # Draw sun rays (simplified)
    center = size // 2
    inner_radius = content_size // 4
    outer_radius = content_size // 2.8

    # Draw 8 rays around the circle
    for angle in range(0, 360, 45):
        import math
        rad = math.radians(angle)
        x1 = center + math.cos(rad) * inner_radius
        y1 = center + math.sin(rad) * inner_radius
        x2 = center + math.cos(rad) * outer_radius
        y2 = center + math.sin(rad) * outer_radius
        draw.line([(x1, y1), (x2, y2)], fill=white, width=max(2, size // 64))

    # Draw sun circle (white)
    sun_size = content_size // 3.5
    sun_bbox = [
        center - sun_size,
        center - sun_size,
        center + sun_size,
        center + sun_size
    ]
    draw.ellipse(sun_bbox, fill=white)

    # Draw solar panel pattern inside sun
    panel_size = sun_size // 3
    panel_padding = sun_size // 4

    # 2x2 grid of solar panel cells
    for row in range(2):
        for col in range(2):
            x = center - sun_size + panel_padding + (col * panel_size * 1.5)
            y = center - sun_size + panel_padding + (row * panel_size * 1.5)
            cell_bbox = [x, y, x + panel_size, y + panel_size]
            draw.rectangle(cell_bbox, fill=dark_orange, outline=orange, width=1)

    return img

def main():
    """Create and save template icon"""
    print("=" * 50)
    print("🎨 Creating Template Icon for SolarTrack Pro")
    print("=" * 50)

    # Create 512x512 template
    print("\n📐 Creating 512x512 template icon...")
    img = create_template_icon(512)

    # Save as source-icon.png
    output_path = Path('source-icon.png')
    img.save(output_path, 'PNG')

    file_size = output_path.stat().st_size / 1024
    print(f"✅ Template created: {output_path}")
    print(f"   Size: 512x512 pixels")
    print(f"   File size: {file_size:.1f} KB")

    # Instructions
    print("\n" + "=" * 50)
    print("📋 NEXT STEPS:")
    print("=" * 50)
    print("""
1. Use this template as-is:
   - Run: python scripts/generate-icons.py
   - All icons will be generated

2. Or customize the template:
   - Edit this script to change colors
   - Change colors in create_template_icon():
     * orange = (249, 115, 22, 255)
     * white = (255, 255, 255, 255)
     * dark_orange = (194, 65, 12, 255)

3. Or replace with your own icon:
   - Create your 512x512 PNG icon
   - Name it: source-icon.png
   - Run: python scripts/generate-icons.py

4. Then generate all sizes:
   - python scripts/generate-icons.py
   - All 8 icon sizes will be created
   - Ready to test and deploy!
""")

if __name__ == '__main__':
    main()
