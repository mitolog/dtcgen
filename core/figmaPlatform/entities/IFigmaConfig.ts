import { AssetFormat, SliceConfig } from '../../domain/Entities';
import { AxiosRequestConfig } from 'axios';

export interface IFigmaConfig {
  setSliceConfig(config: SliceConfig): void;
  init(sliceConfig?: SliceConfig): void;
  filesConfig(): AxiosRequestConfig;
  imagesConfig(ids: string[]): AxiosRequestConfig;
  imageFillsConfig(): AxiosRequestConfig;
  getS3Image(url: string, ext: AssetFormat, id?: string): AxiosRequestConfig;
}
