import * as dotenv from 'dotenv';
import { Container } from 'inversify';
import 'reflect-metadata';
import { TYPES } from '../core/types';
import * as Domain from '../core/domain/Domain';
import * as SketchPlatform from '../core/sketchPlatform/SketchPlatform';

describe('tests for sliceImageUseCase', () => {
  const inputPath = './sample.sketch';
  const outputDir = './testOutputs';

  const testContainer = new Container();
  var usecase: Domain.ISliceImageUseCase;

  beforeAll(async () => {
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

  afterAll(async () => {
    jest.resetModules();
    dotenv.config();
    if (dotenv.error) {
      throw dotenv.error;
    }
  });

  describe('required parameter check', () => {
    it('if no `inputPath` parameter, it shuold throw an error', () => {
      expect.assertions(1);
      return usecase.handle('').catch(error => {
        expect(error).not.toBeNull();
      });
    });
  });

  describe('process.env check', () => {
    it('if CONFIG_PATH is not set properly, it shuold throw an error', () => {
      process.env.CONFIG_PATH = '';
      return usecase.handle(inputPath, outputDir).then(() => {
        expect('').toBe('');
      });
    });

    it('if SKETCH_TOOL_PATH is not set properly, it shuold throw an error', () => {
      process.env.SKETCH_TOOL_PATH = '';

      expect.assertions(1);
      return usecase.handle(inputPath, outputDir).catch(error => {
        expect(error).not.toBeNull();
      });
    });

    it('if TEMPLATE_DIR is not set properly, it shuold throw an error', () => {
      process.env.TEMPLATE_DIR = '';

      expect.assertions(1);
      return usecase.handle(inputPath, outputDir).catch(error => {
        expect(error).not.toBeNull();
      });
    });

    it('if OUTPUT_PATH is not set properly, it shuold throw an error', () => {
      process.env.OUTPUT_PATH = '';

      expect.assertions(1);
      return usecase.handle(inputPath, outputDir).catch(error => {
        expect(error).not.toBeNull();
      });
    });
  });
});
