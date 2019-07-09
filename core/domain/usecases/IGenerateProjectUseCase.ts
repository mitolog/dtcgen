import { GenerateConfig } from '../Entities';

export interface IGenerateProjectUseCase {
  handle(
    projectname: string,
    config: GenerateConfig,
    outputDir?: string,
  ): Promise<void>;
}
