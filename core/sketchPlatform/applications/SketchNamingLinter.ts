import { SketchLayerTypes } from '../entities/SketchLayerType';
import { LayerName } from '../../domain/entities/LayerName';
import { INamingLinter } from '../../domain/applications/INamingLinter';
import * as fs from 'fs';
import { injectable } from 'inversify';

@injectable()
export class SketchNamingLinter implements INamingLinter {
  config: any; // object taken from "linter.config.json"

  constructor() {
    // linter.configからパスを取得
    // todo: linter.configの探索
    const config = JSON.parse(
      fs.readFileSync(
        '/Users/mito/Documents/Proj/innova/sketchLinter/sketchLinter/linter.config.json',
        'utf8',
      ),
    );
    this.config = config.sketch;
  }

  /**
   * layerが命名規則に沿っているか検証する
   * @param layers SketchElementType毎に分割する前のlayer配列
   * @returns 検証結果オブジェクトの配列
   */
  lint(layers: LayerName[], type: string) {
    const lowerTypeName = type.toLowerCase();
    const namingRules = this.config.namingRule[lowerTypeName];
    if (typeof namingRules !== 'object') {
      // todo: throw an error
      return;
    }
    const validRules = this.retrieveValidConfig(namingRules);

    // ルール毎にそれぞれのnamesを更新
    const ruleNames = Object.keys(validRules);
    for (const ruleName of ruleNames) {
      const ruleValue = validRules[ruleName];
      // namesを参照で渡して中身を更新
      this.update(layers, ruleName, ruleValue);
    }

    //.filter(name => !name.isValid); // extract only violated names
  }

  update(names: LayerName[], ruleName: string, ruleValue: any) {
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
      // デフォでtrue、今回値がfalseのときだけ値を更新
      name.hints.push(result[1]);
    }
    if (ruleName === 'unique') {
      const result = this.isUnique(names);
      if (!result[0] && result[1] && result[1].length > 0) {
        // nameを更新
        result[1].forEach(name => {
          name.hints.push('is duplicating');
        });
      }
    }
  }

  isMatchedPattern(name: LayerName, pattern: string): [boolean, string?] {
    // patternからきたフォーマット文字列を正規表現に変換しないといけない？
    // %s -> [A-Za-z]+ に置換
    // 残りはそのまま
    // matchした文字列と元の文字列が同じであれば、マッチしたとみなす
    const nameString = name.name;
    let replacedPattern = pattern.replace(/%s/g, '[A-Za-z]+');

    let regExp = new RegExp(replacedPattern);
    const expResults = regExp.exec(nameString);
    let isMatched = false;
    if (expResults && expResults.length === 1 && expResults[0] === nameString) {
      isMatched = true;
    }

    const hint = isMatched ? undefined : 'is not match pattern string';
    return [isMatched, hint];
  }

  isLowerCamelCase(name: LayerName): [boolean, string?] {
    //  - 文字列に_が入っていない
    //  - 全部大文字ではない
    //  - 先頭が小文字
    const nameString = name.name;
    const isLowerCamelCase =
      this.isCamelCase(nameString) && !this.isInitialCapitalized(nameString)
        ? true
        : false;
    const hint = isLowerCamelCase ? undefined : 'is not lowerCamelCase';
    return [isLowerCamelCase, hint];
  }

  isUpperCamelCase(name: LayerName): [boolean, string?] {
    //  - 文字列の先頭の1文字が大文字
    //  - 文字列に_が入っていない
    //  - 全部大文字ではない
    const nameString = name.name;
    const isUpperCamelCase =
      this.isCamelCase(nameString) && this.isInitialCapitalized(nameString)
        ? true
        : false;
    const hint = isUpperCamelCase ? undefined : 'is not upperCamelCase';
    return [isUpperCamelCase, hint];
  }

  isUnique(names: LayerName[]): [boolean, LayerName[]?] {
    const duplicates = names.filter((val, idx, self) => {
      return self.indexOf(val) !== self.lastIndexOf(val);
    });
    const isUnique = !duplicates && duplicates.length <= 0 ? true : false;
    return [isUnique, duplicates];
  }

  isAlphabetOnly(name: LayerName): [boolean, string?] {
    const nameString = name.name;
    const regExp = new RegExp('^[A-Za-z]+$');
    const results = regExp.exec(nameString);
    const isAlphabetOnly = results && results.length > 0 ? true : false;
    const hint = isAlphabetOnly ? undefined : 'is not alphabet only';
    return [isAlphabetOnly, hint];
  }

  isLessThanMaxLength(name: LayerName, count: number): [boolean, string?] {
    const nameString = name.name;
    const isLess = nameString.length <= count ? true : false;
    const hint = isLess ? undefined : `is exceeding max length: \(${count})`;
    return [isLess, hint];
  }

  /**
   * ------------------------------------------------------
   * Utilities below
   * ------------------------------------------------------
   */

  isCamelCase(string: string): boolean {
    return string.indexOf('_') === -1 && string !== string.toUpperCase()
      ? true
      : false;
  }

  isInitialCapitalized(string: string): boolean {
    return string.slice(0, 1) === string.slice(0, 1).toUpperCase()
      ? true
      : false;
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
