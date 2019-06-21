import { SliceConfig } from '../Entities';
export interface ISliceImageUseCase {
  handle(config: SliceConfig): Promise<void>;
}
