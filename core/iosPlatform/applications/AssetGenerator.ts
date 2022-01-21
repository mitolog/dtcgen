import * as fs from 'fs-extra';
import * as dotenv from 'dotenv';
import * as path from 'path';
import {
  OSType,
  GenerateConfig,
  SliceConfig,
  AssetFormat,
  DesignToolType,
  Color,
} from '../../domain/Entities';
import {
  PathManager,
  OutputType,
  HandlebarsHelpers,
  HandlebarsPartials,
} from '../../utilities/Utilities';
import {
  LastDirContent,
  LastDirImageContent,
} from '../entities/AssetGeneratorTypes';

dotenv.config();
if (dotenv.error) {
  throw dotenv.error;
}

export enum XcAssetType {
  image,
  color,
}
export class XcAssetJsonPaths {
  intermediate: string;
  last: string;
  assetType: XcAssetType;
}

export class AssetGenerator {
  private pathManager: PathManager;
  private projectTemplateRootDir: string;
  private templateHelpers: HandlebarsHelpers;
  private config: GenerateConfig;

  constructor(config: GenerateConfig, outputDir?: string) {
    this.config = config;
    this.pathManager = new PathManager(outputDir);
    this.templateHelpers = new HandlebarsHelpers(this.pathManager);

    const projTmplRootDir = this.templateHelpers.templatePathFor(
      OSType.ios,
      'XcodeProjectTemplate',
    );
    this.projectTemplateRootDir = projTmplRootDir;

    const partialTemplateRootDir = this.templateHelpers.templatePathFor(
      OSType.ios,
      'partials',
    );
    HandlebarsPartials.registerPartials(partialTemplateRootDir);
  }

  generate(): string {
    const templateDestDir = this.pathManager.getOutputPath(
      OutputType.sourcecodes,
      true,
      OSType.ios,
      'assets',
    );

    const templateOriginDirs = this.pathManager.searchDirsOrFiles(
      this.projectTemplateRootDir,
      `xcassets$`,
      true,
    );

    if (!templateOriginDirs || templateOriginDirs.length <= 0) {
      throw new Error('no xcassets directory within template.');
    }

    // copy directory to generated
    const assetName = path.basename(templateOriginDirs[0]);
    const dest = path.join(templateDestDir, assetName);
    fs.copySync(templateOriginDirs[0], dest);

    // deal with assets
    return this.generateAssets(templateDestDir);
  }

  public generateAssets(searchDir: string): string {
    if (!PathManager.isDir(searchDir)) {
      throw new Error(`${searchDir} is not a directory.`)
    };

    var result = '';

    // Prepare needed paths/directories
    const imageTemplatePaths: XcAssetJsonPaths = this.getAssetJsonTemplatePaths(
      XcAssetType.image,
    );
    const destDirs = this.pathManager.searchDirsOrFiles(
      searchDir,
      `xcassets$`,
      true,
    );
    if (!destDirs || destDirs.length <= 0) {
      throw new Error('no xcassets directory within a template.');
    }
    const destDir = path.join(destDirs[0], 'DtcGenerated');
    fs.ensureDirSync(destDir);

    fs.copyFileSync(
      imageTemplatePaths.intermediate,
      path.join(destDir, 'Contents.json'),
    );

    // remove unneeded directories
    fs.removeSync(path.join(destDirs[0], 'intermediateDirectory'));

    const sliceConfig: SliceConfig = this.config.sliceConfig || null;
    if (sliceConfig) {

      const slicesDestDir = path.join(destDir, 'slices');
      fs.removeSync(slicesDestDir);
      fs.ensureDirSync(slicesDestDir);
      fs.copyFileSync(
        imageTemplatePaths.intermediate,
        path.join(slicesDestDir, 'Contents.json'),
      );

      /*
      * Copy slices
      */
      const slicesDir = this.pathManager.getOutputPath(OutputType.slices);
      const slices: string[] = fs.readdirSync(slicesDir);
      if (slices && slices.length > 0) {
        slices.forEach(basename => {
          this.generateAssetsFromFiles(
            path.join(slicesDir, basename),
            slicesDestDir,
            imageTemplatePaths,
          );
        });
        result = slicesDestDir;
      }

      /*
      * Copy images
      */
      if (sliceConfig.sliceAllImages) {
        const imagesDir = this.pathManager.getOutputPath(
          OutputType.images,
          false,
          OSType.ios,
        );
        this.generateAssetsFromFiles(imagesDir, slicesDestDir, imageTemplatePaths);
        result = slicesDestDir;
      }
    }

    /**
     * Generate styles
     */
    if (this.config.styleConfig) {
      const styleDestDir = path.join(destDir, 'styles');
      fs.removeSync(styleDestDir);
      fs.ensureDirSync(styleDestDir);
      fs.copyFileSync(
        imageTemplatePaths.intermediate,
        path.join(styleDestDir, 'Contents.json'),
      );
      this.generateStyles(styleDestDir);
      result = styleDestDir;
    }
    return result;
  }

  private generateStyles(destDir: string) {
    const styles = this.config.styleConfig.outputStyles;
    if (!styles) return;

    // color style
    this.generateColorStyle(styles.colors, destDir);
  }

  private createMidJsonIfNeeded(
    dirPath: string,
    rootDir: string,
    templatePaths: XcAssetJsonPaths,
  ) {
    if (dirPath.replace(/\/$/, '') === rootDir.replace(/\/$/, '')) return;

    fs.copyFileSync(
      templatePaths.intermediate,
      path.join(dirPath, 'Contents.json'),
    );

    const upDir = path.join(dirPath, '../').replace(/\/$/, '');
    if (upDir === rootDir.replace(/\/$/, '')) return;
    this.createMidJsonIfNeeded(upDir, rootDir, templatePaths);
  }

  private generateColorStyle(colors: Color[], destDir: string) {
    const templatePaths: XcAssetJsonPaths = this.getAssetJsonTemplatePaths(
      XcAssetType.color,
    );

    const colorsRootDir = destDir;
    for (const color of colors) {
      const name = color.name.replace(/\s+/g, ''); // remove spaces
      if (!name.split('/')) {
        throw new Error('name should not be empty.');
      }
      const lastDirPath = path.join(
        colorsRootDir,
        name.replace(/\/$/, '') + '.colorset',
      );
      // create last dir and intermediate dir if needed
      fs.ensureDirSync(lastDirPath);

      const lastJsonTemplate = this.templateHelpers.compiledTemplate(
        templatePaths.last,
      );
      const lastJsonStr = lastJsonTemplate(color);
      fs.writeFileSync(path.join(lastDirPath, 'Contents.json'), lastJsonStr);

      this.createMidJsonIfNeeded(
        path.join(lastDirPath, '../'),
        destDir,
        templatePaths,
      );
    }
  }

  /**
   * generate ios asset catalog compatible files from extracted files
   * @param srcPath {string} source path, can be filepath or directory path
   * @param destPath {string} normally directory path to output
   * @param templatePaths {XcAssetJsonPaths}
   */
  private generateAssetsFromFiles(
    srcPath: string,
    destPath: string,
    templatePaths: XcAssetJsonPaths,
  ): void {
    /*
      If srcPath is file path, create below:
        filename.imageset/Contents.json
        filename.imageset/filename.ext

      If srcPath is directory path, create below:
        dirname/
        dirname/Contents.json (namespace記載のやつ)
    */
    const lastJsonTemplate = this.templateHelpers.compiledTemplate(
      templatePaths.last,
    );

    /* deal with directory pathes below */
    if (PathManager.isDir(srcPath)) {
      const intermediateDirPath = path.join(destPath, path.basename(srcPath));
      // create intermediate directory if needed
      fs.ensureDirSync(intermediateDirPath);

      // create intermediate json
      const intermediateJsonPath = path.join(
        intermediateDirPath,
        'Contents.json', // intermediate json
      );
      fs.copyFileSync(templatePaths.intermediate, intermediateJsonPath);

      const components: string[] = fs.readdirSync(srcPath);
      components.forEach(component => {
        const newOrigPath = path.join(srcPath, component);
        this.generateAssetsFromFiles(
          newOrigPath,
          intermediateDirPath,
          templatePaths,
        );
      });
      return;
    }

    /* deal with file pathes below */
    const parsed = path.parse(srcPath);
    const assetName = parsed.name.replace(/\s+/g, '');
    // consider scale(like @2x) suffix here
    const suffixRemoved = assetName.replace(/@[1-9]x$/gi, '');
    const imageSetDir = path.join(destPath, suffixRemoved + '.imageset');
    // create imageSetDir directory if needed
    fs.ensureDirSync(imageSetDir);

    // create last directory json
    const scales = this.config.sliceConfig.scales;
    const isSingleScale =
      this.config.sliceConfig.extension.toLowerCase() !== AssetFormat.PNG;
    const images: LastDirImageContent[] = [];
    if (isSingleScale) {
      images.push({ fileName: parsed.base.replace(/\s+/g, '') });
    } else {
      for (const scale of scales) {
        const scaleSuffix = '@' + scale + 'x';
        const fileName =
          assetName.replace(/@[1-9]x$/gi, scaleSuffix) + parsed.ext;
        images.push({ fileName: fileName, scale: scale + 'x' });
      }
    }

    const lastDirContent: LastDirContent = {
      images: images,
      isSingleScale: isSingleScale,
    };
    const lastJsonStr = lastJsonTemplate(lastDirContent);
    fs.writeFileSync(path.join(imageSetDir, 'Contents.json'), lastJsonStr);

    // copy asset data itself
    const assetNameWithExt = assetName + parsed.ext;
    fs.copyFileSync(srcPath, path.join(imageSetDir, assetNameWithExt));
  }

  private getAssetJsonTemplatePaths(assetType: XcAssetType): XcAssetJsonPaths {
    const assetsDir = this.pathManager.searchDirsOrFiles(
      this.projectTemplateRootDir,
      'xcassets$',
      true,
    );
    if (!assetsDir || assetsDir.length <= 0) {
      throw new Error('no .xcassets template directory');
    }

    const templatePaths: XcAssetJsonPaths = new XcAssetJsonPaths();
    const interMediateJsonPath = path.join(
      assetsDir[0],
      'intermediateDirectory',
      'midDirContents.json',
    );

    let lastPath = '';
    switch (assetType) {
      case XcAssetType.image:
        lastPath = 'iconName.imageset/lastDirContents.json.hbs';
        break;
      case XcAssetType.color:
        lastPath = 'colorName.colorset/lastDirContents.json.hbs';
        break;
    }
    const lastJsonPath = path.join(
      assetsDir[0],
      'intermediateDirectory',
      lastPath,
    );
    templatePaths.intermediate = interMediateJsonPath;
    templatePaths.last = lastJsonPath;
    return templatePaths;
  }
}
