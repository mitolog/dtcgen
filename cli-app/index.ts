#!/usr/bin/env node
import { cac } from 'cac';
import * as ora from 'ora';
import {
  DIContainer,
  ILintNamingUseCase,
  IExtractElementUseCase,
  ISliceImageUseCase,
  IStyleUseCase,
  IGenerateProjectUseCase,
  IGenerateAssetUseCase,
  IGenericUseCase,
  TYPES,
  OSType,
  OSTypeValues,
  DesignToolType,
  DesignToolTypeValues,
  SliceConfig,
  GenerateConfig,
  StyleConfig,
} from '../internal';

const cli = cac();
const spinner = ora({
  spinner: 'line'
});

/**
 * lint
 */
// cli.command('lint', 'lint design resource file').action((_, flag) => {
//   const inputPath = flag.input;
//   if (!inputPath) {
//     console.log('required option is not detected. see `generate --help`.');
//     return;
//   }
//   console.log("now start linting...");
//   // TODO: maintenance after implementing the other commands
//   // prettier-ignore
//   // const lintNamingUseCase = cliContainer.get<ILintNamingUseCase>(TYPES.ILintNamingUseCase);
//   // lintNamingUseCase
//   //   .handle(inputPath)
//   //   .then(layers => {
//   //     console.log("finished linting.");
//   //     console.log("--------------------");
//   //     console.log(layers);
//   //   })
//   //   .catch(error => {
//   //     console.log(error);
//   //   });
// });

/**
 * extract
 */
// cli
//   .command(
//     'extract',
//     'extract semantic elements for layout file auto generation.',
//   )
//   .action((input, _) => {
//     const inputPath = input.input;
//     const outputDir = input.output;
//     if (!inputPath) {
//       console.log('input option is not detected. see `extract --help`.');
//       return;
//     }

//     const toolType =
//       DesignToolTypeValues.find(type => type === input.tool) ||
//       DesignToolType.sketch;

//     const cliContainer = new DIContainer(<DesignToolType>(
//       toolType
//     )).getContainer();
//     const extractElementUseCase = cliContainer.get<IExtractElementUseCase>(
//       TYPES.IExtractElementUseCase,
//     );
//     extractElementUseCase
//       .handle(inputPath, outputDir)
//       .then(() => {
//         console.log(`file extracted`);
//       })
//       .catch(error => {
//         console.log(error);
//       });
//   })
//   .option('tool [designTool]', 'optional. `sketch` as a default.');

/**
 * generate source code
 */
// cli
//   .command('generate', 'generate source code from extracted semantic data.')
//   .action((input, _) => {
//     const platform =
//       OSTypeValues.find(type => type === input.platform) || OSType.ios;
//     const outputDir = input.output;
//     const projectName = input.project;
//     if (!projectName) {
//       console.log('`--project` option is not detected. see `extract --help`.');
//       return;
//     }

//     const cliContainer = new DIContainer(<OSType>platform).getContainer();
//     const generateProjectUseCase = cliContainer.get<IGenerateProjectUseCase>(
//       TYPES.IGenerateProjectUseCase,
//     );
//     generateProjectUseCase
//       .handle(projectName, outputDir)
//       .then(() => {
//         console.log(`code generated`);
//       })
//       .catch(error => {
//         console.log(error);
//       });
//   })
//   .option('platform [osType]', 'optional. currently `ios` only.')
//   .option('project [name]', 'required. specify the name for the project.');

cli
  .command('init', 'create setting files with default values.')
  .action((action, _) => {
    const genericContainer = new DIContainer().getContainer();
    const genericUseCase = genericContainer.get<IGenericUseCase>(
      TYPES.IGenericUseCase,
    );
    genericUseCase
      .handle()
      .then(() => {
        console.log(`default files are created.`);
      })
      .catch(error => {
        console.log(error);
      });
  });

/**
 * extract symbols/components and convert them into ready-to-use assets.
 */
cli
  .command(
    'slice',
    'extract symbols/components and turn them into ready-to-use asset files for iOS.',
  )
  .action((args, _) => {
    spinner.start("extracting images...");
    const inputPath = args.input;
    const outputDir = args.output;

    const toolType: string =
      DesignToolTypeValues.find(type => type === args.tool) || DesignToolType.figma;
    const platform =
      OSTypeValues.find(type => type === args.platform) || OSType.ios;

    if (toolType == DesignToolType.sketch && !inputPath) {
      spinner.fail(
        '`input` option on sketch is required. see `dtcgen slice --help`.',
      );
      return;
    }

    const sliceConfig: SliceConfig = new SliceConfig();
    sliceConfig.initWithDtcConfig(toolType as DesignToolType);
    sliceConfig.inputPath = inputPath;
    sliceConfig.outputDir = outputDir;

    const generateConfig: GenerateConfig = new GenerateConfig();
    generateConfig.sliceConfig = sliceConfig;
    generateConfig.toolType = toolType as DesignToolType;

    const extractContainer = new DIContainer(<DesignToolType>(
      toolType
    )).getContainer();
    const sliceImageUseCase = extractContainer.get<ISliceImageUseCase>(
      TYPES.ISliceImageUseCase,
    );
    const generateContainer = new DIContainer(<OSType>platform).getContainer();
    const generateAssetUseCase = generateContainer.get<IGenerateAssetUseCase>(
      TYPES.IGenerateAssetUseCase,
    );

    sliceImageUseCase
      .handle(sliceConfig)
      .then(() => {
        spinner.succeed("images are extracted.");
        spinner.start("generating assets...");
        return generateAssetUseCase.handle(generateConfig, outputDir);
      })
      .then((destination) => {
        spinner.succeed(`assets are generated under ${destination}`);
      })
      .catch(error => {
        spinner.fail(error.message);
      });
  })
  .option(
    '-i, --input <file path>',
    'Required for sketch. Both relative/absolute path is acceptable.',
  )
  .option('-t, --tool <designTool>', '`sketch`(default) or `figma`.');
//.option('-p, --platform <osType>', 'Currently `ios` only.');

/**
 * extract styles and turn them into ready-to-use assets for ios.
 */
cli
  .command(
    'style',
    'extract shared styles and turn them into ready-to-use assets for ios.',
  )
  .action((args, _) => {
    spinner.start("extracting styles...");

    const inputPath = args.input;
    const outputDir = args.output;

    const toolType: string =
      DesignToolTypeValues.find(type => type === args.tool) || DesignToolType.figma;
    const platform =
      OSTypeValues.find(type => type === args.platform) || OSType.ios;

    if (toolType == DesignToolType.sketch && !inputPath) {
      spinner.fail(
        '`input` option on sketch is required. see `dtcgen slice --help`.',
      );
      return;
    }

    const styleConfig: StyleConfig = new StyleConfig();
    styleConfig.initWithDtcConfig(toolType as DesignToolType);
    styleConfig.inputPath = inputPath;
    styleConfig.outputDir = outputDir;
    const generateConfig: GenerateConfig = new GenerateConfig();
    generateConfig.styleConfig = styleConfig;
    generateConfig.toolType = toolType as DesignToolType;

    const container = new DIContainer(<DesignToolType>toolType).getContainer();
    const styleUseCase = container.get<IStyleUseCase>(TYPES.IStyleUseCase);
    const generateContainer = new DIContainer(<OSType>platform).getContainer();
    const generateAssetUseCase = generateContainer.get<IGenerateAssetUseCase>(
      TYPES.IGenerateAssetUseCase,
    );

    styleUseCase
      .handle(styleConfig)
      .then(styles => {
        spinner.succeed("styles are extracted.");
        spinner.start("generating assets...");
        generateConfig.styleConfig.outputStyles = styles;
        return generateAssetUseCase.handle(generateConfig, outputDir);
      })
      .then((destination) => {
        spinner.succeed(`assets are generated under ${destination}`);
      })
      .catch(error => {
        spinner.fail(error.message);
      });
  })
  .option(
    '-i, --input <file path>',
    'Required for sketch. Both relative/absolute path is acceptable.',
  )
  .option('-t, --tool <designTool>', '`sketch`(default) or `figma`.');

cli.option(
  '-o, --output <dir>',
  'Default value can be set on `.env` file. Both relative/absolute path is acceptable.',
);

cli.version('0.2.0');
cli.help();

export { cli };
