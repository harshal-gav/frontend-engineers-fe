#!/bin/bash

while true; do
  node scripts/linkedin-scraper.js
  exit_code=$?
  
  if [ $exit_code -eq 0 ]; then
    echo "🎉 Scraping finished completely!"
    break
  fi
  
  echo "⚠️ Scraper crashed or was closed (Exit code: $exit_code). Restarting in 5 seconds..."
  sleep 5
done
