import * as fs from 'fs-extra';
import * as path from 'path';
import { AxiosAdapter, AxiosResponse, AxiosRequestConfig } from 'axios';
import { AssetFormat } from '../../domain/Entities';

export class FigmaMockAdapter {
  public configAdapterOK(lastPath: string): AxiosAdapter {
    const mockData = this.getJson(lastPath);
    const adapter: AxiosAdapter = (config: AxiosRequestConfig) => {
      const response: AxiosResponse = {
        data: mockData,
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
      return Promise.resolve(response);
    };
    return adapter;
  }

  public configAdapterBlob(url: string, ext: AssetFormat): AxiosAdapter {
    const basename = path.basename(url);
    const fileName = basename.split('?')[0];
    const mockData = this.getBlobData(fileName + '.' + ext.toLowerCase());
    const adapter: AxiosAdapter = (config: AxiosRequestConfig) => {
      const response: AxiosResponse = {
        data: mockData,
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
      return Promise.resolve(response);
    };
    return adapter;
  }

  private getBlobData(lastPath: string): any {
    if (!lastPath) {
      throw new Error('no `lastPath` parameter attain.');
    }
    const filePath = path.resolve(
      process.cwd(),
      path.join('./__tests__/mocks/responses', lastPath),
    );
    const data: any = this.read(filePath);
    if (!data) {
      throw new Error('cannot read file: ' + filePath);
    }
    return data;
  }

  private getJson(lastPath: string): any {
    if (!lastPath) {
      throw new Error('no `lastPath` parameter attain.');
    }
    const filePath = path.resolve(
      process.cwd(),
      path.join('./__tests__/mocks/responses', lastPath),
    );
    const json: any = JSON.parse(this.read(filePath, 'utf8'));
    if (!json) {
      throw new Error('cannot parse json file: ' + filePath);
    }
    return json;
  }

  private read(filePath: string, encoding?: string): string {
    let content = '';
    if (this.check(filePath)) {
      content = fs.readFileSync(filePath, encoding);
    }
    return content;
  }

  private check(filePath): boolean {
    var isExist = false;
    try {
      fs.statSync(filePath);
      isExist = true;
    } catch (err) {
      isExist = false;
    }
    return isExist;
  }
}
