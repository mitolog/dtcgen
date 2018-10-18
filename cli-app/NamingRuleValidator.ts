import {
  sketchElementTypes,
  SketchElementType,
} from '../core/domain/entities/SketchElementType';
import { Name } from '../core/domain/entities/Name';

export interface NamingRuleValidator {
  config: any; // todo: make type for config object
  validate(layers: any[]): { type: string; names: Name[] }[];
  isMatchedPattern(name: Name, str: string): [boolean, string?];
  isUpperCamelCase(name: Name): [boolean, string?];
  isLowerCamelCase(name: Name): [boolean, string?];
  isUnique(names: Name[]): [boolean, Name[]?];
  isAlphabetOnly(name: Name): [boolean, string?];
  isLessThanMaxLength(name: Name, count: number): [boolean, string?];
}

export class SketchNamingRuleValidator implements NamingRuleValidator {
  config: any;

  constructor(config: any) {
    this.config = config;
  }

  /**
   * layerが命名規則に沿っているか検証する
   * @param layers SketchElementType毎に分割する前のlayer配列
   * @returns 検証結果オブジェクトの配列
   */
  validate(layers: any[]): { type: string; names: Name[] }[] {
    // 有効なruleの抽出
    const rules = {};
    for (const typeStr of sketchElementTypes) {
      const lowerTypeName = typeStr.toLowerCase();
      const namingRules = this.config.namingRule[lowerTypeName];
      // excludes unnoted type on json config or which is not object
      if (typeof namingRules !== 'object') continue;

      const validRules = this.retrieveValidConfig(namingRules);
      rules[typeStr] = validRules;
    }

    console.log('rules: ', rules);
    const results = [];
    for (const typeStr of Object.keys(rules)) {
      const resultForType = {};
      resultForType[typeStr] = this.scan(
        layers,
        typeStr,
        rules[typeStr],
      ).filter(name => !name.isValid); // extract only violated names
      results.push(resultForType);
    }

    return results;
  }

  /**
   * 対象となるlayer(sketchの最小要素単位)をtype別にNameオブジェクトに置換
   * @param layers sketchの最小要素単位オブジェクトの配列
   * @param typeString SketchElementTypeの型名
   * @param validRules typeStringに属する、有効になっている命名規則一覧
   */
  scan(layers: any[], typeString: string, validRules: any): Name[] {
    let names: Name[];
    switch (typeString) {
      case SketchElementType[SketchElementType.Page]:
        names = layers.map(page => {
          return new Name(page, SketchElementType.Page);
        });
        break;
      case SketchElementType[SketchElementType.Artboard]:
        names = layers
          .map(page => page.artboards)
          .reduce((previousValue, currentValue) => {
            return previousValue.concat(currentValue);
          })
          .map(artboard => new Name(artboard, SketchElementType.Artboard));
        break;
    }

    // ルール毎にそれぞれのnamesを更新
    const ruleNames = Object.keys(validRules);
    for (const ruleName of ruleNames) {
      const ruleValue = validRules[ruleName];
      // namesを参照で渡して中身を更新
      this.update(names, ruleName, ruleValue);
    }
    return names;
  }

  update(names: Name[], ruleName: string, ruleValue: any) {
    for (const name of names) {
      let result: [boolean, string?] = [true, ''];
      // todo: rule名一覧はどこかに定義しておかねば...
      switch (ruleName) {
        case 'pattern':
          result = this.isMatchedPattern(name, ruleValue);
          break;
        case 'uppserCamelCase':
          result = this.isUpperCamelCase(name);
          break;
        case 'lowerCamelCase':
          result = this.isLowerCamelCase(name);
          break;
        case 'englishOnly':
          result = this.isAlphabetOnly(name);
          break;
        case 'maxLength':
          result = this.isLessThanMaxLength(name, ruleValue);
          break;
        default:
          break;
      }
      name.isValid = result[0];
      if (!name.isValid) name.hints.push(result[1]);
    }
    if (ruleName === 'unique') {
      const result = this.isUnique(names);
      if (!result[0] && result[1] && result[1].length > 0) {
        // nameを更新
        result[1].forEach(name => {
          name.isValid = false;
          name.hints.push('is duplicating.');
        });
      }
    }
  }

  isMatchedPattern(name: Name, pattern: string): [boolean, string?] {
    // patternからきたフォーマット文字列を正規表現に変換しないといけない？
    // %s -> [A-Za-z]+
    return [true, ''];
  }

  isLowerCamelCase(name: Name): [boolean, string?] {
    //  - 文字列に_が入っていない
    //  - 全部大文字ではない
    //  - 先頭が小文字
    const nameString = name.name;
    const isLowerCamelCase =
      this.isCamelCase(nameString) && !this.isInitialCapitalized(nameString);
    const hint = isLowerCamelCase ? undefined : 'is not lowerCamelCase';
    return [isLowerCamelCase, hint];
  }

  isUpperCamelCase(name: Name): [boolean, string?] {
    //  - 文字列の先頭の1文字が大文字
    //  - 文字列に_が入っていない
    //  - 全部大文字ではない
    const nameString = name.name;
    const isUpperCamelCase =
      this.isCamelCase(nameString) && this.isInitialCapitalized(nameString);
    const hint = isUpperCamelCase ? undefined : 'is not upperCamelCase';
    return [isUpperCamelCase, hint];
  }

  isUnique(names: Name[]): [boolean, Name[]?] {
    const duplicates = names.filter((val, idx, self) => {
      return self.indexOf(val) !== self.lastIndexOf(val);
    });
    return [!duplicates && duplicates.length <= 0, duplicates];
  }

  isAlphabetOnly(name: Name): [boolean, string?] {
    const nameString = name.name;
    const regExp = new RegExp('^[A-Za-z]+$');
    const results = regExp.exec(nameString);
    const isAlphabetOnly = results && results.length > 0;
    const hint = isAlphabetOnly ? undefined : 'is not alphabet only';
    return [isAlphabetOnly, hint];
  }

  isLessThanMaxLength(name: Name, count: number): [boolean, string?] {
    const nameString = name.name;
    const isLess = nameString.length <= count;
    const hint = isLess ? undefined : `is exceeding max length: \(${count})`;
    return [isLess, hint];
  }

  /**
   * ------------------------------------------------------
   * Utilities below
   * ------------------------------------------------------
   */

  isCamelCase(string: string): boolean {
    return string.indexOf('_') > -1 && string !== string.toUpperCase();
  }

  isInitialCapitalized(string: string): boolean {
    return string.slice(0, 1) === string.slice(0, 1).toUpperCase();
  }

  /**
   *
   * @param namingRules json parsed data corresponding to "namingRule"
   */
  retrieveValidConfig(namingRules: any): { [s: string]: any } {
    const ruleNames = Object.keys(namingRules);
    const rules: { [s: string]: any } = {};
    for (const ruleName of ruleNames) {
      const ruleValue = namingRules[ruleName];
      if (!this.isValid(ruleValue)) continue;
      // todo: trim white spaces if needed
      // todo: 除外するlayerリストをfilterしてもいいかもね
      rules[ruleName] = ruleValue;
    }
    return rules;
  }

  /**
   * just check if the value is valid enough for validation
   * @param value string to be validated
   * @returns boolean indicates the value is valid enough or not
   */
  private isValid(value: string): boolean {
    // todo: スマートに型チェック
    // check if value is valid
    if (
      value === null ||
      value === undefined ||
      value === 'null' ||
      value === 'undefined'
    ) {
      return false;
    } else if (typeof value === 'boolean' && !value) {
      return false;
    } else if (typeof value === 'string' && value.length <= 0) {
      return false;
    }
    return true;
  }
}
