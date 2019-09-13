import { Container } from 'inversify';
import 'reflect-metadata';
import { TYPES } from '../core/types';
import * as FigmaPlatform from '../core/figmaPlatform/FigmaPlatform';

describe('tests for FigmaRepository', () => {
  const testContainer = new Container();
  var repository: FigmaPlatform.IFigmaRepository;

  beforeAll(() => {
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

  describe('check extractSlices paramenter', () => {
    expect.assertions(1);
    test('if `config` parameter is null, it raises an exeption.', () => {
      return repository.extractSlices(null).catch(e => {
        expect(e).toBeDefined();
      });
    });
  });

  describe('check extractImages paramenter', () => {
    expect.assertions(1);
    test('if `config` parameter is null, it raises an exeption.', () => {
      return repository.extractImages(null).catch(e => {
        expect(e).toBeDefined();
      });
    });
  });

  describe('check extractStyles paramenter', () => {
    expect.assertions(1);
    test('if `config` parameter is null, it raises an exeption.', () => {
      return repository.extractStyles(null).catch(e => {
        expect(e).toBeDefined();
      });
    });
  });
});
