import { SliceConfig } from '../../domain/Entities';

export interface IFigmaRepository {
  extractSlices(config: SliceConfig): Promise<void>;
  extractImages(config: SliceConfig): Promise<void>;
}
