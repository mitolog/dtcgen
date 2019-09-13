[![Build Status](https://travis-ci.org/Innovatube/dtcgen.svg?branch=master)](https://travis-ci.org/Innovatube/dtcgen)

<h1 align="center">Dtcgen</h1>

A CLI tool where you can generate asset catalog(Asset.xcassets) for iOS project from both [Sketch](https://www.sketch.com/) and [Figma](https://www.figma.com).

![](https://raw.githubusercontent.com/wiki/Innovatube/dtcgen/images/cli_screenshot.png)

## Changelog

If you update from previous version, better to take a look at changelog.
https://github.com/Innovatube/dtcgen/blob/master/Changelog.md

## Commands

### Slice

Extract symbols/components as pdf/png/svg and adopt them to asset catalog for iOS project.

these icons will be like...
![](https://raw.githubusercontent.com/wiki/Innovatube/dtcgen/images/readme_icons_on_figma.png)

this asset catalog.
![](https://raw.githubusercontent.com/wiki/Innovatube/dtcgen/images/readme_icons_on_xcode.png)

If you set `sliceAllImages` flag in config file, you can also extract all images within Sketch/Figma as `png` file.

### Style

Extract shared styles and turn them into asset catalog for iOS project.
Currently only shared color is implemented.

these colors
![](https://raw.githubusercontent.com/wiki/Innovatube/dtcgen/images/readme_colors_on_sketch.png)

will be like this asset catalog.
![](https://raw.githubusercontent.com/wiki/Innovatube/dtcgen/images/readme_colors_on_xcode.png)

※ Xcode version 9 and over is required.

### init

Just copy config files of `dtcgen` to your project root directory.

## How can you use in your code

`dtcgen` uses [Namespace](https://developer.apple.com/library/archive/documentation/Xcode/Reference/xcode_ref-Asset_Catalog_Format/FolderStructure.html#//apple_ref/doc/uid/TP40015170-CH33-SW4) as default, so you can retrieve assets in your source code like this:

```swift
// without R.swift
let hotelIcon = UIImage(named: "DtcGenerated/Icons/Hotel")
let hotelImage = UIImage(named: "DtcGenerated/Images/Hotel")
let black = UIColor(named: "DtcGenerated/Colors/Black")

// with R.swift
let hotelIcon: UIImage? = R.image.dtcGenerated.icons.hotel()
let hotelImage: UIImage? = R.image.dtcGenerated.images.hotel()
let black = R.color.dtcGenerated.colors.black()
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

- If you have previous version of dtcgen, check [Changelog](https://github.com/Innovatube/dtcgen/Changelog.md)
- If you have installed locally, prepend `npx` before `dtcgen`.

```zsh
# create config files on top directory
dtcgen init

# For Sketch (`--input` option is required)
dtcgen [slice|style] --tool sketch --input "./sample.sketch"

# For Figma
dtcgen [slice|style] --tool figma

# command help
dtcgen --help

# help for each commands
dtcgen [slice|style] --help

# version
dtcgen -v
```

# Preparation

## Check if design file fulfills conditions

### Sketch

Materials you want to extract shuold be

[Common rule]

- Symbol

[For `slice` command]

- Sliced with [slice tool](https://www.sketch.com/docs/exporting/slices/)

[For `style` command]

- local [shared style](https://www.sketch.com/docs/styling/shared-styles/) (not Library's).

### Figma

Materials you want to extract shuold be:

[Common rules]

- Component

[For `style` command]

- published as [Team Library](https://help.figma.com/article/29-team-library)

### Include keywords within Symbol/Component name

Assuming you want to extract icon files, you can just prepend keyword like `Icons /` to each name of symbols or components, which will be shown like `Icons / Search`.

The keyword should be same as one specified within `dtc.config.json` file.

Once you put these keywords within names, these symbols or components are extracted.

By the way, Spaces in between will be eliminated on generating assets. **`/` is treated as folder on generation.**

All notation about keywords above is also applied to `style` command.

## Run `dtcgen init` and fill in required info

1. Run `dtcgen init` on your project-root, so `.env` and `dtc.config.json` files are craeted.
2. Set some variables within `.env` file. For detail, please take a look `.env` example below.
   - For Sketch：`SKETCH_TOOL_PATH` is required
   - For Figma：
     - `FIGMA_FILE_KEY` and `FIGMA_ACCESS_TOKEN` are required for any command
     - `FIGMA_TEAM_ID` is required for `style` command
3. Set config within `dtc.config.json` file.

As a default, `.env` file looks like：

```bash
#### settings in common ####
# relative path from which the command executed or absolute path. if it's not found, lookup upper directory upto top directory of your file system. The file must be json format.
CONFIG_PATH="./dtc.config.json"

# If a directory set for `TEMPLATE_DIR` doesn't exist, `dtcgen` copies default templates into that directory
# so that you can customize freely. `dtcgen` uses handlebars and handlebars-helpers.
# This can be also relative path from project-root, or can be absolute path.
# relative path from where the command executed or absolute path
TEMPLATE_DIR="./templates"

# This is a directory where you want to output all extracted/generated files.
# If the directory doesn't exist, automatically created.
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

# To use `Style` command, you need to specify this.
# you need to create https://help.figma.com/article/15-creating-your-team at first
# then select "team" from left column, so you will get url like `https://www.figma.com/files/team/{team_id}/{team_name}`
FIGMA_TEAM_ID="TEAM_ID_HERE"
```

### Additional Note to use Sketch

You need to [insatll Sketch.app](https://www.sketch.com/get/) beforehand.
[`sketchtool`](https://developer.sketchapp.com/guides/sketchtool/) cli included within Sketch.app is required to use `dtcgen`.

Even if it's not activated(or lisence expired), it would work.
If something wrong, please [let us know](https://github.com/Innovatube/dtcgen/issues) or your help will be very appreciated.

Set absolute path for `sketchtool` to **SKETCH_TOOL_PATH** on `.env` file.
As a default, **SKETCH_TOOL_PATH** is set assuming you placed Sketch.app just under `/Applications` directory of macOS.

## Set `dtc.config.json`

```json:dtc.config.json
{
  "sketch": {
    "slice": {
      "caseSensitive": true,
      "keywords": ["Icons"],
      "extension": "PDF",
      "sliceAllImages": true,
      "scales": [1, 2, 3]
    },
    "style": {
      "color": {
        "isEnabled": true,
        "caseSensitive": true,
        "keywords": ["Colors"]
      }
    }
  },
  "figma": {
    "slice": {
      "caseSensitive": true,
      "keywords": ["Icons"],
      "extension": "PNG",
      "sliceAllImages": true,
      "scales": [1, 2, 3]
    },
    "style": {
      "color": {
        "isEnabled": true,
        "caseSensitive": true,
        "keywords": ["Colors"]
      }
    }
  }
}
```

You can set parameters to each design tool. Settable Parameters are as below：

[for `slice` command]

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

[for `style` command]

- caseSensitive: boolean set true if you want keyword to be case sensitive
- keywords: string[] you can set multiple keywords within symbols'/components' name
- isEnabled: if true, the style extraction/generation is executed

# todos

## dtcgen slice

- [x] run test on PR with travis CI
- [x] scale setting for png extraction
- [ ] output command execution status with console.log
- ~~[ ] CI integration(When using Sketch, runnning machine should be macOS)~~
- ~~[ ] make this command as figma plugin~~

## other todos/future plan

- [x] prepare `dtcgen init` command for initializing `.env`, `dtc.config.json`.
- [ ] bump up to eslint from tslint
- [x] color shared style extraction / generation
- [ ] text shared style extraction / generation
- [ ] localized string extraction / generation
- [ ] layout related source code generation with swiftUI
- [ ] android version

# Contribution

If any questions or issues, feel free to [add new issue](https://github.com/Innovatube/dtcgen/issues).

## LICENSE

apache2.0
