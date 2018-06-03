#!/usr/bin/env bash

# Deploy API
# ssh 35.188.26.165 "cd ytdl && git pull && yarn"

# Build and deploy client
REACT_APP_SOCKET_URL=https://live.videokeeper.app yarn build
aws s3 sync build/ s3://videokeeper.app