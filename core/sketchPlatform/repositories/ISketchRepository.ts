import * as ns from 'node-sketch';

export interface ISketchRepository {
  getAll(inputPath: string): Promise<any[]>;
  extractAll(inputPath: string, outputDir?: string): Promise<void>;
  extractSlices(inputPath: string, outputDir?: string): Promise<void>;
  extractImages(inputPath: string, outputDir?: string): Promise<void>;
}
