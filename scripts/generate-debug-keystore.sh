#!/usr/bin/env bash
# Personal sideload only: shared debug keystore so APK updates install in-place.
# Do NOT use for Play Store or secrets — anyone with this repo can sign the same APK.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
KEYSTORE="$ROOT/android/quit-tracker-debug.keystore"
if [[ -f "$KEYSTORE" ]]; then
  echo "keystore exists: $KEYSTORE"
  exit 0
fi
keytool -genkeypair -v \
  -keystore "$KEYSTORE" \
  -storepass quittracker \
  -alias quittracker \
  -keypass quittracker \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -dname "CN=Quit Tracker Debug, OU=Personal, O=Silvio, L=Local, ST=NA, C=US"
echo "created $KEYSTORE"
