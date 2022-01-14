import * as execa from 'execa';
import * as dotenv from 'dotenv';
import { Container } from 'inversify';
import 'reflect-metadata';
import { TYPES } from '../core/types';
import * as Domain from '../core/domain/Domain';
import * as FigmaPlatform from '../core/figmaPlatform/FigmaPlatform';
import { StyleConfig, DesignToolType } from '../core/domain/Entities';

describe('tests for styleUseCase on Figma', () => {
  const outputDir = './testOutputs';
  var styleConfig: StyleConfig;
  var OLD_ENV: any;

  const testContainer = new Container();
  var usecase: Domain.IStyleUseCase;

  beforeAll(() => {
    jest.setTimeout(20000);
    dotenv.config();
    if (dotenv.error) {
      throw dotenv.error;
    }
    OLD_ENV = process.env;

    styleConfig = new StyleConfig();
    styleConfig.initWithDtcConfig(DesignToolType.figma);
    styleConfig.outputDir = outputDir;

    testContainer
      .bind<FigmaPlatform.IFigmaConfig>(TYPES.IFigmaConfig)
      .to(FigmaPlatform.FigmaConfigMock);
    testContainer
      .bind<FigmaPlatform.IFigmaRepository>(TYPES.IFigmaRepository)
      .to(FigmaPlatform.FigmaRepository);
    testContainer
      .bind<FigmaPlatform.IFigmaPresenter>(TYPES.IFigmaPresenter)
      .to(FigmaPlatform.FigmaPresenter);
    testContainer
      .bind<Domain.IStyleUseCase>(TYPES.IStyleUseCase)
      .to(FigmaPlatform.StyleUseCase);
    usecase = testContainer.get<Domain.IStyleUseCase>(TYPES.IStyleUseCase);
  });

  afterAll(async () => {
    return await execa(`rm -rf ${outputDir}`, { shell: true });
  });

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
    styleConfig.outputDir = outputDir;
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
      return usecase.handle(styleConfig).then(() => {
        expect('').toBe('');
      });
    });

    test('even if both OUTPUT_PATH and outputDir are not set, no effect to StyleUseCase', () => {
      process.env.OUTPUT_PATH = '';
      styleConfig.outputDir = null;
      return usecase.handle(styleConfig).then(styles => {
        expect(styles).not.toBeNull();
      });
    });
  });
});
