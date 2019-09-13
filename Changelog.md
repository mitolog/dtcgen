## v0.2.0

- added `init` command, where you can create initial config files (`.env` and `dtc.config.json`) with latest format.
- added `style` command, where you can extract and generate shared color style.

If you use previous version of `dtcgen` and you want to use latest version,
you will have 2 ways.

### 1. recreate `.env`, `dtc.config.json`, and `templates`

remove `.env`, `dtc.config.json`, `templates` or take backup with other name once, then you can make new ones with `dtcgen init` (`templates` will be created when executing any commands).

### 2. update `.env`, `dtc.config.json` and `templates` folder.

#### .env

add `FIGMA_TEAM_ID`

#### dtc.config.json

add below to under "sketch" and/or "figma" object:

```
"style": {
  "color": {
    "isEnabled": true,
    "caseSensitive": true,
    "keywords": ["Colors"]
  }
}
```

### add `colorName.colorset` templates

place [colorName.colorset](https://github.com/Innovatube/dtcgen/tree/master/templates/ios/XcodeProjectTemplate/projectName/Assets.xcassets/intermediateDirectory/colorName.colorset) folder as same directory as it is.

for more detail, please take a look at [readme](https://github.com/Innovatube/dtcgen).
