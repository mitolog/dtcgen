import { inject, injectable } from 'inversify';
import { IGenericUseCase } from '../../domain/usecases/IGenericUseCase';
import { IGenericRepository } from '../repositories/IGenericRepository';
import { TYPES } from '../../types';

@injectable()
export class GenericUseCase implements IGenericUseCase {
  private repository: IGenericRepository;

  constructor(
    @inject(TYPES.IGenericRepository) repository: IGenericRepository,
  ) {
    this.repository = repository;
  }

  async handle(): Promise<void> {
    await this.repository.prepareSettingFiles();
  }
}
