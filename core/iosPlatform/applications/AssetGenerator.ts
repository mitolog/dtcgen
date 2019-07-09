import * as fs from 'fs-extra';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { OSType, GenerateConfig, SliceConfig } from '../../domain/Entities';
import {
  PathManager,
  OutputType,
  HandlebarsHelpers,
  HandlebarsPartials,
} from '../../utilities/Utilities';

dotenv.config();
if (dotenv.error) {
  throw dotenv.error;
}

export class XcAssetJsonPaths {
  intermediate: string;
  last: string;
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

  generate(): void {
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

    // remove all files on destination directory first
    fs.removeSync(templateDestDir);

    // copy directory to geenerated
    const assetName = path.basename(templateOriginDirs[0]);
    const dest = path.join(templateDestDir, assetName);
    fs.copySync(templateOriginDirs[0], dest);

    // deal with assets
    this.generateAssets(templateDestDir);
  }

  public generateAssets(searchDir: string): void {
    if (!PathManager.isDir(searchDir)) return;

    // Prepare needed paths/directories
    const jsonTemplatePaths: XcAssetJsonPaths = this.getAssetJsonTemplatePaths();
    const destDirs = this.pathManager.searchDirsOrFiles(
      searchDir,
      `xcassets$`,
      true,
    );
    if (!destDirs || destDirs.length <= 0) {
      throw new Error('no xcassets directory within template.');
    }
    const destDir = path.join(destDirs[0], 'DtcGenerated');
    fs.ensureDirSync(destDir);

    // remove unneeded directories
    fs.removeSync(path.join(destDirs[0], 'intermediateDirectory'));

    /**
     * Place inermediate json on top of assets generated directory
     */
    fs.copyFileSync(
      jsonTemplatePaths.intermediate,
      path.join(destDir, 'Contents.json'),
    );

    /*
     * Copy icons(slices) 
     */
    const slicesDir = this.pathManager.getOutputPath(OutputType.slices);

    const slices: string[] = fs.readdirSync(slicesDir);
    if (!slices || slices.length <= 0) {
      return;
    }
    slices.forEach(basename => {
      this.generateXcAssets(
        path.join(slicesDir, basename),
        destDir,
        jsonTemplatePaths,
      );
    });

    /* 
     * Copy images
     */
    // will be generated like below:
    // images/Contents.json
    // images/1e02fxxxxxxxxxxxxx.imageset/Contents.json
    // images/1e02fxxxxxxxxxxxxx.imageset/1e02fxxxxxxxxxxxxx.png
    const sliceConfig: SliceConfig = this.config.sliceConfig || null;
    if (!sliceConfig || !sliceConfig.sliceAllImages) return;

    const imagesDir = this.pathManager.getOutputPath(
      OutputType.images,
      false,
      OSType.ios,
    );
    this.generateXcAssets(imagesDir, destDir, jsonTemplatePaths);
  }

  private generateXcAssets(
    originPath: string,
    destDirOrPath: string,
    templatePaths: XcAssetJsonPaths,
  ): void {
    /*
      filepath の場合、以下を作成:
        filename.imageset/Contents.json
        filename.imageset/filename.ext

      directory path の場合、以下を作成:
        dirname/
        dirname/Contents.json (namespace記載のやつ)
    */
    const lastJsonTemplate = this.templateHelpers.compiledTemplate(
      templatePaths.last,
    );

    /* deal with directory pathes below */
    if (PathManager.isDir(originPath)) {
      const intermediateDirPath = path.join(
        destDirOrPath,
        path.basename(originPath),
      );
      // create intermediate directory if needed
      fs.ensureDirSync(intermediateDirPath);

      // create intermediate json
      const intermediateJsonPath = path.join(
        intermediateDirPath,
        'Contents.json', // intermediate json
      );
      fs.copyFileSync(templatePaths.intermediate, intermediateJsonPath);

      const components: string[] = fs.readdirSync(originPath);
      components.forEach(component => {
        const newOrigPath = path.join(originPath, component);
        this.generateXcAssets(newOrigPath, intermediateDirPath, templatePaths);
      });
      return;
    }

    /* deal with file pathes below */
    const parsed = path.parse(originPath);
    const assetName = parsed.name.replace(/\s+/g, '');
    const imageSetDir = path.join(destDirOrPath, assetName + '.imageset');
    // create imageSetDir directory if needed
    fs.ensureDirSync(imageSetDir);

    // create last directory json
    const lastJsonStr = lastJsonTemplate({
      filename: parsed.base.replace(/\s+/g, ''),
    });
    fs.writeFileSync(path.join(imageSetDir, 'Contents.json'), lastJsonStr);

    // copy asset data itself
    const assetNameWithExt = assetName + parsed.ext;
    fs.copyFileSync(originPath, path.join(imageSetDir, assetNameWithExt));
  }

  private getAssetJsonTemplatePaths(): XcAssetJsonPaths {
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
    const lastJsonPath = path.join(
      assetsDir[0],
      'intermediateDirectory',
      'iconName.imageset',
      'lastDirContents.json.hbs',
    );
    templatePaths.intermediate = interMediateJsonPath;
    templatePaths.last = lastJsonPath;
    return templatePaths;
  }
}
