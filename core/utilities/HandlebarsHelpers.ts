import * as fs from 'fs-extra';
import * as path from 'path';
import * as handlebars from 'handlebars';
import * as helpers from 'handlebars-helpers';
import { PathManager } from './Utilities';
import { OSType } from '../domain/Entities';

export class HandlebarsHelpers {
  private pathManager: PathManager;
  private templatePath: string;

  static handlebars(): any {
    handlebars.registerHelper('eq', helpers().eq);
    handlebars.registerHelper('forEach', helpers().forEach);
    handlebars.registerHelper('stem', helpers().stem);
    handlebars.registerHelper('filter', helpers().filter);
    handlebars.registerHelper('has', helpers().has);
    handlebars.registerHelper('capitalize', helpers().capitalize);
    handlebars.registerHelper('length', helpers().length);
    handlebars.registerHelper('compare', helpers().compare);
    return handlebars;
  }

  constructor(pathManager: PathManager) {
    this.pathManager = pathManager;

    const envTemplateDir = process.env.TEMPLATE_DIR;
    if (!envTemplateDir) {
      const defaultTemplateDestDir = path.resolve(process.cwd(), './templates');
      this.templatePath = defaultTemplateDestDir;
    } else {
      this.templatePath = path.isAbsolute(envTemplateDir)
        ? process.env.TEMPLATE_DIR
        : path.resolve(process.cwd(), envTemplateDir);
    }

    if (!fs.existsSync(this.templatePath)) {
      fs.ensureDirSync(this.templatePath);

      const originalTemplatePath = path.join(__dirname, '../../../templates');
      if (!fs.existsSync(originalTemplatePath)) {
        throw new Error('original templates path is not exists.');
      }

      fs.copySync(originalTemplatePath, this.templatePath);
    }
  }

  templatePathFor(osType: OSType, subDir?: string): string {
    const targetPath = path.join(this.templatePath, osType, subDir);
    if (!targetPath || !fs.existsSync(targetPath)) {
      throw new Error(`${subDir} seems not exist under ${this.templatePath}`);
    }
    return targetPath;
  }

  /**
   * compile handlebars template string.
   * @param templatePath {string}
   * @returns {any} compiled template object with helper methods registerd
   */
  compiledTemplate(templatePath: string): any {
    const templateStr = this.pathManager.read(templatePath);
    if (!templateStr) {
      throw new Error("couldn't get template: " + templatePath);
    }
    return HandlebarsHelpers.handlebars().compile(String(templateStr));
  }

  /**
   * lookup deeper from `searchDir` and check if file or directory exists
   * matched to `regExpStr`. then adopt `data`.
   * If exists, remove matched files, then create new one sliced last extension.
   * @param searchDir
   * @param regExpStr
   * @param data
   */
  searchAndAdoptTemplate(
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
}
