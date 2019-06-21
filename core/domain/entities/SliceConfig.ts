import * as _ from 'lodash';
import { AssetFormat } from '../Entities';
import { PathManager } from '../../utilities/Utilities';
import { DesignToolType } from './DesignToolType';

export class SliceConfig {
  keywords?: string[];
  caseSensitive: boolean;
  extension?: AssetFormat;
  inputPath?: string;
  outputDir?: string;

  initWithDtcConfig(designToolType: DesignToolType) {
    const pathManager = new PathManager(designToolType);
    const dtcConfig = pathManager.getConfig();
    const defaults = _.get(dtcConfig, `${designToolType}.slice`, null);
    if (!defaults) return;

    this.inputPath = defaults['inputPath'] || null;
    this.outputDir = defaults['outputDir'] || null;
    this.keywords = defaults['keywords'] || null;
    this.caseSensitive = defaults['caseSensitive'] || false;
    this.extension = defaults['format'] || AssetFormat.PDF;
  }
}
