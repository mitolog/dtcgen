import { ISketchRepository } from '../repositories/ISketchRepository';
import { inject, injectable } from 'inversify';
import { TYPES } from '../../types';
import { StyleConfig, Styles } from '../../domain/Entities';
import { IStyleUseCase } from '../../domain/Domain';
import { ISketchPresenter } from '../presenters/SketchPresenter';

@injectable()
export class StyleUseCase implements IStyleUseCase {
  private repository: ISketchRepository;
  private presenter: ISketchPresenter;

  constructor(
    @inject(TYPES.ISketchRepository) repository: ISketchRepository,
    @inject(TYPES.ISketchPresenter) presenter: ISketchPresenter,
  ) {
    this.repository = repository;
    this.presenter = presenter;
  }

  async handle(config: StyleConfig): Promise<Styles> {
    // extract
    const styleSymbols: object[] = await this.repository.extractStyles(config);
    // translate
    const styles = new Styles();
    const newStyles = await this.presenter.translateToStyle(
      styleSymbols,
      config,
    );
    styles.add(newStyles);

    return styles;
  }
}
