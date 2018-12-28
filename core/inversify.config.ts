import { Container } from 'inversify';
import 'reflect-metadata';
import { TYPES } from './types';
import * as Domain from './domain/Domain';
import * as SketchPlatform from './sketchPlatform/SketchPlatform';

const cliContainer = new Container();
cliContainer
  .bind<Domain.INamingLinter>(TYPES.INamingLinter)
  .to(SketchPlatform.SketchNamingLinter);
cliContainer
  .bind<SketchPlatform.ISketchRepository>(TYPES.ISketchRepository)
  .to(SketchPlatform.SketchRepository);
cliContainer
  .bind<SketchPlatform.ISketchPresenter>(TYPES.ISketchPresenter)
  .to(SketchPlatform.SketchPresenter);
cliContainer
  .bind<Domain.ILintNamingUseCase>(TYPES.ILintNamingUseCase)
  .to(SketchPlatform.LintNamingUseCase);
cliContainer
  .bind<Domain.IExtractElementUseCase>(TYPES.IExtractElementUseCase)
  .to(SketchPlatform.ExtractElementUseCase);
cliContainer
  .bind<Domain.IGenerateCodeUseCase>(TYPES.IGenerateCodeUseCase)
  .to(SketchPlatform.GenerateCodeUseCase);

export { cliContainer };
