import { IExtractElementUseCase } from '../../domain/usecases/IExtractElementUseCase';
import { ISketchRepository } from '../repositories/SketchRepository';
import { ISketchPresenter } from '../presenters/SketchPresenter';
import { SketchLayerType } from '../entities/SketchLayerType';
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

  async handle(): Promise<Node[]> {
    // 取り合えず artboardのみ
    const nodes = await this.repository.extractAll();
    //const layers = this.presenter.translate(nodes);
    return nodes;
  }
}
