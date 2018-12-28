import * as fs from 'fs-extra';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { OSType } from '../../domain/entities/OSType';
import { PathManager, OutputType } from '../../utilities/PathManager';
import { HandlebarsHelpers } from '../../utilities/HandlebarsHelpers';

dotenv.config();
if (dotenv.error) {
  throw dotenv.error;
}

export class IOSCodeGenerator {
  constructor() {}

  generate(metadataJsonPath: string): void {
    if (!metadataJsonPath) {
      throw new Error('cannot find directory: ' + metadataJsonPath);
    }
    const sketchData: any[] = JSON.parse(PathManager.read(metadataJsonPath));
    if (!sketchData) return;

    const vcTemplatePath: string = path.join(
      process.env.TEMPLATE_DIR,
      'viewController.hbs',
    );
    const vcTemplate = this.compiledTemplate(vcTemplatePath);

    const containers: any[] = sketchData.filter(
      element => element.id && element.type && element.type === 'Container',
    );

    let outputs = [];
    for (const container of containers) {
      const views = sketchData.filter(
        element => element.containerId && element.containerId === container.id,
      );

      let containerObj = {
        container: container,
        views: views,
      };
      const output = vcTemplate(containerObj);
      const vcFilePath = PathManager.getOutputPath(
        OutputType.sourcecodes,
        true,
        OSType.ios,
        container.name + 'ViewController.swift',
      );
      outputs.push({ filePath: vcFilePath, content: output });
    }

    // viewController毎にviewを書き出し
    for (const output of outputs) {
      fs.writeFileSync(output.filePath, output.content);
    }

    // .xcassetの作成
    const slicesDir = PathManager.getOutputPath(OutputType.slices);
    const assetsDir = PathManager.getOutputPath(
      OutputType.assets,
      true,
      OSType.ios,
    );
    const slices: string[] = fs.readdirSync(slicesDir);
    if (!slices || slices.length <= 0) {
      return;
    }
    slices.forEach(basename => {
      this.generateAssets(path.join(slicesDir, basename), assetsDir);
    });
  }

  /**
   * Private methods
   */

  private generateAssets(originPath: string, destDirOrPath: string) {
    /* 
      filepath の場合、以下を作成:
        filename.imageset/Contents.json
        filename.imageset/filename.ext
    
      directory path の場合、以下を作成:
        dirname/
        dirname/Contents.json (namespace記載のやつ)
    */
    const lastJsonTemplatePath = path.join(
      process.env.TEMPLATE_DIR,
      'lastDirContents.json',
    );
    const lastJsonTemplate = this.compiledTemplate(lastJsonTemplatePath);

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
      const intermediateJsonTemplatePath = path.join(
        process.env.TEMPLATE_DIR,
        'midDirContents.json',
      );
      fs.copyFileSync(intermediateJsonTemplatePath, intermediateJsonPath);

      const components: string[] = fs.readdirSync(originPath);
      components.forEach(component => {
        const newOrigPath = path.join(originPath, component);
        this.generateAssets(newOrigPath, intermediateDirPath);
      });
      return;
    }

    /* deal with file pathes below */
    const parsed = path.parse(originPath);
    const imageSetDir = path.join(destDirOrPath, parsed.name + '.imageset');
    // create imageSetDir directory if needed
    fs.ensureDirSync(imageSetDir);

    // create last directory json
    const lastJsonStr = lastJsonTemplate({ filename: parsed.base });
    fs.writeFileSync(path.join(imageSetDir, 'Contents.json'), lastJsonStr);

    // copy asset data itself
    fs.copyFileSync(originPath, path.join(imageSetDir, parsed.base));
  }

  private compiledTemplate(templatePath: string): any {
    const templateStr = PathManager.read(templatePath);
    if (!templateStr) {
      throw new Error("couldn't get template: " + templatePath);
    }
    return HandlebarsHelpers.handlebars().compile(String(templateStr));
  }
}
