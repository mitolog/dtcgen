import * as fs from 'fs-extra';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { OSType } from '../../domain/entities/OSType';
import { PathManager, OutputType } from '../../utilities/PathManager';
import { HandlebarsHelpers } from '../../utilities/HandlebarsHelpers';
import { HandlebarsPartials } from '../../utilities/HandlebarsPartials';
import { SourceCodeGenerator } from './SourceCodeGenerator';
import { ElementType, TreeElement } from '../../domain/Entities';
import { ProjectSettings } from '../entities/ProjectSettings';

dotenv.config();
if (dotenv.error) {
  throw dotenv.error;
}

class XcAssetJsonPaths {
  intermediate: string;
  last: string;
}

export class IOSProjectGenerator {
  private pathManager: PathManager;
  private projectTemplateRootDir: string;
  private templateHelpers: HandlebarsHelpers;

  constructor(outputDir?: string) {
    this.pathManager = new PathManager(outputDir);
    this.templateHelpers = new HandlebarsHelpers(this.pathManager);
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

    // remove all files on destination directory first
    fs.removeSync(templateDestDir);

    // copy directory to geenerated
    fs.copySync(this.projectTemplateRootDir, templateDestDir);

    // rename top directory names
    this.renameDirectories(templateDestDir, trimedProjectName);

    const projectNameData = { projectName: trimedProjectName };

    const projectSettings = this.projectSettings();
    projectSettings.projectName = trimedProjectName;

    // deal with project.yml
    this.templateHelpers.searchAndAdoptTemplate(
      templateDestDir,
      `project\.yml\.hbs`,
      projectSettings,
    );

    // deal with *Tests directories
    this.templateHelpers.searchAndAdoptTemplate(
      templateDestDir,
      'Tests.*hbs$',
      projectNameData,
    );

    // deal with assets
    this.generateAssets(templateDestDir);

    // deal with sourcecodes
    let sourceCodeGenerator = new SourceCodeGenerator(
      this.pathManager.outputDir,
    );
    sourceCodeGenerator.generateSourceCodes(templateDestDir);
  }

  /**
   * Private methods
   */

  // TODO: we have same method within `TreeElement`, but when you execute
  // `pathManager.getJson(OutputType.tree)`, you will get `any`
  // which is not TreeElement instance. so, you cannot call `firstElementByType`
  // from TreeElement. so I temporarily place here...
  firstElementByType(type: ElementType, treeElement: TreeElement): TreeElement {
    if (treeElement.properties.type === type) {
      return treeElement;
    }
    for (const element of treeElement.elements) {
      const matched = this.firstElementByType(type, element);
      if (matched) {
        return matched;
      }
    }
  }

  private projectSettings(): ProjectSettings {
    const settings = new ProjectSettings();

    const treeJson = this.pathManager.getJson(OutputType.tree);
    let hasMap = false;
    for (const treeElement of treeJson as TreeElement[]) {
      // map related settings
      const elm = this.firstElementByType(ElementType.Map, treeElement);
      if (elm) {
        hasMap = true;
      }
    }

    // map related settings
    if (hasMap) {
      settings.plist.attributes['NSLocationWhenInUseUsageDescription'] =
        'overwrite here';
      settings.dependencies.sdks.push('MapKit.framework');
    }

    return settings.trim();
  }

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
    const imageSetDir = path.join(destDirOrPath, parsed.name + '.imageset');
    // create imageSetDir directory if needed
    fs.ensureDirSync(imageSetDir);

    // create last directory json
    const lastJsonStr = lastJsonTemplate({ filename: parsed.base });
    fs.writeFileSync(path.join(imageSetDir, 'Contents.json'), lastJsonStr);

    // copy asset data itself
    fs.copyFileSync(originPath, path.join(imageSetDir, parsed.base));
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
