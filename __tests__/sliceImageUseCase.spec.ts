import { Container } from 'inversify';
import 'reflect-metadata';
import { TYPES } from '../core/types';
import * as Domain from '../core/domain/Domain';
import * as SketchPlatform from '../core/sketchPlatform/SketchPlatform';

describe('tests for sliceImageUseCase', () => {
  const testContainer = new Container();
  var usecase: Domain.ISliceImageUseCase;

  beforeAll(async () => {});

  describe('required parameter check', () => {
    testContainer
      .bind<SketchPlatform.ISketchRepository>(TYPES.ISketchRepository)
      .to(SketchPlatform.ThrowExeptionSketchRepository);
    testContainer
      .bind<Domain.ISliceImageUseCase>(TYPES.ISliceImageUseCase)
      .to(SketchPlatform.SliceImageUseCase);
    usecase = testContainer.get<Domain.ISliceImageUseCase>(
      TYPES.ISliceImageUseCase,
    );

    it('if no `inputPath` parameter, it shuold throw an error', () => {
      expect.assertions(1);
      return usecase.handle('').catch(error => {
        expect(error).not.toBeNull();
      });
    });
  });
});
