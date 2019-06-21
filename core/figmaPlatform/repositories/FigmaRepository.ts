import axios, { AxiosRequestConfig, AxiosPromise, AxiosResponse } from 'axios';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as _ from 'lodash';
import { injectable } from 'inversify';
import { IFigmaRepository } from './IFigmaRepository';
import { FigmaConfig } from '../entities/FigmaConfig';
import { PathManager, OutputType } from '../../utilities/Utilities';
import { isString } from 'util';
import { SliceConfig, AssetFormat } from '../../domain/Entities';

@injectable()
export class FigmaRepository implements IFigmaRepository {
  figmaConfig: FigmaConfig;

  constructor() {
    this.figmaConfig = new FigmaConfig();
    this.figmaConfig.init();
  }

  async extractSlices(sliceConfig: SliceConfig): Promise<void> {
    this.figmaConfig.sliceConfig = sliceConfig;

    const pathManager = new PathManager(sliceConfig.outputDir);
    const keywords = sliceConfig.keywords || null;
    if (!keywords) return;

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

    var imageUrlsResult: AxiosResponse<any> = null;
    try {
      imageUrlsResult = await axios(
        this.figmaConfig.imagesConfig(Object.keys(targets)),
      );
    } catch (error) {
      throw new Error(error);
    }

    if (!imageUrlsResult) {
      throw new Error('something wrong with retrieving images urls.');
    }

    // targetsに格納されたidで axis.getしてjsonを取得
    const images = await this.downloadImages(
      imageUrlsResult,
      'data.images',
      true,
      sliceConfig.extension,
    );
    if (!images) {
      throw new Error('something wrong with donwloading images.');
    }

    const errors: string[] = [];
    for (const res of images) {
      // confirm if requested image is attained correctly.
      const imageId = res.config.params['id'];
      if (!imageId) {
        throw new Error('some download seems to be failed.');
      }
      const name: string = targets[imageId];
      if (!name) {
        errors.push(imageId);
        continue;
      }

      const destPath = this.createDirIfNeeded(outputDir, name);
      const ext = sliceConfig.extension || AssetFormat.PDF;
      fs.writeFileSync(destPath + '.' + ext.toLowerCase(), res.data);
    }

    if (errors.length > 0) {
      throw new Error(`slice image download error on ids: ${errors.join(',')}`);
    }
  }

  /// even if config.extension is pdf/svf, `extractImages` extract png, cause it's not vector data.
  async extractImages(config: SliceConfig): Promise<void> {
    var imageFillsResult: AxiosResponse<any> = null;
    try {
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
      const destPath = this.createDirIfNeeded(outputDir, name);
      try {
        fs.writeFileSync(
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

  private createDirIfNeeded(dirPath: string, name: string) {
    var destDir: string = dirPath;
    var lastComponentName: string = name.removeAllWhiteSpaces();
    // need-to-test: check if both dir version and not dir version
    const dirMatches: RegExpMatchArray = name.match(/\//g);
    if (dirMatches && dirMatches.length > 0) {
      const newDir = name.removeAllWhiteSpaces();
      destDir = path.join(dirPath, path.dirname(newDir));
      fs.ensureDirSync(destDir);
      lastComponentName = name
        .split('/')
        [dirMatches.length].removeAllWhiteSpaces();
    }
    return path.join(destDir, lastComponentName);
  }

  private async downloadImages(
    response: AxiosResponse<any>,
    keyPathToImages: string,
    addIdParam: boolean,
    ext: AssetFormat,
  ): Promise<AxiosResponse<any>[] | null> {
    const imageUrlsObj: Object = _.get(response, keyPathToImages, null);
    if (!imageUrlsObj) return null;

    const getS3Promises: AxiosPromise[] = [];
    for (const id of Object.keys(imageUrlsObj)) {
      const url = imageUrlsObj[id];
      const config = addIdParam
        ? this.figmaConfig.getS3Image(url, ext, id)
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
    if (fs.existsSync(filePath)) {
      fileData = pathManager.getJson(OutputType.figmaTree);
      return fileData;
    }

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

    fs.writeFileSync(filePath, JSON.stringify(fileData));
    return fileData;
  }
}
