import { Color } from './Color';

export class Styles {
  colors?: Color[];

  add(newStyles: Styles) {
    if (!this.colors) {
      this.colors = [];
    }
    if (newStyles.colors && newStyles.colors.length > 0) {
      this.colors.push(...newStyles.colors);
    }
    // If any other styles(like text style) has added,
    // you can add here as same as above.
  }
}
