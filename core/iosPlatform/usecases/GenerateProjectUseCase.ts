import { injectable } from 'inversify';
import { IGenerateProjectUseCase } from '../../domain/Domain';
import { IOSProjectGenerator } from '../applications/IOSProjectGenerator';
import { XcodeProjectGenator } from '../applications/XcodeProjectGenerator';

@injectable()
export class GenerateProjectUseCase implements IGenerateProjectUseCase {
  constructor() {}

  async handle(projectName: string, outputDir?: string): Promise<void> {
    const generator = new IOSProjectGenerator(outputDir);
    generator.generate(projectName);
    const xcodeGen = new XcodeProjectGenator();
    xcodeGen.generate(outputDir);
  }
}
