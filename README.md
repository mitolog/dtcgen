<h1 align="center">dtcgen</h1>

<p align="center">Generate xcassets from <a href="https://www.figma.com">Figma</a>.</p>

![](https://raw.githubusercontent.com/wiki/mitolog/dtcgen/images/dtcgen_cover_small.png)

## Requirements

- node version >= 14.15.4
- Figma design file
- Figma shared library ( for `dtcgen style` command )

## Install

```zsh
yarn global add dtcgen
# or
npm install -g dtcgen
```

## How to use

1. create config files with `dtcgen init` , then fill out required parameters in `.env` file
2. `dtcgen slice` to generate Image Set of xcassets
3. `dtcgen style` to generate Color Set of xcassets

\*) If you installed locally, prepend `npx` before `dtcgen`.

## Available parameters on `dtc.config.json`

### slice

| prop name      | type     | description                                                               |
| -------------- | -------- | ------------------------------------------------------------------------- |
| caseSensitive  | boolean  | set true if you want keyword to be case sensitive.                        |
| keywords       | string[] | multiple keywords included in components' names that you want to extract. |
| extension      | string   | the file extension to be extracted. currently supporting [pdf/svg/png].   |
| sliceAllImages | boolean  | set true if you want to extract all images within a design file as png.   |
| scales         | number[] | set scales you want to extract. but it's valid only on 'png' extension.   |

numbers that you can specify to scales are as below：

|       | scales     |
| ----- | ---------- |
| figma | 1, 2, 3, 4 |

#### more detail about `keywords` parameter

Assuming you want to retrieve icons as xcassets-ready files, and icons have defined under `Icons / ***` already. Then, you need to add `icons` or `Icons` (if caseSensitive) to keywords within `dtc.config.json` . So you can retrieve all icons under that.

\*) Spaces in between will be eliminated on generating assets. Then **`/` is treated as a folder on generation.**

### style

| prop name       | type    | description                                                  |
| --------------- | ------- | ------------------------------------------------------------ |
| color.isEnabled | boolean | set true if you want to extract and generate color xcassets. |

## Changelog

https://github.com/mitolog/dtcgen/blob/master/Changelog.md

## LICENSE

apache2.0
