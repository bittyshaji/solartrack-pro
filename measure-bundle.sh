#!/bin/bash

echo "=== BUNDLE SIZE ANALYSIS ==="
echo ""
echo "Current Date: $(date)"
echo "Build Date: $(stat -c %y dist/ | cut -d' ' -f1)"
echo ""

# Function to format bytes
format_size() {
    local bytes=$1
    if [ $bytes -ge 1048576 ]; then
        echo "$(( bytes / 1048576 )).$((( bytes % 1048576 ) * 10 / 1048576 ))M"
    elif [ $bytes -ge 1024 ]; then
        echo "$(( bytes / 1024 ))K"
    else
        echo "${bytes}B"
    fi
}

# Function to get file size and gzip it
analyze_file() {
    local file=$1
    if [ -f "$file" ]; then
        local original=$(wc -c < "$file")
        local gzipped=$(gzip -c "$file" | wc -c)
        local ratio=$(( 100 - (100 * gzipped / original) ))
        local orig_kb=$((original / 1024))
        local gzip_kb=$((gzipped / 1024))
        
        printf "%-50s %6d KB  →  %5d KB  (%.0f%% compression)\n" \
            "$(basename $file)" "$orig_kb" "$gzip_kb" "$ratio"
    fi
}

echo "INDIVIDUAL FILES:"
echo "=================================================="
find dist/assets -name "*.js" -o -name "*.css" | sort | while read file; do
    analyze_file "$file"
done

echo ""
echo "TOTALS:"
echo "=================================================="

# Calculate total sizes
total_js=$(find dist/assets -name "*.js" -exec wc -c {} + 2>/dev/null | tail -1 | awk '{print $1}')
total_css=$(find dist/assets -name "*.css" -exec wc -c {} + 2>/dev/null | tail -1 | awk '{print $1}')
total_all=$((total_js + total_css))

total_js_gz=$(find dist/assets -name "*.js" -exec gzip -c {} \; 2>/dev/null | wc -c)
total_css_gz=$(find dist/assets -name "*.css" -exec gzip -c {} \; 2>/dev/null | wc -c)
total_all_gz=$((total_js_gz + total_css_gz))

js_ratio=$(( 100 - (100 * total_js_gz / total_js) ))
css_ratio=$(( 100 - (100 * total_css_gz / total_css) ))
all_ratio=$(( 100 - (100 * total_all_gz / total_all) ))

printf "%-50s %6d KB  →  %5d KB  (%.0f%% compression)\n" "TOTAL JS FILES" "$((total_js / 1024))" "$((total_js_gz / 1024))" "$js_ratio"
printf "%-50s %6d KB  →  %5d KB  (%.0f%% compression)\n" "TOTAL CSS FILES" "$((total_css / 1024))" "$((total_css_gz / 1024))" "$css_ratio"
printf "%-50s %6d KB  →  %5d KB  (%.0f%% compression)\n" "TOTAL (JS + CSS)" "$((total_all / 1024))" "$((total_all_gz / 1024))" "$all_ratio"

echo ""
echo "ENTIRE DIST FOLDER:"
echo "=================================================="
du -sh dist/

echo ""
echo "DISTRIBUTION:"
echo "=================================================="
du -sh dist/assets/
du -sh dist/*.js
du -sh dist/*.html

