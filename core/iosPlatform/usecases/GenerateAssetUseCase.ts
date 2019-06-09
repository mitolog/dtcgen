import { injectable } from 'inversify';
import { IGenerateAssetUseCase } from '../../domain/Domain';
import { AssetGenerator } from '../applications/AssetGenerator';

@injectable()
export class GenerateAssetUseCase implements IGenerateAssetUseCase {
  constructor() {}

  async handle(outputDir?: string): Promise<void> {
    const generator = new AssetGenerator(outputDir);
    generator.generate();
  }
}
