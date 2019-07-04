import * as dotenv from 'dotenv';
import { injectable } from 'inversify';
import { AssetFormat, SliceConfig } from '../../Domain/Entities';
import { AxiosRequestConfig, Method, ResponseType } from 'axios';
import { IFigmaConfig } from '../FigmaPlatform';
import { FigmaMockAdapter } from './figmaMockAdapter';

dotenv.config();
if (dotenv.error) {
  throw dotenv.error;
}

@injectable()
export class FigmaConfigMock implements IFigmaConfig {
  fileKey?: string;
  token?: string;
  sliceConfig?: SliceConfig;
  adapter: FigmaMockAdapter;

  init(sliceConfig?: SliceConfig) {
    this.sliceConfig = sliceConfig;

    this.fileKey = 'RL6HzoX6UeVaQw4OmSsqxr'; //process.env.FIGMA_FILE_KEY;
    if (!this.fileKey) {
      throw new Error('no fileKey found');
    }
    this.token = process.env.FIGMA_ACCESS_TOKEN;
    if (!this.token) {
      throw new Error('no token found');
    }

    this.adapter = new FigmaMockAdapter();
  }

  setSliceConfig(config: SliceConfig) {
    this.sliceConfig = config;
  }

  // curl -H 'X-FIGMA-TOKEN: xxxx' 'https://api.figma.com/v1/files/RL6HzoX6UeVaQw4OmSsqxr' > mockSampleFigma.json
  filesConfig(): AxiosRequestConfig {
    return {
      url: `/files/${this.fileKey}`,
      method: 'get',
      baseURL: 'https://api.figma.com/v1/',
      headers: {
        'X-FIGMA-TOKEN': this.token,
      },
      adapter: this.adapter.configAdapterOK('figmaFile.json'),
    };
  }

  // curl -H 'X-FIGMA-TOKEN: xxxx' 'https://api.figma.com/v1/images/S63Ch0fsfmOUJjjdz53QrZm3?ids=0:331,0:332&format=pdf&svg_include_id=true'
  imagesConfig(ids: string[]): AxiosRequestConfig {
    return {
      url: `/images/${this.fileKey}`,
      method: 'get',
      params: {
        ids: ids.join(','),
        format: this.sliceConfig.extension.toLowerCase(),
        svg_include_id: true,
      },
      baseURL: 'https://api.figma.com/v1/',
      headers: {
        'X-FIGMA-TOKEN': this.token,
      },
      adapter: this.adapter.configAdapterOK('figmaImages.json'),
    };
  }

  // curl -H 'X-FIGMA-TOKEN: xxxx' 'https://api.figma.com/v1/files/RL6HzoX6UeVaQw4OmSsqxr/images' > mockImageFills.json
  imageFillsConfig(): AxiosRequestConfig {
    return {
      url: `/files/${this.fileKey}/images`,
      method: 'get',
      baseURL: 'https://api.figma.com/v1/',
      headers: {
        'X-FIGMA-TOKEN': this.token,
      },
      adapter: this.adapter.configAdapterOK('imageFills.json'),
    };
  }

  getS3Image(url: string, ext: AssetFormat, id?: string): AxiosRequestConfig {
    const config = {
      url: url,
      method: 'get' as Method,
      adapter: this.adapter.configAdapterBlob(url, ext),
    };

    var headers = {};
    var responseType: ResponseType = 'blob';
    switch (ext.toLowerCase()) {
      case AssetFormat.PDF:
        headers['Content-Type'] = 'application/pdf';
        responseType = 'blob';
        break;
      case AssetFormat.PNG:
        headers['Content-Type'] = 'image/png';
        responseType = 'arraybuffer';
        break;
      case AssetFormat.SVG:
        headers['Content-Type'] = 'image/svg+xml';
        responseType = 'blob';
        break;
    }
    config['responseType'] = responseType;
    config['headers'] = headers;
    if (id) {
      config['params'] = { id: id };
    }
    return config;
  }
}
