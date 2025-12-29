#!/bin/bash

# Smoke Test Script
# Issue #42: Quick validation script for deployment readiness
#
# Usage:
#   ./scripts/smoke-test.sh          # Run smoke tests
#   ./scripts/smoke-test.sh --headed # Run with browser visible
#   ./scripts/smoke-test.sh --ci     # Run in CI mode (no retries)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}  Photo Management Smoke Tests${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""

# Parse arguments
HEADED=""
CI_MODE=""
for arg in "$@"; do
  case $arg in
    --headed)
      HEADED="--headed"
      ;;
    --ci)
      CI_MODE="--retries=0"
      ;;
  esac
done

# Check if dev server is running
check_server() {
  local port=${1:-3000}
  if curl -s "http://localhost:$port" > /dev/null 2>&1; then
    return 0
  else
    return 1
  fi
}

# Find available port
find_port() {
  for port in 3000 3001 3002 3003; do
    if check_server $port; then
      echo $port
      return 0
    fi
  done
  echo ""
  return 1
}

# Check for running server
RUNNING_PORT=$(find_port)

if [ -z "$RUNNING_PORT" ]; then
  echo -e "${YELLOW}No dev server detected. Starting server...${NC}"

  # Start dev server in background
  npm run dev &
  DEV_PID=$!

  # Wait for server to be ready
  echo -e "${BLUE}Waiting for server to start...${NC}"
  for i in {1..30}; do
    if check_server 3000; then
      echo -e "${GREEN}Server started on port 3000${NC}"
      RUNNING_PORT=3000
      break
    fi
    sleep 1
  done

  if [ -z "$RUNNING_PORT" ]; then
    echo -e "${RED}Failed to start dev server${NC}"
    exit 1
  fi

  STARTED_SERVER=true
else
  echo -e "${GREEN}Dev server detected on port $RUNNING_PORT${NC}"
  STARTED_SERVER=false
fi

echo ""
echo -e "${BLUE}Running smoke tests...${NC}"
echo ""

# Set the base URL
export BASE_URL="http://localhost:$RUNNING_PORT"

# Run smoke tests
npx playwright test __tests__/e2e/smoke.spec.ts $HEADED $CI_MODE --reporter=list

TEST_RESULT=$?

# Cleanup if we started the server
if [ "$STARTED_SERVER" = true ]; then
  echo ""
  echo -e "${BLUE}Stopping dev server...${NC}"
  kill $DEV_PID 2>/dev/null || true
fi

echo ""
if [ $TEST_RESULT -eq 0 ]; then
  echo -e "${GREEN}=====================================${NC}"
  echo -e "${GREEN}  All smoke tests passed!${NC}"
  echo -e "${GREEN}=====================================${NC}"
else
  echo -e "${RED}=====================================${NC}"
  echo -e "${RED}  Some smoke tests failed${NC}"
  echo -e "${RED}=====================================${NC}"
fi

exit $TEST_RESULT
