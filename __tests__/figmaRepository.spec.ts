import * as execa from 'execa';
import { Container } from 'inversify';
import 'reflect-metadata';
import { TYPES } from '../core/types';
import * as dotenv from 'dotenv';
import * as FigmaPlatform from '../core/figmaPlatform/FigmaPlatform';
import { SliceConfig, StyleConfig, DesignToolType } from '../core/domain/Entities';

describe('tests for FigmaRepository', () => {
  const outputDir = './testOutputs';
  var sliceConfig: SliceConfig;
  var OLD_ENV: any;

  const testContainer = new Container();
  var repository: FigmaPlatform.IFigmaRepository;

  beforeAll(() => {
    dotenv.config();
    if (dotenv.error) {
      throw dotenv.error;
    }
    OLD_ENV = process.env;

    testContainer
      .bind<FigmaPlatform.IFigmaConfig>(TYPES.IFigmaConfig)
      .to(FigmaPlatform.FigmaConfigMock);
    testContainer
      .bind<FigmaPlatform.IFigmaRepository>(TYPES.IFigmaRepository)
      .to(FigmaPlatform.FigmaRepository);

    repository = testContainer.get<FigmaPlatform.IFigmaRepository>(
      TYPES.IFigmaRepository,
    );
  });

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };

    sliceConfig = new SliceConfig();
    sliceConfig.initWithDtcConfig(DesignToolType.figma);
    sliceConfig.outputDir = outputDir;
  });

  afterAll(async () => {
    return await execa(`rm -rf ${outputDir}`, { shell: true });
  });

  describe('check extractSlices paramenter', () => {
    test('if `config` parameter is null, it raises an exeption.', () => {
      expect.assertions(1);
      return repository.extractSlices(null).catch(e => {
        expect(e).toBeDefined();
      });
    });

    test('if `config` parameter is properly set, it will succeed.', () => {
      expect.assertions(1);
      return repository.extractSlices(sliceConfig)
      .then(value => {
        expect(value).toBeUndefined();
      });
    });

  });

  describe('check extractImages paramenter', () => {
    test('if `config` parameter is null, it raises an exeption.', () => {
      expect.assertions(1);
      return repository.extractImages(null).catch(e => {
        expect(e).toBeDefined();
      });
    });

    test('if `config` parameter is properly set, it will succeed.', () => {
      sliceConfig.sliceAllImages = true;
      expect.assertions(1);
      return repository.extractImages(sliceConfig)
      .then(value => {
        expect(value).toBeUndefined();
      });
    });
  });

  describe('check extractStyles paramenter', () => {
    test('if `config` parameter is null, it raises an exeption.', () => {
      expect.assertions(1);
      return repository.extractStyles(null).catch(e => {
        expect(e).toBeDefined();
      });
    });
  });

  test('if `config` parameter is properly set, it will succeed.', () => {
    expect.assertions(1);

    var styleConfig = new StyleConfig();
    styleConfig.initWithDtcConfig(DesignToolType.figma);
    styleConfig.outputDir = outputDir;

    return repository.extractStyles(styleConfig).then(value => {
      expect(value).toBeDefined();
    });
  });
});
