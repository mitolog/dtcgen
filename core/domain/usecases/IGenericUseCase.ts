export interface IGenericUseCase {
  handle(): Promise<void>;
}
