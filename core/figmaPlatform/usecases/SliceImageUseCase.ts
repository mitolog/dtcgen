import { ISliceImageUseCase } from '../../domain/usecases/ISliceImageUseCase';
import { IFigmaRepository } from '../repositories/IFigmaRepository';
import { inject, injectable } from 'inversify';
import { TYPES } from '../../types';
import { SliceConfig } from '../../domain/Entities';

@injectable()
export class SliceImageUseCase implements ISliceImageUseCase {
  private repository: IFigmaRepository;

  constructor(@inject(TYPES.IFigmaRepository) repository: IFigmaRepository) {
    this.repository = repository;
  }

  async handle(config: SliceConfig): Promise<void> {
    if (config.sliceAllImages) {
      await this.repository.extractImages(config);
    }
    await this.repository.extractSlices(config);
  }
}
