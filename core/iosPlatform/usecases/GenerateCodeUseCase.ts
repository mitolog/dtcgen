import { injectable } from 'inversify';
import { IGenerateCodeUseCase } from '../../domain/Domain';
import { IOSCodeGenerator } from '../applications/IOSCodeGenerator';

@injectable()
export class GenerateCodeUseCase implements IGenerateCodeUseCase {
  constructor() {}

  async handle(outputDir?: string): Promise<void> {
    const generator = new IOSCodeGenerator(outputDir);
    generator.generate();
  }
}
