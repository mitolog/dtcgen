import { SliceConfig, StyleConfig } from '../../domain/Entities';

export interface IFigmaRepository {
  extractSlices(config: SliceConfig): Promise<void>;
  extractImages(config: SliceConfig): Promise<void>;
  extractStyles(config: StyleConfig): Promise<void>;
}
