export interface IGenerateProjectUseCase {
  handle(projectname: string, outputDir?: string): Promise<void>;
}
