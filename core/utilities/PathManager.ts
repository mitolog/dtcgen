import * as fs from 'fs-extra';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { OSType } from '../domain/entities/OSType';

dotenv.config();
if (dotenv.error) {
  throw dotenv.error;
}

export enum OutputMidDirName {
  extracted = 'extracted',
  generated = 'generated',
}

export enum OutputType {
  slices,
  images,
  metadata,
  sourcecodes,
  assets,
  appicons,
}

export class PathManager {
  /**
   * get distinct path or directory depends on each output type.
   * @param pathType {OutputType} Output type
   * @param shouldCreateMidDir {boolean} should create intermediate directory or not
   * @retuns outputPath {string} output path
   */
  static getOutputPath(
    pathType: OutputType,
    shouldCreateMidDir: boolean = false,
    osType?: OSType,
    fileName?: string,
  ): string {
    let outputPath = '';
    switch (pathType) {
      case OutputType.metadata:
        const metadataDirName = path.join(
          process.env.OUTPUT_PATH,
          OutputMidDirName.extracted,
          'metadata',
        );
        if (shouldCreateMidDir) {
          fs.ensureDirSync(metadataDirName);
        }
        outputPath = path.join(metadataDirName, 'metadata.json');
        break;

      case OutputType.images:
        const imagesPath = path.join(
          process.env.OUTPUT_PATH,
          OutputMidDirName.extracted,
          'images',
        );
        if (imagesPath) {
          fs.ensureDirSync(imagesPath);
        }
        outputPath = imagesPath;
        break;

      case OutputType.slices:
        const slicesPath = path.join(
          process.env.OUTPUT_PATH,
          OutputMidDirName.extracted,
          'slices',
        );
        if (shouldCreateMidDir) {
          fs.ensureDirSync(path.dirname(slicesPath));
        }
        outputPath = slicesPath;
        break;

      case OutputType.sourcecodes:
        const codePath = path.join(
          process.env.OUTPUT_PATH,
          OutputMidDirName.generated,
          OSType.ios,
          fileName,
        );
        if (shouldCreateMidDir) {
          fs.ensureDirSync(path.dirname(codePath));
        }
        outputPath = codePath;
        break;

      case OutputType.assets:
        let assetsPath = '';
        if (osType === OSType.ios) {
          assetsPath = path.join(
            process.env.OUTPUT_PATH,
            OutputMidDirName.generated,
            OSType.ios,
            'Assets.xcassets/',
          );
        } else if (osType === OSType.android) {
          throw new Error(
            'assets generation for android is not implemented yet',
          );
        }
        if (shouldCreateMidDir) {
          fs.ensureDirSync(assetsPath);
        }
        outputPath = assetsPath;
        break;

      case OutputType.appicons:
        let appIconPath = '';
        if (osType === OSType.ios) {
          appIconPath = path.join(
            process.env.OUTPUT_PATH,
            OutputMidDirName.generated,
            OSType.ios,
            'Assets.xcassets/',
            'AppIcon.appiconset',
            'Contents.json',
          );
        } else if (osType === OSType.android) {
          throw new Error(
            'assets generation for android is not implemented yet',
          );
        }
        if (shouldCreateMidDir) {
          fs.ensureDirSync(path.dirname(appIconPath));
        }
        outputPath = appIconPath;
        break;
      default:
        break;
    }
    if (!outputPath || outputPath.length <= 0) {
      throw new Error('cannot find directory: ' + outputPath);
    }
    return outputPath;
  }

  /**
   * Removes leading/trailing whitespaces of directory/file.
   * If recursive flag is true, dig down the directory and removes recursively.
   * @param dirOrFilePath directory or filepath
   * @param recursive indicate if it shuold remove recursively
   */
  static removeWhiteSpaces(dirOrFilePath: string, recursive: boolean = true) {
    const parsed = path.parse(dirOrFilePath);
    // removes whitespaces within
    for (let k of Object.keys(parsed)) {
      const value = parsed[k];
      parsed[k] = value.trim();
    }

    const destPath = path.format(parsed);
    // if you don't add overwrite, EEXIST error raises.
    fs.moveSync(dirOrFilePath, destPath, { overwrite: true });
    // `isDir()` used to be `fs.statSync(destPath).isDirectory()`
    if (recursive && this.isDir(destPath)) {
      const files = fs.readdirSync(destPath);
      files.forEach(file => {
        this.removeWhiteSpaces(path.join(destPath, file));
      });
    }
  }

  static read(filePath): string {
    let content = '';
    if (this.check(filePath)) {
      content = fs.readFileSync(filePath, 'utf8');
    }
    return content;
  }

  static check(filePath): boolean {
    var isExist = false;
    try {
      fs.statSync(filePath);
      isExist = true;
    } catch (err) {
      isExist = false;
    }
    return isExist;
  }

  /// workaround when `statSync(path).isDirectory()` fails with `ENOENT`
  static isDir(path: string): boolean {
    try {
      return fs.statSync(path).isDirectory();
    } catch (error) {
      if (error.code === 'ENOENT') {
        return false;
      } else {
        // todo: need to be tested
        throw new Error(error);
        //console.log(error);
      }
    }
  }
}
