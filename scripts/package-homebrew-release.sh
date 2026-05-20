#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VERSION="$(node -p "require('${ROOT_DIR}/package.json').version")"
UNAME_ARCH="$(uname -m)"

case "${UNAME_ARCH}" in
  arm64|aarch64)
    RELEASE_ARCH="arm64"
    ;;
  x86_64|amd64)
    RELEASE_ARCH="x64"
    ;;
  *)
    echo "Unsupported macOS architecture: ${UNAME_ARCH}" >&2
    exit 1
    ;;
esac

APP_NAME="终极融合 PPT 大师.app"
BUNDLE_DIR="${ROOT_DIR}/apps/desktop/src-tauri/target/release/bundle/macos"
APP_PATH="${BUNDLE_DIR}/${APP_NAME}"
RELEASE_DIR="${ROOT_DIR}/dist/release"
ARTIFACT="Ultimate-PPT-Master-${VERSION}-macOS-${RELEASE_ARCH}.zip"

cd "${ROOT_DIR}"
npm run package:desktop

if [ ! -d "${APP_PATH}" ]; then
  echo "Expected app bundle not found: ${APP_PATH}" >&2
  exit 1
fi

mkdir -p "${RELEASE_DIR}"
rm -f "${RELEASE_DIR}/${ARTIFACT}" "${RELEASE_DIR}/SHA256SUMS.txt"

ditto -c -k --sequesterRsrc --keepParent "${APP_PATH}" "${RELEASE_DIR}/${ARTIFACT}"
(
  cd "${RELEASE_DIR}"
  shasum -a 256 "${ARTIFACT}" > SHA256SUMS.txt
)

echo "Created ${RELEASE_DIR}/${ARTIFACT}"
cat "${RELEASE_DIR}/SHA256SUMS.txt"
