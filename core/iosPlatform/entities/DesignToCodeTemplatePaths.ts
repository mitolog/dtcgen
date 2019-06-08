import * as path from 'path';
import * as fs from 'fs-extra';
import { PathManager } from '../../utilities/Utilities';

export class IOSTemplatePaths {
  containerNameConfig: string;
  designToCodeGenerated: string;
  containerNameViewController: string;
  cellNameCollectionViewCell: string;
  viewController: string;
}

export class DesignToCodeTemplatePaths {
  pathManager: PathManager;
  iosTemplatePaths: IOSTemplatePaths;

  constructor(searchDir: string, outputDir?: string) {
    this.pathManager = new PathManager(outputDir);
    this.iosTemplatePaths = new IOSTemplatePaths();

    let tmpRegExpStr = `^containerNameConfig\.swift\.hbs$`;
    let tmpPaths = this.pathManager.searchDirsOrFiles(
      searchDir,
      tmpRegExpStr,
      true,
    );
    if (!tmpPaths || tmpPaths.length <= 0) {
      throw new Error(`${tmpRegExpStr} is not found`);
    }
    this.iosTemplatePaths.containerNameConfig = tmpPaths[0];

    tmpRegExpStr = `^DesignToCode\.generated\.swift\.hbs$`;
    tmpPaths = this.pathManager.searchDirsOrFiles(
      searchDir,
      tmpRegExpStr,
      true,
    );
    if (!tmpPaths || tmpPaths.length <= 0) {
      throw new Error(`${tmpRegExpStr} is not found`);
    }
    this.iosTemplatePaths.designToCodeGenerated = tmpPaths[0];

    tmpRegExpStr = `^containerNameViewController\.swift\.hbs$`;
    tmpPaths = this.pathManager.searchDirsOrFiles(
      searchDir,
      tmpRegExpStr,
      true,
    );
    if (!tmpPaths || tmpPaths.length <= 0) {
      throw new Error(`${tmpRegExpStr} is not found`);
    }
    this.iosTemplatePaths.containerNameViewController = tmpPaths[0];

    tmpRegExpStr = `^cellNameCollectionViewCell\.swift\.hbs$`; //cellNameCollectionViewCell.swift.hbs
    tmpPaths = this.pathManager.searchDirsOrFiles(
      searchDir,
      tmpRegExpStr,
      true,
    );
    if (!tmpPaths || tmpPaths.length <= 0) {
      throw new Error(`${tmpRegExpStr} is not found`);
    }
    this.iosTemplatePaths.cellNameCollectionViewCell = tmpPaths[0];

    tmpRegExpStr = `^viewController\.swift\.hbs$`;
    tmpPaths = this.pathManager.searchDirsOrFiles(
      searchDir,
      tmpRegExpStr,
      true,
    );
    if (!tmpPaths || tmpPaths.length <= 0) {
      throw new Error(`${tmpRegExpStr} is not found`);
    }
    this.iosTemplatePaths.viewController = tmpPaths[0];
  }

  removeTemplates() {
    for (const key of Object.keys(this.iosTemplatePaths)) {
      const templatePath = this.iosTemplatePaths[key];
      if (key === 'containerNameViewController') {
        // remove `containerName` directory
        fs.removeSync(path.join(templatePath, '../'));
      } else {
        fs.removeSync(templatePath);
      }
    }
  }
}
