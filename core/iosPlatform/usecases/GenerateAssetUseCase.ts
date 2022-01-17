import { injectable } from 'inversify';
import { IGenerateAssetUseCase } from '../../domain/Domain';
import { AssetGenerator } from '../applications/AssetGenerator';
import { GenerateConfig } from '../../domain/Entities';

@injectable()
export class GenerateAssetUseCase implements IGenerateAssetUseCase {
  constructor() {}

  async handle(config: GenerateConfig, outputDir?: string): Promise<string> {
    const generator = new AssetGenerator(config, outputDir);
    return generator.generate();
  }
}
