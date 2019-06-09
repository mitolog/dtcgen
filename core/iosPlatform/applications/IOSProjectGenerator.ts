import * as fs from 'fs-extra';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { OSType, ElementType, TreeElement } from '../../domain/Entities';
import {
  PathManager,
  OutputType,
  HandlebarsHelpers,
  HandlebarsPartials,
} from '../../utilities/Utilities';
import { SourceCodeGenerator } from './SourceCodeGenerator';
import { AssetGenerator } from './AssetGenerator';
import { ProjectSettings } from '../entities/ProjectSettings';

dotenv.config();
if (dotenv.error) {
  throw dotenv.error;
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
    let assetGenerator = new AssetGenerator(this.pathManager.outputDir);
    assetGenerator.generateAssets(templateDestDir);

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
}
