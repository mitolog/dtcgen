import { DesignToolType } from '../entities/DesignToolType';
import { OSType } from '../entities/OSType';

export interface IGenerateCodeUseCase {
  handle(designTool: DesignToolType, osType: OSType): Promise<void>;
}
