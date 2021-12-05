#!/bin/bash

## thanks to:
# https://github.com/konifar/sketch-export-sample
## 

set -xeu

[[ -x /Applications/Sketch.app/Contents/MacOS/sketchtool ]] && exit 0

curl -L -o sketch.zip https://download.sketch.com/sketch-80.1-134476.zip
unzip -qo sketch.zip
mv Sketch.app /Applications/Sketch.app