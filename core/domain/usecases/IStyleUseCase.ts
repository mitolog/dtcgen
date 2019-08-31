import { StyleConfig } from '../Entities';
export interface IStyleUseCase {
  handle(config: StyleConfig): Promise<void>;
}
