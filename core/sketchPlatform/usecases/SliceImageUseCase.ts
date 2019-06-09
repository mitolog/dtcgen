import { ISliceImageUseCase } from '../../domain/usecases/ISliceImageUseCase';
import { ISketchRepository } from '../repositories/SketchRepository';
import { inject, injectable } from 'inversify';
import { TYPES } from '../../types';

@injectable()
export class SliceImageUseCase implements ISliceImageUseCase {
  private repository: ISketchRepository;

  constructor(@inject(TYPES.ISketchRepository) repository: ISketchRepository) {
    this.repository = repository;
  }

  async handle(inputPath: string, outputDir?: string): Promise<void> {
    await this.repository.extractImages(inputPath, outputDir);
    await this.repository.extractSlices(inputPath, outputDir);
  }
}
