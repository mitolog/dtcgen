import { IExtractElementUseCase } from '../../domain/usecases/IExtractElementUseCase';
import { ISketchRepository } from '../repositories/ISketchRepository';
import { ISketchPresenter } from '../presenters/SketchPresenter';
import { inject, injectable } from 'inversify';
import { TYPES } from '../../types';

@injectable()
export class ExtractElementUseCase implements IExtractElementUseCase {
  private repository: ISketchRepository;
  private presenter: ISketchPresenter;

  constructor(
    @inject(TYPES.ISketchRepository) repository: ISketchRepository,
    @inject(TYPES.ISketchPresenter) presenter: ISketchPresenter,
  ) {
    this.repository = repository;
    this.presenter = presenter;
  }

  async handle(inputPath: string, outputDir?: string): Promise<void> {
    await this.repository.extractAll(inputPath, outputDir);
  }
}
