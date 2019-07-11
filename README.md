# What is it

This is a cli tool where you can extract Symbols or Components, on Sketch and Figma, that contains any keywords set on config file. Then you can turn them into asset catalog(Asset.xcassets) with one command.

[readme in Japanese](https://github.com/Innovatube/dtcgen/wiki/readmeJp).

If you set `sliceAllImages` in config file, you can also extract all images within Sketch/Figma as png.

Currently yarn and npm package is prepared.

This turned into...
![](https://raw.githubusercontent.com/wiki/Innovatube/dtcgen/images/readme_icons_on_figma.png)

This asset catalog.
![](https://raw.githubusercontent.com/wiki/Innovatube/dtcgen/images/readme_icons_on_xcode.png)

Because dtcgen set `Provides Namespace` as default, so you can write source code like this:

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

```bash
# Create any favorable directory and move there (let's use `project root` for further documents)
# We create this directory to put setting files into it.
$ mkdir trydtcgen && cd ./trydtcgen

# check if node.js is higher than v8.9.0
$ node -v

# yarn
# global install
yarn global add dtcgen

# local install
yarn add --dev dtcgen

# npm
# global install
npm install -g dtcgen

# local install
npm install --save-dev dtcgen
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

※ If you installed locally, prepend `npx` on each command.

# Preparation

## Check if design file fulfills some conditions

### Sketch

Materials you want to extract shuold be:

- Symbol
- sliced with [slice tool](https://www.sketch.com/docs/exporting/slices/)

### Figma

Materials you want to extract shuold be:

- Component

### Include keywords within Symbol/Component name

Let's say you want to extract icon files, you can prepend keyword `Icons /` for each symbols/components to make it like `Icons / Search`.

If there are spaces, it will be eliminated on generating asset catalog. Then, `/` is treated as folder separator.

## Create and set .env file

On your project root that you create at first step of installation, create `.env` file, then confirm and set environmental variable properly.

1. You can create `.env` file with 2 ways：

- Copy `.env.default` from dtcgen package
- Copy from [github repository](https://github.com/Innovatube/dtcgen/blob/master/.env.default)

2. Set some variables within `.env` file. How to get these are explained later.
   - For Sketch：`SKETCH_TOOL_PATH` is required
   - For Figma：`FIGMA_FILE_KEY` and `FIGMA_ACCESS_TOKEN` are required

As default, `.env` file looks like：

```bash
#### settings in common ####
# relative path from where the command executed or absolute path. if not found, lookup upper dir upto '/'.
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
The Path can be relative path from project root, or can be absolute path.
Then, file type should be json.

### TEMPLATE_DIR

If a directory set as `TEMPLATE_DIR` exists, dtcgen uses that directory. If it's empty, it raises an error.

If a directory set as `TEMPLATE_DIR` doesn't exist, dtcgen copies default templates into that directory.

This can be also set as relative path from project root, or can be absolute path.

### OUTPUT_PATH

This is a directory where you want to output all extracted/generated files.
If the directory doesn't exist, dtcgen create it.

## Prepare needed info to access design files

### Sketch

You need to [insatll Sketch.app](https://www.sketch.com/get/) beforehand.
We need `sketchtool` command to use dtcgen.

Even if it's not activated(or lisence expired), it would work.
If it seems not working, please let us know.

Set absolute path to the `sketchtool` as **SKETCH_TOOL_PATH** on `.env` file.
As default, **SKETCH_TOOL_PATH** is set assuming you placed Sketch.app just under `Application` directory.

### Figma

- **FIGMA_FILE_KEY**: `https://www.figma.com/file/{{FILE_KEY}}/sample_for_test` use key corresponding `{{FILE_KEY}}`
- **FIGMA_ACCESS_TOKEN**: You can get one via setting view from Figma web. Detailed info is on [Official document](https://www.figma.com/developers/docs#authentication).

## Create and set `dtc.config.json`

Create `dtc.config.json` under project root.
(You can change the name or directory on `.env` file)

```json:dtc.config.json
{
  "sketch": {
    "slice": {
      "caseSensitive": true,
      "keywords": ["Icons"],
      "extension": "PDF",
      "sliceAllImages": true
    }
  },
  "figma": {
    "slice": {
      "caseSensitive": true,
      "keywords": ["Icons"],
      "extension": "PDF",
      "sliceAllImages": true
    }
  }
}
```

You can change for each design tool. Parameters are as below：

- caseSensitive: boolean set true if you want keyword to be case sensitive
- keywords: string[] you can set multiple keywords within symbols'/components' name
- extension: string file extension that you can extract. currently supporting [pdf/svg/png].
- sliceAllImages: boolean set true if yoou want to extract all images within design file.

# further plans

## regarding dtcgen slice

- issues/requests from users
- scale setting for png extraction
- output command execution status with console.log
- CI integration(When using Sketch, runnning machine should be macOS)
- make this command as figma plugin
- android version

## regarding other functions

- color palette extraction / generation
- layout related source code generation with swiftUI

# Contribution

If any questions or issues araise, feel free to [put an new issue](https://github.com/Innovatube/dtcgen/issues).

## LICENSE

apache2.0
