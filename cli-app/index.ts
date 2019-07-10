#!/usr/bin/env node
import { cac } from 'cac';
import {
  DIContainer,
  ILintNamingUseCase,
  IExtractElementUseCase,
  ISliceImageUseCase,
  IGenerateProjectUseCase,
  IGenerateAssetUseCase,
  TYPES,
  OSType,
  OSTypeValues,
  DesignToolType,
  DesignToolTypeValues,
  SliceConfig,
  GenerateConfig,
} from '../internal';

const cli = cac();

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

/**
 * extract symbols/components and convert them into ready-to-use assets.
 */
cli
  .command(
    'slice',
    'extract symbols/components and turn them into ready-to-use assets.',
  )
  .action((args, _) => {
    const inputPath = args.input;
    const outputDir = args.output;

    const toolType: string =
      DesignToolTypeValues.find(type => type === args.tool) ||
      DesignToolType.sketch;
    const platform =
      OSTypeValues.find(type => type === args.platform) || OSType.ios;

    if (toolType == DesignToolType.sketch && !inputPath) {
      console.log(
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
        console.log(`asset extracted`);
        return generateAssetUseCase.handle(generateConfig, outputDir);
      })
      .then(() => {
        console.log(`asset generated`);
      })
      .catch(error => {
        console.log(error);
      });
  })
  .option('input <file path>', 'required for sketch.')
  .option('tool <designTool>', '`sketch` as default.')
  .option('platform <osType>', '`ios` as default.');

cli.option(
  'output <dir>',
  'MUST BE SAME BETWEEN COMMANDS. default value is set on .env file.',
);

cli.version('0.1.0');
cli.help();

export { cli };
