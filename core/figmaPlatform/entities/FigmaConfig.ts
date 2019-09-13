import * as dotenv from 'dotenv';
import { injectable } from 'inversify';
import { AssetFormat, SliceConfig } from '../../domain/Entities';
import { AxiosRequestConfig, Method, ResponseType } from 'axios';
import { IFigmaConfig, GetS3ImageParams, GetNodesParams } from './IFigmaConfig';

dotenv.config();
if (dotenv.error) {
  throw dotenv.error;
}

@injectable()
export class FigmaConfig implements IFigmaConfig {
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

  setSliceConfig(config: SliceConfig) {
    this.sliceConfig = config;
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

  imagesConfig(ids: string[], scale: number): AxiosRequestConfig {
    return {
      url: `/images/${this.fileKey}`,
      method: 'get',
      params: {
        ids: ids.join(','),
        scale: scale,
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

  getS3Image(
    url: string,
    ext: AssetFormat,
    params?: GetS3ImageParams,
  ): AxiosRequestConfig {
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
    if (params) {
      config['params'] = params;
    }
    return config;
  }

  stylesConfig(teamId: string): AxiosRequestConfig {
    return {
      url: `/teams/${teamId}/styles`,
      method: 'get',
      baseURL: 'https://api.figma.com/v1/',
      headers: {
        'X-FIGMA-TOKEN': this.token,
      },
    };
  }

  nodesConfig(params: GetNodesParams[]): AxiosRequestConfig {
    const key = params[0].fileKey;
    return {
      url: `/files/${key}/nodes`,
      method: 'get',
      baseURL: 'https://api.figma.com/v1/',
      headers: {
        'X-FIGMA-TOKEN': this.token,
      },
      params: {
        ids: params.map(param => param.nodeId).join(','),
      },
    };
  }
}
