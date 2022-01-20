import { Container } from 'inversify';
import 'reflect-metadata';
import { TYPES } from './types';
import { DesignToolType, DesignToolTypeValues } from './domain/Entities';
import { OSType, OSTypeValues } from './domain/Entities';

import * as Domain from './domain/Domain';
import * as FigmaPlatform from './figmaPlatform/FigmaPlatform';
import * as IOSPlatform from './iosPlatform/IOSPlatform';
import * as GenericPlatform from './genericPlatform/GenericPlatform';

export class DIContainer {
  private container: Container;

  constructor(type?: DesignToolType | OSType) {
    const container = new Container();

    // todo: type is union type. you need to distinct which type is it.
    // currently its primitive type cannot be same between DesignToolType and OSType

    if (!type) {
      // default container
      this.injectGeneric(container);
    } else if (DesignToolTypeValues.find(toolType => toolType === type)) {
      switch (type) {
        case DesignToolType.figma:
          this.injectFigma(container);
          break;
        default:
          break;
      }
    } else if (OSTypeValues.find(osType => osType === type)) {
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

  injectGeneric(container: Container) {
    container
      .bind<GenericPlatform.IGenericRepository>(TYPES.IGenericRepository)
      .to(GenericPlatform.GenericRepository);

    container
      .bind<Domain.IGenericUseCase>(TYPES.IGenericUseCase)
      .to(GenericPlatform.GenericUseCase);
  }

  injectFigma(container: Container) {
    container
      .bind<FigmaPlatform.IFigmaConfig>(TYPES.IFigmaConfig)
      .to(FigmaPlatform.FigmaConfig);
    container
      .bind<FigmaPlatform.IFigmaRepository>(TYPES.IFigmaRepository)
      .to(FigmaPlatform.FigmaRepository);

    container
      .bind<FigmaPlatform.IFigmaPresenter>(TYPES.IFigmaPresenter)
      .to(FigmaPlatform.FigmaPresenter);

    // slice use case
    container
      .bind<Domain.ISliceImageUseCase>(TYPES.ISliceImageUseCase)
      .to(FigmaPlatform.SliceImageUseCase);

    // style use case
    container
      .bind<Domain.IStyleUseCase>(TYPES.IStyleUseCase)
      .to(FigmaPlatform.StyleUseCase);
  }

  injectIos(container: Container) {
    // Generate project use case
    container
      .bind<Domain.IGenerateProjectUseCase>(TYPES.IGenerateProjectUseCase)
      .to(IOSPlatform.GenerateProjectUseCase);

    // Generate asset use case
    container
      .bind<Domain.IGenerateAssetUseCase>(TYPES.IGenerateAssetUseCase)
      .to(IOSPlatform.GenerateAssetUseCase);
  }
}
