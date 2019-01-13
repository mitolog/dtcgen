import * as dotenv from 'dotenv';
import * as cp from 'child_process';
import * as path from 'path';
import { PathManager, OutputType } from '../../utilities/PathManager';
import { OSType } from '../../domain/entities/OSType';

dotenv.config();
if (dotenv.error) {
  throw dotenv.error;
}

export class XcodeProjectGenator {
  constructor() {
    // generated/ios配下に XcodeGenディレクトリがあるかどうかをチェック
    // XcodeGenディレクトリのパスを取得
    // なければ git clone してきて
  }

  generate(outputDir?: string) {
    const execSync = cp.execSync;
    const pathManager = new PathManager(outputDir);
    const defaultOutputDir = path.resolve(
      process.cwd(),
      process.env.DEFAULT_OUTPUT_PATH,
    );
    const searchPath = outputDir || defaultOutputDir;
    const projectDir = pathManager.getOutputPath(
      OutputType.project,
      false,
      OSType.ios,
    );
    const execOption = { stdio: 'inherit' };

    const xcodeGenPaths = pathManager.searchDirsOrFiles(
      searchPath,
      `^XcodeGen$`,
      true,
    );

    if (!xcodeGenPaths || xcodeGenPaths.length <= 0) {
      // git clone
      const clonePath = path.join(projectDir, '../', 'XcodeGen');
      console.log(clonePath);
      execSync(
        `git clone https://github.com/yonaskolb/XcodeGen.git ${clonePath}`,
        execOption,
      );
    }

    const xcodeGenRootDir = xcodeGenPaths.reduce((prev, current) => {
      const prevCnt = prev.split('/');
      const currentCnt = current.split('/');
      return prevCnt > currentCnt ? current : prev;
    });

    const buildPaths = pathManager.searchDirsOrFiles(
      xcodeGenRootDir,
      `^\.build$`,
      true,
    );
    if (!buildPaths || buildPaths.length <= 0) {
      execSync(`swift build --package-path ${xcodeGenRootDir}`, execOption);
    }

    const projectYmlPaths = pathManager.searchDirsOrFiles(
      projectDir,
      `^project\.yml$`,
      true,
    );
    if (!projectYmlPaths || projectYmlPaths.length <= 0) {
      throw new Error('no project.yml file for XcodeGen.');
    }

    console.log(projectYmlPaths);
    execSync(
      `swift run --package-path ${xcodeGenRootDir} xcodegen -s ${
        projectYmlPaths[0]
      }`,
      execOption,
    );
  }
}
