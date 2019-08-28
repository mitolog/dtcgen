import { injectable, inject } from 'inversify';
import { IGenericRepository } from './IGenericRepository';
import { PathManager } from '../../utilities/PathManager';
import * as path from 'path';
import * as fs from 'fs-extra';

@injectable()
export class GenericRepository implements IGenericRepository {
  async prepareSettingFiles(): Promise<void> {
    const pathManager = new PathManager();
    const rootDir = path.join(__dirname, '../../../../');

    /* Retrieve default setting files */

    const defaultEnvPaths = pathManager.searchDirsOrFiles(
      rootDir,
      `\.env\.default`,
      true,
    );
    if (!defaultEnvPaths || defaultEnvPaths.length <= 0) {
      throw new Error('no .env.default found.');
    }

    const defaultDtcConfigPaths = pathManager.searchDirsOrFiles(
      rootDir,
      `dtc\.config\.json\.default`,
      true,
    );
    if (!defaultDtcConfigPaths || defaultDtcConfigPaths.length <= 0) {
      throw new Error('no "dtc.config.json.default" found.');
    }

    /* Copy setting files to root dir that command executed */

    const envConfigPath = path.resolve(process.cwd(), '.env');
    const envConfig = pathManager.read(defaultEnvPaths[0]);
    await fs.writeFile(envConfigPath, envConfig);

    const dtcConfigPath = path.resolve(process.cwd(), 'dtc.config.json');
    const dtcConfig = pathManager.read(defaultDtcConfigPaths[0]);
    await fs.writeFile(dtcConfigPath, dtcConfig);
  }
}
