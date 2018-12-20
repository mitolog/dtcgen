import { Color } from '../../../domain/entities/Color';
import { IElementParser } from './IElementParser';
import { ColorComponents } from '../../../domain/entities/ColorComponents';
import { TextView } from '../../../domain/entities/TextView';
import * as _ from 'lodash';
import { TextAlignment } from '../../../domain/entities/TextAlignment';

export class TextViewParser implements IElementParser {
  private sketch: Object;
  private config: Object;

  constructor(sketch: Object, config: Object) {
    this.sketch = sketch;
    this.config = config;
  }

  parse(node: any, textView: TextView) {
    const textStyle = null; //_.get(node, 'style.textStyle');
    const attributedString = _.get(node, 'attributedString');
    //console.log('textStyle--- ', textStyle);
    //console.log('attributedString--- ', attributedString);

    if (textStyle) {
    } else if (attributedString) {
      // font description
      const fontDescriptor = _.get(
        attributedString,
        'attributes[0].attributes.MSAttributedStringFontAttribute.attributes',
      );
      if (fontDescriptor) {
        textView.fontName = fontDescriptor.name;
        textView.fontSize = fontDescriptor.size;
      }

      // fontColor
      const fontColor = _.get(
        attributedString,
        'attributes[0].attributes.MSAttributedStringColorAttribute',
      );
      if (fontColor) {
        const colorComp = new ColorComponents(<ColorComponents>fontColor);
        textView.fontColor = new Color(<Color>{ fill: colorComp });
      }

      // text
      textView.text = attributedString.string;

      // text alignment
      const paragraphStyle = _.get(
        attributedString,
        'attributes[0].attributes.paragraphStyle',
      );
      if (paragraphStyle) {
        textView.alignment = <TextAlignment>paragraphStyle.alignment;
      }
    }
  }

  parseSharedStyle(node: any, styleType: string, view: TextView) {}
  parseOverride(node: any, styleType: string, button: TextView) {}
}
