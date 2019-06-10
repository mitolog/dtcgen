export interface ISliceImageUseCase {
  handle(inputPath: string, outputDir?: string): Promise<void>;
}
