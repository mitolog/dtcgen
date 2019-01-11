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

export class IOSProjectGenerator {
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

  generate(projectName: string): void {
    if (
      !projectName ||
      projectName.length <= 0 ||
      projectName.trim().length <= 0
    ) {
      throw new Error('project name is empty');
    }
    const trimedProjectName = projectName.trim();

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

    const templateDestDir = this.pathManager.getOutputPath(
      OutputType.sourcecodes,
      true,
      OSType.ios,
      'XcodeProject',
    );

    // remove all files first
    fs.removeSync(templateDestDir);

    // copy directory to geenerated
    fs.copySync(this.projectTemplateRootDir, templateDestDir);

    // rename top directory names
    this.renameDirectories(templateDestDir, trimedProjectName);

    // deal with project.yml
    this.generateProjectYml(templateDestDir, {
      projectName: trimedProjectName,
    });

    // deal with *Tests directories
    this.generateTests(templateDestDir, { projectName: trimedProjectName });

    // deal with assets
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
  }

  /**
   * Private methods
   */

  /**
   *
   * @param directory directory to rename
   * @param toName name directory to be changed
   * @param recursive if true, recursively rename. default true.
   * @return void
   */
  private renameDirectories(
    directory: string,
    toName: string,
    renameFile: boolean = true,
    recursive: boolean = true,
  ): void {
    if (!PathManager.isDir(directory)) return;

    let dirContents: string[] = fs.readdirSync(directory);
    dirContents
      .filter(dirOrFile => {
        const isDir = PathManager.isDir(path.join(directory, dirOrFile));
        const nameMatched = dirOrFile.match(/projectName/g);
        return isDir && nameMatched;
      })
      .forEach(matchedDirName => {
        const newDirName = matchedDirName.replace(/projectName/g, toName);
        const origDir = path.join(directory, matchedDirName);
        const newDir = path.join(directory, newDirName);
        fs.moveSync(origDir, newDir, { overwrite: true });

        if (renameFile) {
          this.renameFiles(newDir, toName);
        }
        if (recursive) {
          this.renameDirectories(
            path.join(directory, newDirName),
            toName,
            recursive,
          );
        }
      });
  }

  private renameFiles(directory: string, toName: string): void {
    if (!PathManager.isDir(directory)) return;

    let dirContents: string[] = fs.readdirSync(directory);
    dirContents
      .filter(dirOrFile => {
        const isDir = PathManager.isDir(path.join(directory, dirOrFile));
        const nameMatched = dirOrFile.match(/projectName/g);
        return !isDir && nameMatched;
      })
      .forEach(matchedFileName => {
        const newFileName = matchedFileName.replace(/projectName/g, toName);
        const origFile = path.join(directory, matchedFileName);
        const newFile = path.join(directory, newFileName);
        fs.moveSync(origFile, newFile, { overwrite: true });
      });
  }

  private generateTests(searchDir: string, data: Object) {
    if (!PathManager.isDir(searchDir)) return;

    const baseDirContents = fs.readdirSync(searchDir);
    baseDirContents
      .filter(dirOrFile => {
        const isDir = PathManager.isDir(path.join(searchDir, dirOrFile));
        const isMatched = dirOrFile.match(/Tests.*hbs$/);
        if (isDir) {
          this.generateTests(path.join(searchDir, dirOrFile), data);
        }
        return !isDir && isMatched;
      })
      .forEach(testFileName => {
        const testFilePath = path.join(searchDir, testFileName);
        const testTemplate = this.compiledTemplate(testFilePath);
        const output = testTemplate(data);
        const sliceCnt = path.parse(testFilePath).ext.length;
        const newPath = testFilePath.slice(0, -sliceCnt);

        fs.removeSync(testFilePath);
        fs.writeFileSync(newPath, output);
      });
  }

  private generateProjectYml(searchDir: string, data: Object) {
    if (!PathManager.isDir(searchDir)) return;

    const baseDirContents = fs.readdirSync(searchDir);
    baseDirContents
      .filter(dirOrFile => {
        const isDir = PathManager.isDir(path.join(searchDir, dirOrFile));
        const isMatched = dirOrFile.match(/project\.yml\.hbs/);
        if (isDir) {
          this.generateProjectYml(path.join(searchDir, dirOrFile), data);
        }
        return !isDir && isMatched;
      })
      .forEach(fileName => {
        const filePath = path.join(searchDir, fileName);
        const template = this.compiledTemplate(filePath);
        const output = template(data);
        const sliceCnt = path.parse(filePath).ext.length;
        const newPath = filePath.slice(0, -sliceCnt);

        fs.removeSync(filePath);
        fs.writeFileSync(newPath, output);
      });
  }

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
