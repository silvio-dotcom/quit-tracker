#!/usr/bin/env bash
# Install SDK platforms for CI. Prefer API 37 (Android 17) when AGP resolves android-37.
set -euo pipefail
SDK="${ANDROID_SDK_ROOT:-${ANDROID_HOME:-}}"
if [[ -z "$SDK" ]]; then
  echo "Set ANDROID_SDK_ROOT or ANDROID_HOME"
  exit 1
fi
export PATH="$SDK/cmdline-tools/latest/bin:$PATH"
sdkmanager "platforms;android-37.0" "platforms;android-36" "build-tools;35.0.0"
PLAT="$SDK/platforms"
if [[ -d "$PLAT/android-37.0" && ! -d "$PLAT/android-37" ]]; then
  mv "$PLAT/android-37.0" "$PLAT/android-37"
fi
echo "SDK platforms:" && ls "$PLAT"
