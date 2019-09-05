import { IFigmaRepository } from '../repositories/IFigmaRepository';
import { inject, injectable } from 'inversify';
import { TYPES } from '../../types';
import { StyleConfig, Styles } from '../../domain/Entities';
import { IStyleUseCase } from '../../domain/Domain';
import { IFigmaPresenter } from '../presenters/FigmaPresenter';

@injectable()
export class StyleUseCase implements IStyleUseCase {
  private repository: IFigmaRepository;
  private presenter: IFigmaPresenter;

  constructor(
    @inject(TYPES.IFigmaRepository) repository: IFigmaRepository,
    @inject(TYPES.IFigmaPresenter) presenter: IFigmaPresenter,
  ) {
    this.repository = repository;
    this.presenter = presenter;
  }

  async handle(config: StyleConfig): Promise<Styles> {
    // extract
    const figmaFiles: object[] = await this.repository.extractStyles(config);
    // translate
    const styles = new Styles();
    for (const file of figmaFiles) {
      const nodes = file['nodes'];
      if (!nodes) continue;
      const newStyles: Styles = await this.presenter.translateToStyle(
        Object.values(nodes),
        config,
      );
      styles.add(newStyles);
    }

    return styles;
  }
}
