import * as _ from 'lodash';
import * as dotenv from 'dotenv';
import { StyleType } from './StyleType';
import { PathManager } from '../../utilities/PathManager';
import { DesignToolType } from './DesignToolType';
import { ColorStyleConfig } from './ColorStyleConfig';

dotenv.config();
if (dotenv.error) {
  throw dotenv.error;
}

export class StyleConfig {
  styles?: StyleType[];
  teamId: string;
  inputPath?: string;
  outputDir?: string;
  colorStyleConfig?: ColorStyleConfig;

  initWithDtcConfig(designToolType: DesignToolType) {
    const pathManager = new PathManager(designToolType);
    const dtcConfig = pathManager.getConfig();
    const defaults = _.get(dtcConfig, `${designToolType}.style`, null);
    if (!defaults) {
      throw new Error('style config is not set on config file.');
    }

    this.inputPath = defaults['inputPath'] || null;
    this.outputDir = defaults['outputDir'] || null;

    const defaultStyles: StyleType[] = [];
    const colorStyleConfig: ColorStyleConfig = new ColorStyleConfig(
      defaults['color'],
    );
    this.colorStyleConfig = colorStyleConfig;

    if (this.colorStyleConfig.isEnabled) {
      defaultStyles.push(StyleType.fill);
    }
    this.styles = defaultStyles;
    this.teamId = process.env.FIGMA_TEAM_ID;
  }
}
