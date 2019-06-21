import { ISliceImageUseCase } from '../../domain/usecases/ISliceImageUseCase';
import { ISketchRepository } from '../repositories/ISketchRepository';
import { inject, injectable } from 'inversify';
import { TYPES } from '../../types';
import { SliceConfig } from '../../domain/Entities';

@injectable()
export class SliceImageUseCase implements ISliceImageUseCase {
  private repository: ISketchRepository;

  constructor(@inject(TYPES.ISketchRepository) repository: ISketchRepository) {
    this.repository = repository;
  }

  async handle(config: SliceConfig): Promise<void> {
    await this.repository.extractImages(config);
    await this.repository.extractSlices(config);
  }
}
