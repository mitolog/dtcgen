export interface IGenerateCodeUseCase {
  handle(outputDir?: string): Promise<void>;
}
