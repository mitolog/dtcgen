import * as execa from 'execa';
import * as dotenv from 'dotenv';
import { Container } from 'inversify';
import 'reflect-metadata';
import { TYPES } from '../core/types';
import * as Domain from '../core/domain/Domain';
import * as FigmaPlatform from '../core/figmaPlatform/FigmaPlatform';
import { SliceConfig, DesignToolType } from '../core/domain/Entities';

describe('tests for sliceImageUseCase on Figma', () => {
  const outputDir = './testOutputs';
  var sliceConfig: SliceConfig;
  var OLD_ENV: any;

  const testContainer = new Container();
  var usecase: Domain.ISliceImageUseCase;

  beforeAll(() => {
    jest.setTimeout(20000);
    dotenv.config();
    if (dotenv.error) {
      throw dotenv.error;
    }
    OLD_ENV = process.env;

    sliceConfig = new SliceConfig();
    sliceConfig.initWithDtcConfig(DesignToolType.figma);
    sliceConfig.outputDir = outputDir;

    testContainer
      .bind<FigmaPlatform.IFigmaConfig>(TYPES.IFigmaConfig)
      .to(FigmaPlatform.FigmaConfigMock);
    testContainer
      .bind<FigmaPlatform.IFigmaRepository>(TYPES.IFigmaRepository)
      .to(FigmaPlatform.FigmaRepository);
    testContainer
      .bind<Domain.ISliceImageUseCase>(TYPES.ISliceImageUseCase)
      .to(FigmaPlatform.SliceImageUseCase);
    usecase = testContainer.get<Domain.ISliceImageUseCase>(
      TYPES.ISliceImageUseCase,
    );
  });

  afterAll(async () => {
    return await execa.shell(`rm -rf ${outputDir}`);
  });

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
    sliceConfig.outputDir = outputDir;
  });

  afterEach(() => {
    // await new Promise(resolve => setTimeout(resolve, 1000));
    process.env = OLD_ENV;
  });

  describe('required parameter check', () => {
    test('if null parameter attained, it shuold throw an error', () => {
      expect.assertions(1);
      return usecase.handle(null).catch(error => {
        expect(error).not.toBeNull();
      });
    });
  });

  describe('process.env check', () => {
    test('even if CONFIG_PATH is not set properly, it will return with no error.', () => {
      process.env.CONFIG_PATH = '';
      return usecase.handle(sliceConfig).then(() => {
        expect('').toBe('');
      });
    });

    test('if both OUTPUT_PATH and outputDir is not set properly, it shuold throw an error', () => {
      process.env.OUTPUT_PATH = '';
      sliceConfig.outputDir = null;
      expect.assertions(1);
      return usecase.handle(sliceConfig).catch(error => {
        expect(error).not.toBeNull();
      });
    });
  });
});
