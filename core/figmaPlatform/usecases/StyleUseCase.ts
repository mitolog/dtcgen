import { IFigmaRepository } from '../repositories/IFigmaRepository';
import { inject, injectable } from 'inversify';
import { TYPES } from '../../types';
import { StyleConfig, Styles, StyleType } from '../../domain/Entities';
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
    const styles = new Styles();
    if(!config.styles) return styles;

    // You can retrieve a json that includes nodes used for each styles defined on team library.
    // The style includes not only colors but also texts and effects.
    // You can distinct style type by `style_type`
    const figmaFiles: object[] = await this.repository.extractStyles(config);

    // translate to color style if enabled
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
