#!/bin/sh
# Same launcher as Launch OBS Themed.app — use either one.
DIR=$(cd "$(dirname "$0")" && pwd)
APP="$DIR/Launch OBS Themed.app"
if [ -d "$APP" ]; then
  exec open "$APP"
fi
exec "$DIR/Launch OBS Themed.app/Contents/MacOS/launcher"
