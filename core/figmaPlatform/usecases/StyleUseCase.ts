import { IFigmaRepository } from '../repositories/IFigmaRepository';
import { inject, injectable } from 'inversify';
import { TYPES } from '../../types';
import { StyleConfig } from '../../domain/Entities';
import { IStyleUseCase } from '../../domain/Domain';

@injectable()
export class StyleUseCase implements IStyleUseCase {
  private repository: IFigmaRepository;

  constructor(@inject(TYPES.IFigmaRepository) repository: IFigmaRepository) {
    this.repository = repository;
  }

  async handle(config: StyleConfig): Promise<void> {
    await this.repository.extractStyles(config);
  }
}
