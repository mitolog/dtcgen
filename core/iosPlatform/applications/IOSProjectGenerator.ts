import * as fs from 'fs-extra';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { OSType } from '../../domain/entities/OSType';
import { PathManager, OutputType } from '../../utilities/PathManager';
import { HandlebarsHelpers } from '../../utilities/HandlebarsHelpers';
import { ElementType } from '../../domain/entities/ElementType';
import { HandlebarsPartials } from '../../utilities/HandlebarsPartials';

dotenv.config();
if (dotenv.error) {
  throw dotenv.error;
}

class XcAssetJsonPaths {
  intermediate: string;
  last: string;
}

class DesignToCodeTemplatePaths {
  containerNameConfig: string;
  designToCodeGenerated: string;
  containerNameViewController: string;
  viewController: string;
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
    const partialTemplateRootDir = path.join(
      templatePath,
      OSType.ios,
      'partials',
    );
    HandlebarsPartials.registerPartials(partialTemplateRootDir);
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

    const projectNameData = { projectName: trimedProjectName };

    // deal with project.yml
    this.searchAndAdoptTemplate(
      templateDestDir,
      `project\.yml\.hbs`,
      projectNameData,
    );

    // deal with *Tests directories
    this.searchAndAdoptTemplate(
      templateDestDir,
      'Tests.*hbs$',
      projectNameData,
    );

    // deal with assets
    this.generateAssets(templateDestDir);

    // deal with sourcecodes
    this.generateSourceCodes(templateDestDir);
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

  /**
   * lookup deeper from `searchDir` and check if file or directory exists
   * matched to `regExpStr`. then adopt `data`.
   * If exists, remove matched files, then create new one sliced last extension.
   * @param searchDir
   * @param regExpStr
   * @param data
   */
  private searchAndAdoptTemplate(
    searchDir: string,
    regExpStr: string,
    data: Object,
  ): void {
    const templatePaths = this.pathManager.searchDirsOrFiles(
      searchDir,
      regExpStr,
      true,
    );
    if (!templatePaths || templatePaths.length <= 0) return;

    templatePaths.forEach(filePath => {
      const template = this.compiledTemplate(filePath);
      const output = template(data);
      const sliceCnt = path.parse(filePath).ext.length;
      const newPath = filePath.slice(0, -sliceCnt);

      fs.removeSync(filePath);
      fs.writeFileSync(newPath, output);
    });
  }

  private generateAssets(searchDir: string): void {
    if (!PathManager.isDir(searchDir)) return;

    // Prepare needed paths/directories
    const jsonTemplatePaths = this.getAssetJsonTemplatePaths();
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
    const lastJsonTemplate = this.compiledTemplate(templatePaths.last);

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
    const imageSetDir = path.join(destDirOrPath, parsed.name + '.imageset');
    // create imageSetDir directory if needed
    fs.ensureDirSync(imageSetDir);

    // create last directory json
    const lastJsonStr = lastJsonTemplate({ filename: parsed.base });
    fs.writeFileSync(path.join(imageSetDir, 'Contents.json'), lastJsonStr);

    // copy asset data itself
    fs.copyFileSync(originPath, path.join(imageSetDir, parsed.base));
  }

  private generateSourceCodes(searchDir: string) {
    const metadataJson = this.getJson(OutputType.metadata);
    const treeJson = this.getJson(OutputType.tree);

    // Prepare needed pathes
    const templatePaths = new DesignToCodeTemplatePaths();

    let tmpRegExpStr = `^containerNameConfig\.swift\.hbs$`;
    let tmpPaths = this.pathManager.searchDirsOrFiles(
      searchDir,
      tmpRegExpStr,
      true,
    );
    if (!tmpPaths || tmpPaths.length <= 0) {
      throw new Error(`${tmpRegExpStr} is not found`);
    }
    templatePaths.containerNameConfig = tmpPaths[0];

    tmpRegExpStr = `^DesignToCode\.generated\.swift\.hbs$`;
    tmpPaths = this.pathManager.searchDirsOrFiles(
      searchDir,
      tmpRegExpStr,
      true,
    );
    if (!tmpPaths || tmpPaths.length <= 0) {
      throw new Error(`${tmpRegExpStr} is not found`);
    }
    templatePaths.designToCodeGenerated = tmpPaths[0];

    tmpRegExpStr = `^containerNameViewController\.swift\.hbs$`;
    tmpPaths = this.pathManager.searchDirsOrFiles(
      searchDir,
      tmpRegExpStr,
      true,
    );
    if (!tmpPaths || tmpPaths.length <= 0) {
      throw new Error(`${tmpRegExpStr} is not found`);
    }
    templatePaths.containerNameViewController = tmpPaths[0];

    tmpRegExpStr = `^viewController\.swift\.hbs$`;
    tmpPaths = this.pathManager.searchDirsOrFiles(
      searchDir,
      tmpRegExpStr,
      true,
    );
    if (!tmpPaths || tmpPaths.length <= 0) {
      throw new Error(`${tmpRegExpStr} is not found`);
    }
    templatePaths.viewController = tmpPaths[0];

    const containers: any[] = Object.keys(metadataJson)
      .filter(key => {
        const element = metadataJson[key];
        return (
          element.id &&
          element.type &&
          element.type === <string>ElementType.Container
        );
      })
      .map(key => metadataJson[key]);

    // iterate containers and adopt templates
    let outputs: any[] = [];
    let containerNames: Object[] = [];
    for (const container of containers) {
      const views = Object.keys(metadataJson)
        .filter(key => {
          const element = metadataJson[key];
          return element.containerId && element.containerId === container.id;
        })
        .map(key => metadataJson[key]);
      let containerObj = {
        container: container,
        views: views,
      };

      // viewConfigs
      const configTemplate = this.compiledTemplate(
        templatePaths.containerNameConfig,
      );
      const configOutput = configTemplate(containerObj);
      const configParsed = path.parse(templatePaths.containerNameConfig);
      const configName = container.name + 'Config.swift';
      const configOutputPath = path.join(configParsed.dir, configName);

      outputs.push({ filePath: configOutputPath, content: configOutput });

      // viewControllers
      const vcTemplate = this.compiledTemplate(
        templatePaths.containerNameViewController,
      );
      const vcOutput = vcTemplate(containerObj);
      const vcParsed = path.parse(templatePaths.containerNameViewController);
      const vcName = container.name + 'ViewController.swift';
      const vcOutputPath = path.join(
        vcParsed.dir,
        '../',
        container.name,
        vcName,
      );

      outputs.push({ filePath: vcOutputPath, content: vcOutput });

      // for viewController.swift.hbs and
      containerNames.push({ name: container.name });
    }

    // generate iterated files
    for (const output of outputs) {
      fs.ensureFileSync(output.filePath);
      fs.writeFileSync(output.filePath, output.content);
    }

    // generate base view controller
    const viewControllerNames = containerNames.map(obj => {
      return { name: obj['name'] + 'ViewController' };
    });
    this.searchAndAdoptTemplate(
      path.parse(templatePaths.viewController).dir,
      `^viewController\.swift\.hbs$`,
      { names: viewControllerNames },
    );

    // generate DesignToCode
    this.searchAndAdoptTemplate(
      path.parse(templatePaths.designToCodeGenerated).dir,
      `^DesignToCode\.generated\.swift\.hbs$`,
      { names: containerNames, tree: treeJson },
    );

    // remove templates itself
    for (const key of Object.keys(templatePaths)) {
      const templatePath = templatePaths[key];
      if (key === 'containerNameViewController') {
        // remove `containerName` directory
        fs.removeSync(path.join(templatePath, '../'));
      } else {
        fs.removeSync(templatePath);
      }
    }
  }

  private getJson(outputType: OutputType): any {
    const metadataJsonPath = this.pathManager.getOutputPath(outputType);
    if (!metadataJsonPath) {
      throw new Error('cannot find directory: ' + metadataJsonPath);
    }
    const json: any[] = JSON.parse(this.pathManager.read(metadataJsonPath));
    if (!json) {
      throw new Error('cannot find directory: ' + metadataJsonPath);
    }
    return json;
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

  private compiledTemplate(templatePath: string): any {
    const templateStr = this.pathManager.read(templatePath);
    if (!templateStr) {
      throw new Error("couldn't get template: " + templatePath);
    }
    return HandlebarsHelpers.handlebars().compile(String(templateStr));
  }
}
