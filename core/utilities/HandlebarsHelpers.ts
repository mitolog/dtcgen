import * as handlebars from 'handlebars';
import * as helpers from 'handlebars-helpers';

export class HandlebarsHelpers {
  static handlebars(): any {
    handlebars.registerHelper('eq', helpers().eq);
    return handlebars;
  }
}
