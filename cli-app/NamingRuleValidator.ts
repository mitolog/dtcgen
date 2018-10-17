import {
  sketchElementTypes,
  SketchElementType,
} from '../core/domain/entities/SketchElementType';
import { Name } from '../core/domain/entities/Name';

export interface NamingRuleValidator {
  config: any; // todo: make type for config object
  validate(layers: any[]): { type: string; names: Name[] }[];
  isMatchedPattern(names: Name, str: string): [boolean, string?];
  isInitialCapitalized(): [boolean, string?];
  isUpperCamelCase(names: Name): [boolean, string?];
  isLowerCamelCase(names: Name): [boolean, string?];
  isUnique(names: Name): [boolean, string?];
  isAlphabetOnly(names: Name): [boolean, string?];
  isExceedingMaxLength(names: Name, count: number): [boolean, string?];
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
      resultForType[typeStr] = this.scan(layers, typeStr, rules[typeStr]);
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
      // namesは参照渡しなので同じものが共有されるはず?
      for (const name of names) {
        let result: [boolean, string?] = [false, ''];
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
          case 'unique':
            result = this.isUnique(name);
            break;
          case 'maxLength':
            result = this.isExceedingMaxLength(name, ruleValue);
            break;
        }
        name.isValid = result[0];
        if (!name.isValid) name.hint = result[1];
      }
    }
    return names;
  }

  isMatchedPattern(names: Name, str: string): [boolean, string] {
    return [true, ''];
  }

  isLowerCamelCase(names: Name): [boolean, string?] {
    //  - 文字列に_が入っていない
    //  - 全部大文字ではない
    return [true, ''];
  }

  isUpperCamelCase(names: Name): [boolean, string?] {
    //  - 文字列の先頭の1文字が大文字
    //  - 文字列に_が入っていない
    //  - 全部大文字ではない
    return [true, ''];
  }

  isUnique(names: Name): [boolean, string?] {
    return [true, ''];
  }

  isAlphabetOnly(names: Name): [boolean, string?] {
    return [true, ''];
  }

  isExceedingMaxLength(names: Name, count: number): [boolean, string?] {
    return [true, ''];
  }

  isInitialCapitalized(): [boolean, string?] {
    return [true, ''];
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
