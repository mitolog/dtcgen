export {};

declare global {
  interface String {
    toLowerCamelCase(splitter?: string): string;
    toUpperCamelCase(splitter?: string): string;
  }
}

/**
 * Make String lowerCamelCase where each words splitted by `splitter` parameter, if exists.
 * If no splitter derived, just make first letter to be lowercase.
 * @param {string?} splitter string to be used for splitting string
 * @returns lowerCamelCased string.
 */
String.prototype.toLowerCamelCase = function(splitter?: string) {
  if (splitter) {
    return this.split(splitter)
      .map((str, idx) => {
        const tmpStr = str.trim();
        const firstLetter = tmpStr.slice(0, 1);
        return tmpStr.length >= 2
          ? (idx === 0
              ? firstLetter.toLowerCase()
              : firstLetter.toUpperCase()) + tmpStr.slice(1)
          : tmpStr; // if it's only one letter, just skip capitalization.
      })
      .join('');
  } else {
    const tmpStr = this.trim();
    return tmpStr.length >= 2
      ? tmpStr.slice(0, 1).toLowerCase() + tmpStr.slice(1)
      : tmpStr; // if it's only one letter, just skip capitalization.
  }
};

/**
 * Make String UpperCamelCase where each words splitted by `splitter` parameter, if exists.
 * If no splitter derived, just make first letter to be UpperCase.
 * @param {string?} splitter string to be used for splitting string
 * @returns UpperCamelCased string.
 */
String.prototype.toUpperCamelCase = function(splitter?: string) {
  if (splitter) {
    return this.split(splitter)
      .map((str, idx) => {
        const tmpStr = str.trim();
        const firstLetter = tmpStr.slice(0, 1);
        return tmpStr.length >= 2
          ? firstLetter.toUpperCase() + tmpStr.slice(1)
          : tmpStr.toUpperCase(); // if it's only one letter, capitalize it.
      })
      .join('');
  } else {
    const tmpStr = this.trim();
    return tmpStr.length >= 2
      ? tmpStr.slice(0, 1).toUpperCase() + tmpStr.slice(1)
      : tmpStr.toUpperCase(); // if it's only one letter, capitalize it.
  }
};
