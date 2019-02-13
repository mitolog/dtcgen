import { Container } from './Container';

export class TreeElement {
  public uid: string;
  public name: string;
  public elements: [TreeElement?];

  constructor(container: Container, elements?: [TreeElement]) {
    this.uid = container.id;
    this.name = container.name;
    this.elements = elements || [];
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
}
