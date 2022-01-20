#!/usr/bin/env node
import { cac } from 'cac';
import * as ora from 'ora';
import {
  DIContainer,
  ISliceImageUseCase,
  IStyleUseCase,
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

cli
  .command('init', 'create required config files.')
  .action((action, _) => {
    spinner.start("copying config files...");
    const genericContainer = new DIContainer().getContainer();
    const genericUseCase = genericContainer.get<IGenericUseCase>(
      TYPES.IGenericUseCase,
    );
    genericUseCase
      .handle()
      .then(() => {
        spinner.succeed("config files are created.");
      })
      .catch(error => {
        spinner.fail(error.message);
      });
  });

cli
  .command(
    'slice',
    'extract keyword matched components and turn them into xcassets compatible files for iOS.',
  )
  .action((args, _) => {
    spinner.start("extracting images...");
    const inputPath = args.input;
    const outputDir = args.output;

    const toolType: string =
      DesignToolTypeValues.find(type => type === args.tool) || DesignToolType.figma;
    const platform =
      OSTypeValues.find(type => type === args.platform) || OSType.ios;

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
  .option('-t, --tool <designTool>', 'only `figma` is supported now.');
//.option('-p, --platform <osType>', 'Currently `ios` only.');

cli
  .command(
    'style',
    'extract team shared style and turn them into xcassets compatible files for iOS.',
  )
  .action((args, _) => {
    spinner.start("extracting styles...");

    const inputPath = args.input;
    const outputDir = args.output;

    const toolType: string =
      DesignToolTypeValues.find(type => type === args.tool) || DesignToolType.figma;
    const platform =
      OSTypeValues.find(type => type === args.platform) || OSType.ios;

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
  .option('-t, --tool <designTool>', 'only `figma` is supported now.');

cli.option(
  '-o, --output <dir>',
  'Default value can be set on `.env` file. Both relative/absolute path is acceptable.',
);

cli.version('0.2.0');
cli.help();

export { cli };
