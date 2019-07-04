import { Container } from 'inversify';
import 'reflect-metadata';
import { TYPES } from '../core/types';
import * as SketchPlatform from '../core/sketchPlatform/SketchPlatform';

describe('tests for SketchRepository', () => {
  const testContainer = new Container();
  var repository: SketchPlatform.ISketchRepository;

  beforeAll(() => {
    testContainer
      .bind<SketchPlatform.ISketchRepository>(TYPES.ISketchRepository)
      .to(SketchPlatform.SketchRepository);

    repository = testContainer.get<SketchPlatform.ISketchRepository>(
      TYPES.ISketchRepository,
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
});
