import { StyleConfig, Styles } from '../Entities';
export interface IStyleUseCase {
  handle(config: StyleConfig): Promise<Styles>;
}
