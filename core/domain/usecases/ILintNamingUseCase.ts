import { LayerName } from '../entities/LayerName';

export interface ILintNamingUseCase {
  handle(): Promise<LayerName[]>;
}
