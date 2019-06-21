import * as dotenv from 'dotenv';
import { AssetFormat, SliceConfig } from '../../domain/Entities';
import { AxiosRequestConfig, Method, ResponseType } from 'axios';

dotenv.config();
if (dotenv.error) {
  throw dotenv.error;
}

export class FigmaConfig {
  fileKey?: string;
  token?: string;
  sliceConfig?: SliceConfig;

  init(sliceConfig?: SliceConfig) {
    this.sliceConfig = sliceConfig;

    this.fileKey = process.env.FIGMA_FILE_KEY;
    if (!this.fileKey) {
      throw new Error('no fileKey found');
    }
    this.token = process.env.FIGMA_ACCESS_TOKEN;
    if (!this.token) {
      throw new Error('no token found');
    }
  }

  filesConfig(): AxiosRequestConfig {
    return {
      url: `/files/${this.fileKey}`,
      method: 'get',
      baseURL: 'https://api.figma.com/v1/',
      headers: {
        'X-FIGMA-TOKEN': this.token,
      },
    };
  }

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
    };
  }

  imageFillsConfig(): AxiosRequestConfig {
    return {
      url: `/files/${this.fileKey}/images`,
      method: 'get',
      baseURL: 'https://api.figma.com/v1/',
      headers: {
        'X-FIGMA-TOKEN': this.token,
      },
    };
  }

  getS3Image(url: string, ext: AssetFormat, id?: string): AxiosRequestConfig {
    const config = {
      url: url,
      method: 'get' as Method,
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
