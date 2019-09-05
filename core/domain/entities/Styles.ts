import { Color } from './Color';

export class Styles {
  colors?: Color[];

  add(styles: Styles) {
    if (!this.colors) {
      this.colors = [];
    }
    if (styles.colors && styles.colors.length > 0) {
      this.colors.push(...styles.colors);
    }
  }
}
