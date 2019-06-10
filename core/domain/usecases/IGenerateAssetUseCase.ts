export interface IGenerateAssetUseCase {
  handle(outputDir?: string): Promise<void>;
}
