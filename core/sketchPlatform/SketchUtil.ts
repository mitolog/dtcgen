import * as _ from 'lodash';
import { SketchView } from './entities/Entities';
import { Constraints, TreeElement } from '../domain/Entities';

export class SketchUtil {
  /**
   * Parse constraint value and output to view object.
   * Each constraints are re-assigned later considering related margins.
   * @param value bitmasked constraint value
   * @param view parsed view object
   */
  static parseConstraint(value: number, view: SketchView) {
    // https://medium.com/zendesk-engineering/reverse-engineering-sketchs-resizing-functionality-23f6aae2da1a
    const bitWiseAnd: number = parseInt(value.toString(2));
    const bitWiseAndPadded: string = ('0000000000' + bitWiseAnd).slice(-6);
    const constraints: Constraints = {
      none: bitWiseAndPadded === '111111' ? 1 : 0,
      top: bitWiseAndPadded.substr(0, 1) === '0' ? 1 : 0,
      right: bitWiseAndPadded.substr(5, 1) === '0' ? 1 : 0,
      bottom: bitWiseAndPadded.substr(2, 1) === '0' ? 1 : 0,
      left: bitWiseAndPadded.substr(3, 1) === '0' ? 1 : 0,
      width: bitWiseAndPadded.substr(4, 1) === '0' ? 1 : 0,
      height: bitWiseAndPadded.substr(1, 1) === '0' ? 1 : 0,
    } as Constraints;
    view.constraints = constraints;
  }

  /**
   * check if targetName shuold be excluded or not.
   * targetName can be like `Background` or `List/Background`,
   * where '/' means layer hierarchy.
   * @param targetName name shuold be matched
   * @param config config json holds the words which shuold be excluded
   * @param parentTree TreeElement instance that targetName belongs to
   */
  static shouldExclude(
    targetName: string,
    config: Object,
    parentTree?: TreeElement,
  ): boolean {
    // exclude node that is listed on setting config.
    const excludeNames: string[] = _.get(config, 'extraction.exceptions');
    if (excludeNames && excludeNames.length > 0) {
      const found = excludeNames.find(name => {
        let layeredNames = name.split('/');
        if (layeredNames.length === 2) {
          const childMatched = targetName.match(
            new RegExp(layeredNames[1], 'gi'),
          );
          const parentMatched = parentTree.name.match(
            new RegExp(layeredNames[0], 'gi'),
          );
          return childMatched && parentMatched ? true : false;
        }
        return targetName.match(new RegExp(name, 'gi')) ? true : false;
      });
      return found ? true : false;
    }
    return false;
  }
}
