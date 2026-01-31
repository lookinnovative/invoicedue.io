#!/usr/bin/env bash

set -e

echo "?? InvoiceDue Production Deployment"
echo "----------------------------------"

if [ ! -f "package.json" ]; then
  echo "? Error: package.json not found. Run this script from the project root."
  exit 1
fi

echo ""
read -p "??  You are about to deploy to PRODUCTION using 'vercel --prod'. Continue? (y/N): " confirm

if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
  echo "? Deployment cancelled."
  exit 0
fi

echo ""
echo "? Deploying to Vercel PRODUCTION..."
echo ""

if ! command -v vercel &> /dev/null; then
  echo "?? Vercel CLI not found. Installing globally..."
  npm install -g vercel
fi

vercel --prod

echo ""
echo "?? Deployment complete."
echo "?? Reminder: All production fixes MUST be validated on the live URL."
