export interface IExtractElementUseCase {
  handle(inputPath: string, outputDir?: string): Promise<void>;
}
