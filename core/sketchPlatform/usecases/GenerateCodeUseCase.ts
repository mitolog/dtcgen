import { ISketchRepository } from '../repositories/SketchRepository';
import { ISketchPresenter } from '../presenters/SketchPresenter';
import { inject, injectable } from 'inversify';
import { TYPES } from '../../types';
import { IGenerateCodeUseCase } from '../../domain/Domain';
import { DesignToolType } from '../../domain/entities/DesignToolType';
import { OSType } from '../../domain/entities/OSType';

@injectable()
export class GenerateCodeUseCase implements IGenerateCodeUseCase {
  private repository: ISketchRepository;
  private presenter: ISketchPresenter;

  constructor(
    @inject(TYPES.ISketchRepository) repository: ISketchRepository,
    @inject(TYPES.ISketchPresenter) presenter: ISketchPresenter,
  ) {
    this.repository = repository;
    this.presenter = presenter;
  }

  async handle(designTool: DesignToolType, osType: OSType): Promise<void> {
    if (designTool !== DesignToolType.sketch) return;
    this.repository.generateAll(osType);
  }
}
