import * as fs from 'fs-extra';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { OSType } from '../../domain/entities/OSType';
import { PathManager, OutputType } from '../../utilities/PathManager';
import { HandlebarsHelpers } from '../../utilities/HandlebarsHelpers';
import { ElementType } from '../../domain/entities/ElementType';

dotenv.config();
if (dotenv.error) {
  throw dotenv.error;
}

export class IOSCodeGenerator {
  private pathManager: PathManager;
  private projectTemplateRootDir: string;

  constructor(outputDir?: string) {
    this.pathManager = new PathManager(outputDir);
    const templatePath = path.isAbsolute(process.env.TEMPLATE_DIR)
      ? process.env.TEMPLATE_DIR
      : path.resolve(process.cwd(), process.env.TEMPLATE_DIR);
    this.projectTemplateRootDir = path.join(
      templatePath,
      OSType.ios,
      'XcodeProjectTemplate',
    );
  }

  generate(): void {
    const metadataJsonPath = this.pathManager.getOutputPath(
      OutputType.metadata,
    );
    if (!metadataJsonPath) {
      throw new Error('cannot find directory: ' + metadataJsonPath);
    }
    const sketchData: any[] = JSON.parse(
      this.pathManager.read(metadataJsonPath),
    );
    if (!sketchData) return;

    // 1. XcodeProjectTemplateディレクトリそのものをすべて `generated/ios/XcodeProject` にコピー
    // 2. topディレクトリで `projectName` の文言が含まれるディレクトリは optionでもらった名前に変更
    // 3.
    //
    //

    // copy directory to geenerated
    const templateDestDir = this.pathManager.getOutputPath(
      OutputType.sourcecodes,
      true,
      OSType.ios,
      '',
    );
    fs.copySync(this.projectTemplateRootDir, path.join(templateDestDir));

    // rename directories

    // const vcTemplatePath: string = path.join(
    //   this.projectTemplateRootDir,
    //   'viewController.hbs',
    // );
    // const vcTemplate = this.compiledTemplate(vcTemplatePath);

    // const containers: any[] = sketchData.filter(
    //   element =>
    //     element.id &&
    //     element.type &&
    //     element.type === <string>ElementType.Container,
    // );

    // let outputs = [];
    // let vcNames: Object[] = [];
    // for (const container of containers) {
    //   const views = sketchData.filter(
    //     element => element.containerId && element.containerId === container.id,
    //   );

    //   let containerObj = {
    //     container: container,
    //     views: views,
    //   };
    //   const output = vcTemplate(containerObj);
    //   const vcFilePath = this.pathManager.getOutputPath(
    //     OutputType.sourcecodes,
    //     true,
    //     OSType.ios,
    //     container.name + 'ViewController.swift',
    //   );
    //   outputs.push({ filePath: vcFilePath, content: output });
    //   vcNames.push({ name: path.parse(vcFilePath).name });
    // }

    // // viewController毎にviewを書き出し
    // for (const output of outputs) {
    //   fs.writeFileSync(output.filePath, output.content);
    // }

    // // 各viewControllerを確認するためのviewControllerを書き出し
    // const baseVcFilePath = this.pathManager.getOutputPath(
    //   OutputType.sourcecodes,
    //   true,
    //   OSType.ios,
    //   'ViewController.swift',
    // );
    // const baseVcTemplatePath: string = path.join(
    //   this.templateDir,
    //   'baseViewController.hbs',
    // );
    // const baseVcTemplate = this.compiledTemplate(baseVcTemplatePath);
    // const baseVcOutput = baseVcTemplate({ viewControllers: vcNames });
    // fs.writeFileSync(baseVcFilePath, baseVcOutput);

    // // .xcassetの作成
    // const slicesDir = this.pathManager.getOutputPath(OutputType.slices);
    // const assetsDir = this.pathManager.getOutputPath(
    //   OutputType.assets,
    //   true,
    //   OSType.ios,
    // );
    // const slices: string[] = fs.readdirSync(slicesDir);
    // if (!slices || slices.length <= 0) {
    //   return;
    // }
    // slices.forEach(basename => {
    //   this.generateAssets(path.join(slicesDir, basename), assetsDir);
    // });

    // // appIconのコピー
    // const appIconTemplatePath: string = path.join(
    //   this.templateDir,
    //   'appIcon.json',
    // );
    // const appIconJson = this.pathManager.read(appIconTemplatePath);
    // const appIconPath = this.pathManager.getOutputPath(
    //   OutputType.appicons,
    //   true,
    //   OSType.ios,
    // );
    // fs.writeFileSync(appIconPath, appIconJson);

    // // imagesのコピー
    // // 1. metadataを取得し、imageNameがついてるやつをfilter
    // // 2. imagesディレクトリ配下のファイル名一覧を取得
    // // 3. 1でフィルタしたviewのnameとfile名の最初5文字までフォルダ名兼asset名に. 例)
    // //    Images/Contents.json
    // //    Images/Map_1e02f/Map_1e02f.imageset
    // //    Images/Map_1e02f/Map_1e02f.imageset/Contents.json
    // //    Images/Map_1e02f/Map_1e02f.imageset/1e02fxxxxxxxxxxxxx.png
    // const imageElements = sketchData.filter(
    //   element => element.type === <string>ElementType.Image,
    // );
    // const imagesDir = this.pathManager.getOutputPath(
    //   OutputType.images,
    //   false,
    //   OSType.ios,
    // );
    // this.generateAssets(imagesDir, assetsDir);

    // const imageNames = fs.readdirSync(imagesDir);
    // if (!imageNames || imageNames.length <= 0) {
    //   return;
    // }
    // const imageAssets = imageElements.map(element => {
    //   const imageName = imageNames.find(
    //     imageName => element.imageName === imageName,
    //   );
    //   if (!imageName) return;
    //   const imageAssetObj = {};
    //   imageAssetObj[element.name + '_' + imageName.slice(0, 5)] =
    //     element.imageName;
    //   return imageAssetObj;
    // });
    // imageAssets.forEach(imageAssetObj => {
    //   const basename = Object.keys(imageAssetObj).reduce(
    //     (acc, current) => current,
    //     '',
    //   );
    //   const imageName = imageAssetObj[basename];
    //   const imagesetDir = path.join(assetsDir, 'Images', basename);
    //   const imagesetContentsJson = path.join(imagesetDir, 'Contents.json');
    //   const imagePath = path.join(imagesetDir, imageName);
    // });
  }

  /**
   * Private methods
   */

  // private generateAssets(originPath: string, destDirOrPath: string) {
  //   /*
  //     filepath の場合、以下を作成:
  //       filename.imageset/Contents.json
  //       filename.imageset/filename.ext

  //     directory path の場合、以下を作成:
  //       dirname/
  //       dirname/Contents.json (namespace記載のやつ)
  //   */
  //   const lastJsonTemplatePath = path.join(
  //     this.templateDir,
  //     'lastDirContents.json',
  //   );
  //   const lastJsonTemplate = this.compiledTemplate(lastJsonTemplatePath);

  //   /* deal with directory pathes below */
  //   if (PathManager.isDir(originPath)) {
  //     const intermediateDirPath = path.join(
  //       destDirOrPath,
  //       path.basename(originPath),
  //     );
  //     // create intermediate directory if needed
  //     fs.ensureDirSync(intermediateDirPath);

  //     // create intermediate json
  //     const intermediateJsonPath = path.join(
  //       intermediateDirPath,
  //       'Contents.json', // intermediate json
  //     );
  //     const intermediateJsonTemplatePath = path.join(
  //       this.templateDir,
  //       'midDirContents.json',
  //     );
  //     fs.copyFileSync(intermediateJsonTemplatePath, intermediateJsonPath);

  //     const components: string[] = fs.readdirSync(originPath);
  //     components.forEach(component => {
  //       const newOrigPath = path.join(originPath, component);
  //       this.generateAssets(newOrigPath, intermediateDirPath);
  //     });
  //     return;
  //   }

  //   /* deal with file pathes below */
  //   const parsed = path.parse(originPath);
  //   const imageSetDir = path.join(destDirOrPath, parsed.name + '.imageset');
  //   // create imageSetDir directory if needed
  //   fs.ensureDirSync(imageSetDir);

  //   // create last directory json
  //   const lastJsonStr = lastJsonTemplate({ filename: parsed.base });
  //   fs.writeFileSync(path.join(imageSetDir, 'Contents.json'), lastJsonStr);

  //   // copy asset data itself
  //   fs.copyFileSync(originPath, path.join(imageSetDir, parsed.base));
  // }

  private compiledTemplate(templatePath: string): any {
    const templateStr = this.pathManager.read(templatePath);
    if (!templateStr) {
      throw new Error("couldn't get template: " + templatePath);
    }
    return HandlebarsHelpers.handlebars().compile(String(templateStr));
  }
}
