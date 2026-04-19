#!/bin/bash

echo "========================================="
echo "PHASE 3 MIGRATION VERIFICATION"
echo "========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

ERRORS=0

# Check service directories
echo "Checking service directory structure..."
SERVICE_DIRS=(
  "src/lib/services/projects"
  "src/lib/services/customers"
  "src/lib/services/emails"
  "src/lib/services/invoices"
  "src/lib/services/materials"
  "src/lib/services/proposals"
  "src/lib/services/operations"
  "src/lib/services/site-survey"
  "src/lib/services/kseb"
  "src/lib/services/finance"
  "src/lib/services/staff"
  "src/lib/services/notifications"
  "src/lib/services/photos"
  "src/lib/services/tasks"
  "src/lib/services/teams"
  "src/lib/services/warranty"
)

for dir in "${SERVICE_DIRS[@]}"; do
  if [ -d "$dir" ]; then
    echo -e "${GREEN}✓${NC} $dir exists"
  else
    echo -e "${RED}✗${NC} $dir MISSING"
    ERRORS=$((ERRORS + 1))
  fi
done

echo ""
echo "Checking logger directory structure..."
LOGGER_FILES=(
  "src/lib/logger/logger.js"
  "src/lib/logger/errorTracking.js"
  "src/lib/logger/index.js"
  "src/lib/logger/storage/logStorage.js"
  "src/lib/logger/storage/index.js"
)

for file in "${LOGGER_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo -e "${GREEN}✓${NC} $file exists"
  else
    echo -e "${RED}✗${NC} $file MISSING"
    ERRORS=$((ERRORS + 1))
  fi
done

echo ""
echo "Checking index.js files..."
INDEX_FILES=(
  "src/lib/services/index.js"
  "src/lib/services/projects/index.js"
  "src/lib/services/customers/index.js"
  "src/lib/services/emails/index.js"
  "src/lib/services/invoices/index.js"
  "src/lib/services/materials/index.js"
  "src/lib/services/proposals/index.js"
  "src/lib/services/operations/index.js"
)

for file in "${INDEX_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo -e "${GREEN}✓${NC} $file exists"
  else
    echo -e "${RED}✗${NC} $file MISSING"
    ERRORS=$((ERRORS + 1))
  fi
done

echo ""
echo "Checking compatibility wrappers..."
COMPAT_FILES=(
  "src/lib/projectService.js"
  "src/lib/customerService.js"
  "src/lib/emailService.js"
  "src/lib/logger.js"
)

for file in "${COMPAT_FILES[@]}"; do
  if [ -f "$file" ]; then
    if grep -q "DEPRECATED" "$file"; then
      echo -e "${GREEN}✓${NC} $file exists (with deprecation)"
    else
      echo -e "${RED}✗${NC} $file exists (NO deprecation warning)"
      ERRORS=$((ERRORS + 1))
    fi
  else
    echo -e "${RED}✗${NC} $file MISSING"
    ERRORS=$((ERRORS + 1))
  fi
done

echo ""
echo "Checking vite.config.js aliases..."
if grep -q "@/services" vite.config.js && grep -q "@/logger" vite.config.js; then
  echo -e "${GREEN}✓${NC} vite.config.js has @/services and @/logger aliases"
else
  echo -e "${RED}✗${NC} vite.config.js missing aliases"
  ERRORS=$((ERRORS + 1))
fi

echo ""
if [ $ERRORS -eq 0 ]; then
  echo -e "${GREEN}=========================================${NC}"
  echo -e "${GREEN}ALL CHECKS PASSED ✓${NC}"
  echo -e "${GREEN}=========================================${NC}"
  exit 0
else
  echo -e "${RED}=========================================${NC}"
  echo -e "${RED}ERRORS FOUND: $ERRORS${NC}"
  echo -e "${RED}=========================================${NC}"
  exit 1
fi
