import axios, { AxiosRequestConfig, AxiosPromise, AxiosResponse } from 'axios';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as _ from 'lodash';
import { injectable, inject } from 'inversify';
import { IFigmaRepository } from './IFigmaRepository';
import { PathManager, OutputType } from '../../utilities/Utilities';
import { isString } from 'util';
import {
  SliceConfig,
  AssetFormat,
  StyleConfig,
  OSType,
} from '../../domain/Entities';
import { IFigmaConfig, GetNodesParams } from '../entities/IFigmaConfig';
import { TYPES } from '../../types';

@injectable()
export class FigmaRepository implements IFigmaRepository {
  figmaConfig: IFigmaConfig;

  constructor(@inject(TYPES.IFigmaConfig) config: IFigmaConfig) {
    this.figmaConfig = config;
    this.figmaConfig.init();
  }

  async extractSlices(sliceConfig: SliceConfig): Promise<void> {
    if (!sliceConfig) {
      throw new Error('no `sliceConfig` parameter is set.');
    }
    this.figmaConfig.setSliceConfig(sliceConfig);

    const pathManager = new PathManager(sliceConfig.outputDir);
    const keywords = sliceConfig.keywords || null;
    let scales = sliceConfig.scales || null;
    const format = sliceConfig.extension;
    if (!keywords || !scales) return;

    const outputDir = pathManager.getOutputPath(OutputType.slices, true);

    // figmaFileを取得(もしなければHTTP GETで取得してくる)
    var fileData = await this.getFigmaFile(pathManager);

    // keywordが含まれるcomponentsを抽出する
    const components = fileData['components'] || null;
    if (!components) {
      throw new Error('no figma components found.');
    }
    const keys = Object.keys(components);
    const targets: { [s: string]: string } = {};
    const matchOption: string = sliceConfig.caseSensitive ? 'i' : '';
    for (const compId of keys) {
      const comp = components[compId];
      const name = comp['name'] || null;
      if (!name || !isString(name) || name.length <= 0) continue;
      const matched = keywords.filter(keyword => {
        return name.match(new RegExp(keyword, matchOption));
      });
      if (matched && matched.length) {
        targets[compId] = name;
      }
    }
    if (!targets || Object.keys(targets).length <= 0) return;

    var imageUrlsResults: AxiosResponse<any>[] = [];
    try {
      if (format.toLowerCase() !== AssetFormat.PNG) {
        scales = [1]; // other than png don't need scales, because it's vector data.
      }
      for (const scale of scales) {
        const imageUrlsResult = await axios(
          this.figmaConfig.imagesConfig(Object.keys(targets), scale),
        );
        imageUrlsResults.push(imageUrlsResult);
      }
    } catch (error) {
      throw new Error(error);
    }

    if (!imageUrlsResults) {
      throw new Error('something wrong with retrieving images urls.');
    }

    // targetsに格納されたidで axis.getしてjsonを取得
    const allScaleImages: AxiosResponse<any>[] = [];
    for (const imageUrlsResult of imageUrlsResults) {
      const images: AxiosResponse<any>[] | null = await this.downloadImages(
        imageUrlsResult,
        'data.images',
        true,
        sliceConfig.extension,
      );
      if (!images) {
        throw new Error('something wrong with donwloading images.');
      }
      allScaleImages.push(...images);
    }

    const errors: string[] = [];
    for (const res of allScaleImages) {
      // confirm if requested image is attained correctly.
      const imageId = res.config.params['id'];
      if (!imageId) {
        throw new Error('some download seems to be failed.');
      }
      let name: string = targets[imageId];
      const scale = res.config.params['scale'];
      if (!name) {
        errors.push(imageId);
        continue;
      }

      // we use iOS notation here. you should change name if you want
      // on each platform (for example, within `AssetGenerator.ts`)
      name += '@' + scale + 'x';

      let destPath = await this.createDirIfNeeded(outputDir, name);
      const ext = sliceConfig.extension;
      await fs.writeFile(destPath + '.' + ext.toLowerCase(), res.data);
    }

    if (errors.length > 0) {
      throw new Error(`slice image download error on ids: ${errors.join(',')}`);
    }
  }

  async extractImages(config: SliceConfig): Promise<void> {
    if (!config) {
      throw new Error('no `sliceConfig` parameter is set.');
    }
    var imageFillsResult: AxiosResponse<any> = null;
    try {
      // retrieve all image resources within the figma file.
      imageFillsResult = await axios(this.figmaConfig.imageFillsConfig());
    } catch (error) {
      throw new Error(error);
    }

    const images = await this.downloadImages(
      imageFillsResult,
      'data.meta.images',
      false,
      AssetFormat.PNG,
    );
    if (!images) {
      throw new Error(
        'something wrong with donwloading images. maybe objecgt key path is wrong?',
      );
    }

    const pathManager = new PathManager(config.outputDir);
    const outputDir = pathManager.getOutputPath(OutputType.images, true);
    const imagesObj = _.get(imageFillsResult, 'data.meta.images', null);
    const invertedImagesObj = _.invert(imagesObj);
    const errorImageUrls: string[] = [];
    for (const res of images) {
      const url: string = res.config.url;
      if (!url) {
        errorImageUrls.push(url);
        continue;
      }
      const name: string = invertedImagesObj[url];
      if (!name) {
        errorImageUrls.push(url);
        continue;
      }
      const destPath = await this.createDirIfNeeded(outputDir, name);
      try {
        await fs.writeFile(
          destPath + '.' + AssetFormat.PNG.toLowerCase(),
          res.data,
          { encoding: 'binary' },
        );
      } catch (error) {
        throw new Error(error);
      }
    }

    if (errorImageUrls.length > 0) {
      throw new Error(
        `some images are not correctly output: ${errorImageUrls.join(',')}`,
      );
    }
  }

  async extractStyles(config: StyleConfig): Promise<object[]> {
    // retreave all team styles
    const stylesResult = await axios(
      this.figmaConfig.stylesConfig(config.teamId),
    );
    const styles = _.get(stylesResult, 'data.meta.styles', null);
    if (!styles) {
      return [];
    }

    return await this.extractFilesOfNodesByStyles(styles);
  }

  /// extract all files that consist of nodes that styles are originally defined
  private async extractFilesOfNodesByStyles(styles: object[]): Promise<object[]> {

    const styleMap: { [s: string]: GetNodesParams[] } = {};
    styles.forEach(style => {
      const param: GetNodesParams = {
        fileKey: style['file_key'],
        nodeId: style['node_id'],
        name: style['name'],
      };
      const fileKey = param.fileKey;
      const params = styleMap[fileKey];
      if (!params) {
        styleMap[fileKey] = [param];
      } else {
        styleMap[fileKey].push(param);
      }
    });

    // Get nodes per file
    const files: object[] = [];
    for (const fileKey of Object.keys(styleMap)) {
      const params: GetNodesParams[] = styleMap[fileKey];
      const nodesResult = await axios(this.figmaConfig.nodesConfig(params));
      const jsonData = nodesResult.data || null;
      if (!jsonData) continue;

      // combine style fields into original nodes here
      const nodes = jsonData['nodes'];
      if (!nodes) continue;
      for (let [key, value] of Object.entries(nodes)) {
        let node = value['document'];
        if(!node) continue;
        const matchedStyle = styles.find(style =>
          style['file_key'] === fileKey && style['node_id'] === node['id']
        );
        if (matchedStyle) {
          node['style_name'] = matchedStyle['name'];
          node['style_type'] = matchedStyle['style_type'];
          nodes[key]['document'] = node;
        }
      }

      files.push(jsonData);
    }
    return files;
  }

  private async createDirIfNeeded(dirPath: string, name: string) {
    var destDir: string = dirPath;
    var lastComponentName: string = name.replace(/\s+/g, '');
    // need-to-test: check if both dir version and not dir version
    const dirMatches: RegExpMatchArray = name.match(/\//g);
    if (dirMatches && dirMatches.length > 0) {
      const newDir = name.replace(/\s+/g, '');
      destDir = path.join(dirPath, path.dirname(newDir));
      await fs.ensureDir(destDir);
      lastComponentName = name
        .split('/')
        [dirMatches.length].replace(/\s+/g, '');
    }
    return path.join(destDir, lastComponentName);
  }

  private async downloadImages(
    response: AxiosResponse<any>,
    keyPathToImages: string,
    addParams: boolean,
    ext: AssetFormat,
  ): Promise<AxiosResponse<any>[] | null> {
    const imageUrlsObj: Object = _.get(response, keyPathToImages, null);
    if (!imageUrlsObj) return null;

    const scale = _.get(response, 'config.params.scale', null);

    const getS3Promises: AxiosPromise[] = [];
    for (const id of Object.keys(imageUrlsObj)) {
      const url = imageUrlsObj[id];
      const config = addParams
        ? this.figmaConfig.getS3Image(url, ext, { id: id, scale: scale })
        : this.figmaConfig.getS3Image(url, ext);
      getS3Promises.push(axios(config));
    }

    let images: AxiosResponse<any>[] = [];
    try {
      images = await axios.all(getS3Promises);
    } catch (error) {
      // if any error status response happens, it comes to here.
      throw new Error(error);
    }
    return images;
  }

  private async getFigmaFile(pathManager: PathManager): Promise<Object> {
    const filePath = pathManager.getOutputPath(OutputType.figmaTree, true);

    var fileData: Object;
    // TBD: read from cache
    // if (await fs.pathExists(filePath)) {
    //   fileData = pathManager.getJson(OutputType.figmaTree);
    //   return fileData;
    // }

    // if not exist, retrieve via figma API.
    try {
      const filesResult = await axios(this.figmaConfig.filesConfig());
      fileData = filesResult.data;
    } catch (error) {
      throw new Error(error);
    }

    if (!fileData) {
      throw new Error('no figma files found.');
    }

    await fs.writeFile(filePath, JSON.stringify(fileData));
    return fileData;
  }
}
