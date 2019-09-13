import { SliceConfig, StyleConfig } from '../../domain/Entities';

export interface ISketchRepository {
  getAll(inputPath: string): Promise<any[]>;
  extractAll(inputPath: string, outputDir?: string): Promise<void>;
  extractSlices(config: SliceConfig): Promise<void>;
  extractImages(config: SliceConfig): Promise<void>;
  extractStyles(config: StyleConfig): Promise<object[]>;
}
