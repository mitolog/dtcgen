import { ISketchRepository } from './ISketchRepository';
import { injectable } from 'inversify';

@injectable()
export class ThrowExeptionSketchRepository implements ISketchRepository {
  getAll(inputPath: string): Promise<any[]> {
    throw new Error('Method not implemented.');
  }
  extractAll(inputPath: string, outputDir?: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
  extractSlices(inputPath: string, outputDir?: string): Promise<void> {
    throw new Error('`inputPath` is not provided.');
  }
  extractImages(inputPath: string, outputDir?: string): Promise<void> {
    throw new Error('`inputPath` is not provided.');
  }
}
