import * as path from 'path';
import { PathManager, OutputType } from './PathManager';
import * as handlebars from 'handlebars';

export class HandlebarsPartials {
  static registerPartials(partialTemplateRootDir: string): void {
    if (!partialTemplateRootDir) return;

    const pathManager = new PathManager();

    let tmpRegExpStr = `.*\.hbs$`;
    let partialPaths = pathManager.searchDirsOrFiles(
      partialTemplateRootDir,
      tmpRegExpStr,
      true,
    );
    for (const partialPath of partialPaths) {
      const partialStr = pathManager.read(partialPath);
      if (!partialStr) {
        throw new Error("couldn't get template: " + partialPath);
      }
      const partialName = path.basename(partialPath, '.hbs');
      handlebars.registerPartial(partialName, partialStr);
    }
  }
}
