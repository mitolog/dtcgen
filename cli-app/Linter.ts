import { Page } from '../core/sketchPlatform/entities/Page';
import { Name } from '../core/domain/entities/Name';
import { SketchNamingRuleValidator } from './NamingRuleValidator';

export interface Linter {
  // todo: いずれも型で縛れるように
  config: any;
  lint(targetJson: any): any;
}

export class SketchLinter implements Linter {
  public config: any;

  constructor(config: any) {
    this.config = config;
  }

  // sketch cliで抽出されたpagesのjsonオブジェクトが入ってくる
  public lint(targetJson: any): any {
    // todo: targetJsonのバリデート

    // todo: try catch的な何か
    // naming rule
    const namingRuleValidator = new SketchNamingRuleValidator(this.config);
    const names: {
      type: string;
      names: Name[];
    }[] = namingRuleValidator.validate(targetJson.pages);

    // the other linting to be added...

    const result = {};
    result['names'] = names;
    return result;
  }
}
