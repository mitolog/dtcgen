[![Build Status](https://travis-ci.org/Innovatube/dtcgen.svg?branch=master)](https://travis-ci.org/Innovatube/dtcgen)

<h1 align="center">Dtcgen</h1>

A CLI tool where you can generate asset catalog(Asset.xcassets) for iOS project from Sketch and Figma.

![](https://raw.githubusercontent.com/wiki/Innovatube/dtcgen/images/cli_screenshot.png)

[readme in Japanese](https://github.com/Innovatube/dtcgen/wiki/readmeJp).

For example, these icons will be like...
![](https://raw.githubusercontent.com/wiki/Innovatube/dtcgen/images/readme_icons_on_figma.png)

this asset catalog.
![](https://raw.githubusercontent.com/wiki/Innovatube/dtcgen/images/readme_icons_on_xcode.png)

If you set `sliceAllImages` flag in config file, you can also extract all images within Sketch/Figma as `png` file.

`dtcgen` uses [Namespace](https://developer.apple.com/library/archive/documentation/Xcode/Reference/xcode_ref-Asset_Catalog_Format/FolderStructure.html#//apple_ref/doc/uid/TP40015170-CH33-SW4) as default, so you can retrieve assets in your source code like this:

```swift
// without R.swift
let hotelIcon = UIImage(named: "DtcGenerated/Icons/Hotel")
let hotelImage = UIIMage(named: "DtcGenerated/Images/Hotel")

// with R.swift
let hotelIcon: UIImage? = R.image.dtcGenerated.icons.hotel()
let hotelImage: UIImage? = R.image.dtcGenerated.images.hotel()
```

FYI: [R.swift](https://github.com/mac-cain13/R.swift)

# Install

```zsh
# Create favorable directory and cd there (so called `project-root`)
$ mkdir yourDir && cd ./yourDir

# Check if node.js is higher than v8.9.0. If not, update it.
# nodenv will be better.
$ node -v

yarn global add dtcgen
# or
npm install -g dtcgen
```

# How to use

```zsh
# For Sketch (`--input` option is required)
dtcgen slice --tool sketch --input "./sample.sketch"

# For Figma
dtcgen slice --tool figma

# help
dtcgen slice --help

# version
dtcgen -v
```

※ If you have installed locally, prepend `npx` before `dtcgen`.

# Preparation

## Check if design file fulfills conditions

### Sketch

Materials you want to extract shuold be:

- Symbol
- Sliced with [slice tool](https://www.sketch.com/docs/exporting/slices/)

### Figma

Materials you want to extract shuold be:

- Component

### Include keywords within Symbol/Component name

Let's say you want to extract icon files, you can prepend keyword `Icons /` for each symbols/components. so it looks like `Icons / Search`.

Spaces will be eliminated on generating assets like this: `Icons/Search`.

Then, **`/` is treated as folder on generation.**

## Create and set .env file

On your project-root that you create at first step of installation, create `.env` file, then confirm and set environmental variable properly.

1. You can create `.env` file with 2 ways：

- Copy `.env.default` from dtcgen package
- Copy from [github repository](https://github.com/Innovatube/dtcgen/blob/master/.env.default)

2. Set some variables within `.env` file. How to get these are explained later.
   - For Sketch：`SKETCH_TOOL_PATH` is required
   - For Figma：`FIGMA_FILE_KEY` and `FIGMA_ACCESS_TOKEN` are required

As a default, `.env` file looks like：

```bash
#### settings in common ####
# relative path from where the command executed or absolute path. if not found, lookup upper dir upto top directry of your file system.
CONFIG_PATH="./dtc.config.json"

# relative path from where the command executed or absolute path
TEMPLATE_DIR="./templates"

# relative path from where the command executed or absolute path
OUTPUT_PATH="./outputs"

#### Sketch related ####
# sketch tool's path https://developer.sketchapp.com/guides/sketchtool/
# must be absolute path
SKETCH_TOOL_PATH="/Applications/Sketch.app/Contents/Resources/sketchtool/bin/sketchtool"

#### Figma related ####
# file id of target figma file, you can get it from figma url like below:
# https://www.figma.com/file/{{FILE_KEY}}/sample_for_test
FIGMA_FILE_KEY="FILE_KEY_HERE"

# access token for the file above, refer link below
# https://www.figma.com/developers/docs#authentication
FIGMA_ACCESS_TOKEN="ACCESS_TOKEN_HERE"
```

### CONFIG_PATH

`CONFIG_PATH` is a path to the config file.
The Path can be relative path from project-root, or can be absolute path.
Then, file type should be json.

### TEMPLATE_DIR

If a directory set for `TEMPLATE_DIR` exists, dtcgen uses that directory. If it's empty, it raises an error.

If a directory set for `TEMPLATE_DIR` doesn't exist, dtcgen copies default templates into that directory.

This can be also relative path from project-root, or can be absolute path.

### OUTPUT_PATH

This is a directory where you want to output all extracted/generated files.
If the directory doesn't exist, dtcgen create it.

## Prepare needed info to access design files

### Sketch

You need to [insatll Sketch.app](https://www.sketch.com/get/) beforehand.
[`sketchtool`](https://developer.sketchapp.com/guides/sketchtool/) cli included within Sketch.app is required to use `dtcgen`.

Even if it's not activated(or lisence expired), it would work.
If something wrong, please let us know or your help will be very appreciated.

Set absolute path to the `sketchtool` as **SKETCH_TOOL_PATH** on `.env` file.
As default, **SKETCH_TOOL_PATH** is set assuming you placed Sketch.app just under `Application` directory.

### Figma

- **FIGMA_FILE_KEY**: `https://www.figma.com/file/{{FILE_KEY}}/sample_for_test` use key corresponding to `{{FILE_KEY}}`
- **FIGMA_ACCESS_TOKEN**: You can get one via account setting. More Detail is on [Official document](https://www.figma.com/developers/docs#authentication).

## Create and set `dtc.config.json`

Create `dtc.config.json` under the project-root.
(You can change the name or directory on `.env` file)

```json:dtc.config.json
{
  "sketch": {
    "slice": {
      "caseSensitive": true,
      "keywords": ["Icons"],
      "extension": "PDF",
      "sliceAllImages": true,
      "scales": [1, 2, 3]
    }
  },
  "figma": {
    "slice": {
      "caseSensitive": true,
      "keywords": ["Icons"],
      "extension": "PNG",
      "sliceAllImages": true,
      "scales": [1, 2, 3]
    }
  }
}
```

You can set parameters to each design tool. Settable Parameters are as below：

- caseSensitive: boolean set true if you want keyword to be case sensitive
- keywords: string[] you can set multiple keywords within symbols'/components' name
- extension: string file extension that you can extract. currently supporting [pdf/svg/png].
- sliceAllImages: boolean set true if yoou want to extract all images within design file.
- scales: number[] set scales you want to extract. but it's valid only on 'png' extension.

numbers that you can specify to scales are as below：

|        | scales  |
| ------ | ------- |
| figma  | 0.1 - 4 |
| sketch | 1 - x   |

# todos

## dtcgen slice

- [x] run test on PR with travis CI
- [x] scale setting for png extraction
- [ ] output command execution status with console.log
- [ ] CI integration(When using Sketch, runnning machine should be macOS)
- [ ] make this command as figma plugin
- [ ] android version

## other todos/future plan

- [ ] prepare `dtcgen init` command for initializing `.env`, `dtc.config.json`.
- [ ] bump up to eslint from tslint
- [ ] color palette extraction / generation
- [ ] layout related source code generation with swiftUI

# Contribution

If any questions or issues araises, feel free to [add new issue](https://github.com/Innovatube/dtcgen/issues).

## LICENSE

apache2.0
