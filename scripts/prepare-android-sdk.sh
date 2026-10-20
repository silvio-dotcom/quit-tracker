#!/usr/bin/env bash
# Use the preinstalled Android SDK on GitHub ubuntu-latest (no setup-android action).
set -euo pipefail

SDK="${ANDROID_SDK_ROOT:-${ANDROID_HOME:-/usr/local/lib/android/sdk}}"
export ANDROID_SDK_ROOT="$SDK"
export ANDROID_HOME="$SDK"

SDKMANAGER=""
for cand in \
  "$SDK/cmdline-tools/latest/bin/sdkmanager" \
  "$SDK/cmdline-tools/bin/sdkmanager"; do
  if [[ -x "$cand" ]]; then
    SDKMANAGER="$cand"
    break
  fi
done
if [[ -z "$SDKMANAGER" ]] && command -v sdkmanager >/dev/null 2>&1; then
  SDKMANAGER="$(command -v sdkmanager)"
fi

if [[ -z "$SDKMANAGER" ]]; then
  echo "sdkmanager not found under $SDK"
  ls -la "$SDK" 2>/dev/null || true
  ls -la "$SDK/cmdline-tools" 2>/dev/null || true
  exit 1
fi

export PATH="$(dirname "$SDKMANAGER"):$SDK/platform-tools:$PATH"
echo "Using sdkmanager: $SDKMANAGER"

yes | "$SDKMANAGER" --sdk_root="$SDK" --licenses >/dev/null || true

"$SDKMANAGER" --sdk_root="$SDK" "platforms;android-36" "build-tools;36.0.0"

# Optional API 37 (Android 17); non-fatal for compileSdk 36 builds.
if ! "$SDKMANAGER" --sdk_root="$SDK" "platforms;android-37.0"; then
  echo "Optional platforms;android-37.0 install skipped - non-fatal."
fi

PLAT="$SDK/platforms"
if [[ -d "$PLAT/android-37.0" && ! -d "$PLAT/android-37" ]]; then
  mv "$PLAT/android-37.0" "$PLAT/android-37" || echo "Could not alias android-37.0 to android-37 - non-fatal."
fi

echo "Installed platforms:"
ls -1 "$PLAT" 2>/dev/null || true
