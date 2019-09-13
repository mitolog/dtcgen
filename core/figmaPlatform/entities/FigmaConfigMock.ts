import * as dotenv from 'dotenv';
import { injectable } from 'inversify';
import { AssetFormat, SliceConfig } from '../../Domain/Entities';
import { AxiosRequestConfig, Method, ResponseType } from 'axios';
import { IFigmaConfig, GetS3ImageParams } from '../FigmaPlatform';
import { FigmaMockAdapter } from './figmaMockAdapter';
import { GetNodesParams } from './IFigmaConfig';

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
  imagesConfig(ids: string[], scale: number): AxiosRequestConfig {
    const isSingleScale =
      this.sliceConfig.extension.toLowerCase() !== AssetFormat.PNG;
    const adapterFileName = isSingleScale
      ? 'figmaImages_pdf.json'
      : 'figmaImages_png.json';

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
      adapter: this.adapter.configAdapterOK(adapterFileName),
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

  getS3Image(
    url: string,
    ext: AssetFormat,
    params?: GetS3ImageParams,
  ): AxiosRequestConfig {
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
    if (params) {
      config['params'] = params;
    }
    return config;
  }

  // curl -H 'X-FIGMA-TOKEN: xxxxx' 'https://api.figma.com/v1/teams/748971045105836585/styles' > figmaStyles.json
  stylesConfig(teamId: string): AxiosRequestConfig {
    return {
      url: `/teams/${teamId}/styles`,
      method: 'get',
      baseURL: 'https://api.figma.com/v1/',
      headers: {
        'X-FIGMA-TOKEN': this.token,
      },
      adapter: this.adapter.configAdapterOK('figmaStyles.json'),
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
      adapter: this.adapter.configAdapterOK('figmaNodeIds.json'),
    };
  }
}
