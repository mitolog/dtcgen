# design-to-code-generator

By following specific naming rules on design prototyping tool, this tool will turn it into source code directly. you can also customise how it works by config file.

## background

This repository aims to be a tool set that generates iOS/Android app source code and related assets from design prototyping tools like Sketch, Figma, and so on.

The base concept is that _"let's automate process turning designs into source codes as possible as we can"_ so that both designers and developers can concentrate on more higher level of the product creation.

## tools

we prepared cli tools as below:

### currently implemented

- (Sketch -> iOS) convert image slices into xcassets files

### to be added

- (Sketch -> iOS) convert color palette into xcassets files
- (Figma -> iOS) convert image slices and color palette into xcassets files
- (Sketch -> iOS) convert static view layouts into SwiftUI layout

Android version to be added...

## prerequisite

1. node version `8.9.0` or over.
2. install [sketch](https://www.sketchapp.com/).
3. check if [sketchtool](https://developer.sketchapp.com/guides/sketchtool/) exists by executing `$ ls /Applications/Sketch.app/Contents/Resources/sketchtool/bin/sketchtool`

## how to install

1. npm install -g git@github.com:podder-ai/design-to-code.git

## how to use

1. check if environment variables on `.env` file are all set properly
2. dtcgen <command> <options>

### (Sketch -> iOS) To convert image slices into xcassets files

`dtcgen slice --input "./sample.sketch" --platform ios`

### (Sketch -> iOS) convert color palette into xcassets files

to be added...

### (Figma -> iOS) convert image slices and color palette into xcassets files

to be added...

### (Sketch -> iOS) convert static view layouts into SwiftUI layout

to be added...

## contribution

### development preparation

1. git clone git@github.com:podder-ai/design-to-code.git
2. npm install
3. `tsc -w` on project root directory

### try cli while development

1. make sure that you did finished `tsc` and have directory `dist` on root dir which has transpiled sourcecodes.
2. `npm link` on project root dir which make symlink to global npm node_modules
3. now you can execute like `dtcgen slice --input "./sample.sketch"`.
4. if you want to use on another node project, you can type `npm link dtcgen` on root dir of that project.

** To remove symlink, you can execute `npm install` on dtcgen project. **

### how to make PR

welcome

## thanks to

https://github.com/jsynowiec/node-typescript-boilerplate

## LICENSE

apache2.0
