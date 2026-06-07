#!/bin/bash
while true; do
  cd /home/z/my-project
  bun run dev 2>&1 | tee -a dev.log
  echo "Server died, restarting in 5 seconds..." >> dev.log
  sleep 5
done
