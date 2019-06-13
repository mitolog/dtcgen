import { Container } from 'inversify';
import 'reflect-metadata';
import { TYPES } from '../core/types';
import * as SketchPlatform from '../core/sketchPlatform/SketchPlatform';

describe('tests for SketchRepository', () => {
  const testContainer = new Container();
  var repository: SketchPlatform.ISketchRepository;

  beforeAll(async () => {
    testContainer
      .bind<SketchPlatform.ISketchRepository>(TYPES.ISketchRepository)
      .to(SketchPlatform.SketchRepository);

    repository = testContainer.get<SketchPlatform.ISketchRepository>(
      TYPES.ISketchRepository,
    );
  });

  describe('check extractSlices paramenter', () => {
    expect.assertions(1);
    it('if `inputPath` parameter is null, it raises an exeption.', () => {
      return expect(() => {
        repository.extractSlices(null);
      }).toThrow();
    });
  });

  describe('check extractImages paramenter', () => {
    expect.assertions(1);
    it('if `inputPath` parameter is null, it raises an exeption.', () => {
      repository.extractImages(null).catch(e => {
        expect(e).toBeDefined;
      });
    });
  });
});
