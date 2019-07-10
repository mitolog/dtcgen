import { GenerateConfig } from '../Entities';

export interface IGenerateAssetUseCase {
  handle(config: GenerateConfig, outputDir?: string): Promise<void>;
}
