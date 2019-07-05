import * as execa from 'execa';
import * as dotenv from 'dotenv';
import { Container } from 'inversify';
import 'reflect-metadata';
import { TYPES } from '../core/types';
import * as Domain from '../core/domain/Domain';
import * as SketchPlatform from '../core/sketchPlatform/SketchPlatform';
import { SliceConfig, DesignToolType } from '../core/domain/Entities';

describe('tests for sliceImageUseCase on Sketch', () => {
  const inputPath = './sample.sketch';
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
    sliceConfig.initWithDtcConfig(DesignToolType.sketch);
    sliceConfig.inputPath = inputPath;
    sliceConfig.outputDir = outputDir;

    testContainer
      .bind<SketchPlatform.ISketchRepository>(TYPES.ISketchRepository)
      .to(SketchPlatform.SketchRepository);
    testContainer
      .bind<Domain.ISliceImageUseCase>(TYPES.ISliceImageUseCase)
      .to(SketchPlatform.SliceImageUseCase);
    usecase = testContainer.get<Domain.ISliceImageUseCase>(
      TYPES.ISliceImageUseCase,
    );
  });

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
    sliceConfig.outputDir = outputDir;
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  afterAll(async () => {
    return await execa(`rm -rf ${outputDir}`, { shell: true });
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

    test('if SKETCH_TOOL_PATH is not set properly, it shuold throw an error', () => {
      process.env.SKETCH_TOOL_PATH = '';

      expect.assertions(1);
      return usecase.handle(sliceConfig).catch(error => {
        expect(error).not.toBeNull();
      });
    });

    test('Even if TEMPLATE_DIR is not set properly, it does not matter.', () => {
      process.env.TEMPLATE_DIR = '';
      return usecase.handle(sliceConfig).then(() => {
        expect('').toBe('');
      });
    });

    test('if OUTPUT_PATH is not set properly, it shuold throw an error', () => {
      process.env.OUTPUT_PATH = '';
      sliceConfig.outputDir = null;
      expect.assertions(1);
      return usecase.handle(sliceConfig).catch(error => {
        expect(error).not.toBeNull();
      });
    });
  });
});
