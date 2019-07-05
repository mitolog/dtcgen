import * as fs from 'fs-extra';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { OSType } from '../domain/entities/OSType';
import { isString } from 'util';

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
  dynamicAttributes,
  tree,
  sourcecodes,
  project,
  figmaTree,
}

export class PathManager {
  outputDir: string;

  constructor(outputDir?: string) {
    const absoluteOrRelativeOutDir = outputDir || process.env.OUTPUT_PATH;
    if (
      !absoluteOrRelativeOutDir ||
      !isString(absoluteOrRelativeOutDir) ||
      absoluteOrRelativeOutDir.length <= 0
    ) {
      throw new Error('output directory shuold be set.');
    }
    this.outputDir = path.isAbsolute(absoluteOrRelativeOutDir)
      ? absoluteOrRelativeOutDir
      : path.resolve(process.cwd(), absoluteOrRelativeOutDir);
  }

  /**
   * get distinct path or directory depends on each output type.
   * @param pathType {OutputType} Output type
   * @param shouldCreateMidDir {boolean} should create intermediate directory or not
   * @retuns outputPath {string} output path
   */
  getOutputPath(
    pathType: OutputType,
    shouldCreateMidDir: boolean = false,
    osType?: OSType,
    fileName?: string,
  ): string {
    let outputPath = '';
    switch (pathType) {
      case OutputType.metadata:
        const metadataDirName = path.join(
          this.outputDir,
          OutputMidDirName.extracted,
          'metadata',
        );
        if (shouldCreateMidDir) {
          fs.ensureDirSync(metadataDirName);
        }
        outputPath = path.join(metadataDirName, 'metadata.json');
        break;

      case OutputType.tree:
        const treeDirName = path.join(
          this.outputDir,
          OutputMidDirName.extracted,
          'metadata',
        );
        if (shouldCreateMidDir) {
          fs.ensureDirSync(treeDirName);
        }
        outputPath = path.join(treeDirName, 'tree.json');
        break;

      case OutputType.figmaTree:
        const figmaTreeDirName = path.join(
          this.outputDir,
          OutputMidDirName.extracted,
          'metadata',
        );
        if (shouldCreateMidDir) {
          fs.ensureDirSync(figmaTreeDirName);
        }
        outputPath = path.join(figmaTreeDirName, 'figmaTree.json');
        break;

      case OutputType.dynamicAttributes:
        const attributesPath = path.join(
          this.outputDir,
          OutputMidDirName.extracted,
          'metadata/dynamicAttributes',
          fileName || '',
        );
        if (shouldCreateMidDir) {
          fs.ensureDirSync(path.dirname(attributesPath));
        }
        outputPath = attributesPath;
        break;

      case OutputType.images:
        const imagesPath = path.join(
          this.outputDir,
          OutputMidDirName.extracted,
          'images',
        );
        if (shouldCreateMidDir) {
          fs.ensureDirSync(imagesPath);
        }
        outputPath = imagesPath;
        break;

      case OutputType.slices:
        const slicesPath = path.join(
          this.outputDir,
          OutputMidDirName.extracted,
          'slices',
        );
        if (shouldCreateMidDir) {
          fs.ensureDirSync(slicesPath);
        }
        outputPath = slicesPath;
        break;

      case OutputType.sourcecodes:
        let codePath = '';
        if (osType === OSType.ios) {
          codePath = path.join(
            this.outputDir,
            OutputMidDirName.generated,
            OSType.ios,
            fileName,
          );
        } else {
          throw new Error(
            OutputType.sourcecodes +
              ' generation for android is not implemented yet',
          );
        }
        if (shouldCreateMidDir) {
          fs.ensureDirSync(path.dirname(codePath));
        }
        outputPath = codePath;
        break;

      case OutputType.project:
        let projectPath = '';
        if (osType === OSType.ios) {
          projectPath = path.join(
            this.outputDir,
            OutputMidDirName.generated,
            OSType.ios,
            'XcodeProject',
          );
        } else {
          throw new Error(
            OutputType.project +
              ' generation for android is not implemented yet',
          );
        }
        if (shouldCreateMidDir) {
          fs.ensureDirSync(path.dirname(projectPath));
        }
        outputPath = projectPath;
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
  removeWhiteSpaces(dirOrFilePath: string, recursive: boolean = true) {
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
    if (recursive && PathManager.isDir(destPath)) {
      const files = fs.readdirSync(destPath);
      files.forEach(file => {
        this.removeWhiteSpaces(path.join(destPath, file));
      });
    }
  }

  /**
   * Search files or directories that match `regExp`
   * under `searchDir` directory `recursive`-ly if needed.
   * @param searchDir {string} directory path. SHUOLD BE DIRECTORY.
   * @param regExp {string} regular expression string
   * @param recursive {boolean} if true, search recursively
   */
  searchDirsOrFiles(
    searchDir: string,
    regExp: string,
    recursive: boolean,
  ): string[] | null {
    if (!PathManager.isDir(searchDir)) return null;

    let foundPaths: string[] = [];
    const dirContents = fs.readdirSync(searchDir);
    dirContents
      .filter(dirOrFile => {
        const isDir = PathManager.isDir(path.join(searchDir, dirOrFile));
        const isMatched = dirOrFile.match(new RegExp(regExp, 'g'));
        if (isDir && recursive) {
          const paths = this.searchDirsOrFiles(
            path.join(searchDir, dirOrFile),
            regExp,
            isDir,
          );
          if (paths && paths.length > 0) {
            paths.forEach(path => foundPaths.push(path));
          }
        }
        return isMatched;
      })
      .forEach(fileName => {
        const filePath = path.join(searchDir, fileName);
        foundPaths.push(filePath);
      });

    return foundPaths;
  }

  /**
   * recursively lookup config json from
   * command executed directory to upper directories.
   * @param jsonPath {string?} path to config json
   * @return sketch {string?} sketch config object
   */
  getConfig(jsonPath?: string): Object | null {
    const targetPath = jsonPath || process.env.CONFIG_PATH;
    const absolutePath = path.isAbsolute(targetPath)
      ? targetPath
      : path.resolve(process.cwd(), targetPath);

    if (fs.existsSync(absolutePath)) {
      // TODO: I've prepared interface `DtcConfig`
      // so need to check type of parseed result with something like this:
      // https://github.com/diontools/ts-json-checker
      return JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
    } else if (path.dirname(absolutePath) === '/') {
      throw new Error('no config file');
    }

    const upperFilePath = path.join(
      path.dirname(absolutePath),
      '../',
      path.basename(absolutePath),
    );
    return this.getConfig(upperFilePath);
  }

  getJson(outputType: OutputType, fileName?: string): any {
    var metadataJsonPath = this.getOutputPath(outputType);
    if (fileName) {
      metadataJsonPath = path.join(metadataJsonPath, fileName);
    }
    if (
      PathManager.isDir(metadataJsonPath) ||
      !fs.existsSync(metadataJsonPath)
    ) {
      throw new Error('cannot find json file: ' + metadataJsonPath);
    }
    const json: any = JSON.parse(this.read(metadataJsonPath));
    if (!json) {
      throw new Error('cannot parse json file: ' + metadataJsonPath);
    }
    return json;
  }

  read(filePath): string {
    let content = '';
    if (this.check(filePath)) {
      content = fs.readFileSync(filePath, 'utf8');
    }
    return content;
  }

  check(filePath): boolean {
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
      }
    }
  }
}
