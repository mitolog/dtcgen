import { LayerName } from '../Entities';

export interface ILintNamingUseCase {
  handle(inputPath: string): Promise<LayerName[]>;
}
