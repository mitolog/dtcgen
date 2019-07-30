import { AssetFormat, SliceConfig } from '../../domain/Entities';
import { AxiosRequestConfig } from 'axios';

export type GetS3ImageParams = {
  id: string;
  scale: number;
};

export interface IFigmaConfig {
  setSliceConfig(config: SliceConfig): void;
  init(sliceConfig?: SliceConfig): void;
  filesConfig(): AxiosRequestConfig;
  imagesConfig(ids: string[], scale: number): AxiosRequestConfig;
  imageFillsConfig(): AxiosRequestConfig;
  getS3Image(
    url: string,
    ext: AssetFormat,
    params?: GetS3ImageParams,
  ): AxiosRequestConfig;
}
