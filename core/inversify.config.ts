import { Container } from 'inversify';
import 'reflect-metadata';
import { TYPES } from './types';
import * as Domain from './domain/Domain';
import * as SketchPlatform from './sketchPlatform/SketchPlatform';
import * as IOSPlatform from './iosPlatform/IOSPlatform';
import {
  DesignToolType,
  DesignToolTypeValues,
} from './domain/entities/DesignToolType';
import { OSType, OSTypeValues } from './domain/entities/OSType';

export class DIContainer {
  private container: Container;

  constructor(type: DesignToolType | OSType) {
    const container = new Container();

    // todo: type is union type. you need to distinct which type is it.
    // currently its primitive type cannot be same between DesignToolType and OSType

    if (DesignToolTypeValues.find(toolType => toolType === type)) {
      switch (type) {
        case DesignToolType.sketch:
          this.injectSketch(container);
          break;
        default:
          break;
      }
    }

    if (OSTypeValues.find(osType => osType === type)) {
      switch (type) {
        case OSType.ios:
          this.injectIos(container);
          break;
        default:
          break;
      }
    }

    this.container = container;
  }

  getContainer() {
    return this.container;
  }

  injectSketch(container: Container) {
    // need to specify to properly construct LintNamingUseCase
    container
      .bind<Domain.INamingLinter>(TYPES.INamingLinter)
      .to(SketchPlatform.SketchNamingLinter);
    container
      .bind<SketchPlatform.ISketchRepository>(TYPES.ISketchRepository)
      .to(SketchPlatform.SketchRepository);
    container
      .bind<SketchPlatform.ISketchPresenter>(TYPES.ISketchPresenter)
      .to(SketchPlatform.SketchPresenter);

    // Lint use case
    container
      .bind<Domain.ILintNamingUseCase>(TYPES.ILintNamingUseCase)
      .to(SketchPlatform.LintNamingUseCase);

    // Extract use case
    container
      .bind<Domain.IExtractElementUseCase>(TYPES.IExtractElementUseCase)
      .to(SketchPlatform.ExtractElementUseCase);
  }

  injectIos(container: Container) {
    // Generate use case
    container
      .bind<Domain.IGenerateProjectUseCase>(TYPES.IGenerateProjectUseCase)
      .to(IOSPlatform.GenerateProjectUseCase);
  }
}
