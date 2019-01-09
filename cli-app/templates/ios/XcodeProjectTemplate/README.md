# {{projectName}}

## prerequisite 

1. Install [XcodeGen](https://github.com/yonaskolb/XcodeGen#installing)
2. run `xcodegen generate` on directory where `project.yml` is exists.

## Directory

This project includes files as below.

```
XcodeProjectTemplate
├── README.md
├── project.yml.hbs
├── projectName
│   ├── AppDelegate.swift
│   ├── Assets.xcassets
│   │   ├── AppIcon.appiconset
│   │   │   └── Contents.json
│   │   ├── Contents.json
│   │   └── intermediateDirectory
│   │       ├── iconName.imageset
│   │       │   └── lastDirContents.json.hbs
│   │       └── midDirContents.json.hbs
│   ├── Base.lproj
│   │   ├── LaunchScreen.storyboard
│   │   └── Main.storyboard
│   ├── DesignToCode
│   │   ├── DesignToCode.generated.swift.hbs
│   │   ├── ViewConfig.swift
│   │   ├── ViewConfigImpl.swift
│   │   └── containerNameConfig.swift.hbs
│   ├── Info.plist
│   ├── Scenes
│   │   └── containerName
│   │       └── containerNameViewController.swift.hbs
│   ├── Views
│   │   ├── Common
│   │   │   ├── Constraint.swift
│   │   │   ├── ContainedButton.swift
│   │   │   ├── Container.swift
│   │   │   ├── Label.swift
│   │   │   ├── OutlinedButton.swift
│   │   │   ├── TextButton.swift
│   │   │   ├── TextField.swift
│   │   │   ├── TextView.swift
│   │   │   └── UIViewExtension.swift
│   │   ├── Custom
│   │   │   ├── IconButton.swift
│   │   │   ├── PrimaryButton.swift
│   │   │   └── SubmissionStatusButton.swift
│   │   └── Style
│   │       └── Colors.swift
│   └── viewController.swift.hbs
├── projectNameTests
│   ├── Info.plist
│   └── projectNameTests.swift.hbs
└── projectNameUITests
    ├── Info.plist
    └── SampleProjectUITests.swift

```

