import * as _ from 'lodash';
import { StyleType } from './StyleType';
import { PathManager } from '../../utilities/PathManager';
import { DesignToolType } from './DesignToolType';
import { isBoolean } from 'util';
import * as dotenv from 'dotenv';

dotenv.config();
if (dotenv.error) {
  throw dotenv.error;
}

export class StyleConfig {
  styles?: StyleType[];
  teamId: string;
  inputPath?: string;
  outputDir?: string;

  initWithDtcConfig(designToolType: DesignToolType) {
    const pathManager = new PathManager(designToolType);
    const dtcConfig = pathManager.getConfig();
    const defaults = _.get(dtcConfig, `${designToolType}.style`, null);
    if (!defaults) return;

    this.inputPath = defaults['inputPath'] || null;
    this.outputDir = defaults['outputDir'] || null;

    const defaultStyles: StyleType[] = [];
    if (isBoolean(defaults['color']) && defaults['color']) {
      defaultStyles.push(StyleType.fill);
    }
    this.styles = defaultStyles;
    this.teamId = process.env.FIGMA_TEAM_ID;
  }
}
