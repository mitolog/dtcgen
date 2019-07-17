#!/bin/bash

## thanks to:
# https://github.com/konifar/sketch-export-sample
## 

set -xeu

[[ -x /Applications/Sketch.app/Contents/Resources/sketchtool/bin/sketchtool ]] && exit 0

curl -L -o sketch.zip http://www.sketchapp.com/static/download/sketch.zip
unzip -qo sketch.zip
mv Sketch.app /Applications/Sketch.app