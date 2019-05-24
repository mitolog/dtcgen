import { Container } from './Container';
import { View } from './View';
import { isContainer } from '../../typeGuards';
import { ElementType } from './ElementType';

export class TreeElement {
  public uid: string;
  public name: string;
  public properties: View | Container;
  public elements: [TreeElement?];
  public shuoldExcludeOnAdopt: boolean = false;

  constructor(containerOrView: Container | View, elements?: [TreeElement]) {
    this.uid = containerOrView.id;
    const splitter = isContainer(containerOrView) ? '/' : ' ';
    this.name = containerOrView.name.toLowerCamelCase(splitter);
    this.elements = elements || [];
    this.properties = containerOrView;
  }

  /**
   * prevent same name addition, and add to `elements`
   * @param element {TreeElement} new TreeElement to add
   */
  addElement(element: TreeElement) {
    for (const elm of this.elements) {
      if (elm.name === element.name) {
        const largestNumber: number = this.getLargestNumber(elm.name);
        element.name = elm.name + '_' + (largestNumber + 1).toString();
        break;
      }
    }
    this.elements.push(element);
  }

  getLargestNumber(targetName: string): number {
    let max: number = 0;
    for (const elm of this.elements) {
      if (elm.name.indexOf(targetName) < 0) continue;
      let matched: string[] = elm.name.match(new RegExp('_[0-9]+$'));
      let matchedStr: string = matched
        ? matched.reduce((acc, current) => current, null) // take last occurrence
        : null;
      if (!matchedStr || matchedStr.length <= 0) {
        continue;
      }

      let matchedNumStr: string = matchedStr.substr(1); // remove heading `_`
      let hasNumbering = false;

      // If the value has zero padding, we don't take it as a number
      const zeroPaddings: string[] = matchedNumStr.match(new RegExp('^0+'));
      hasNumbering = zeroPaddings && zeroPaddings.length > 0 ? false : true;

      if (hasNumbering) {
        const matchedNum: number = parseInt(matchedNumStr);
        if (matchedNum > max) {
          max = matchedNum;
        }
      }
    }
    return max;
  }

  /**
   * lookup treeElement that matches `uid` parameter
   * @param uid {string}
   */
  searchElement(uid: string): TreeElement {
    if (this.uid === uid) {
      return this;
    }
    for (const element of this.elements) {
      const matched = element.searchElement(uid);
      if (matched) {
        return matched;
      }
    }
  }

  /**
   * returns first treeElement of `type` parameter matched
   * @param type {ElementType}
   */
  firstElementByType(type: ElementType): TreeElement {
    if (this.properties.type === type) {
      return this;
    }
    for (const element of this.elements) {
      const matched = element.firstElementByType(type);
      if (matched) {
        return matched;
      }
    }
  }
}
