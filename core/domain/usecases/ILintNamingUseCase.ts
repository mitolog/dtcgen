import { LayerName } from '../entities/LayerName';

export interface ILintNamingUseCase {
  handle(inputPath: string): Promise<LayerName[]>;
}
