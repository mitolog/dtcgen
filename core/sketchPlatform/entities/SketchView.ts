import * as uuidv4 from 'uuid/v4';
import * as _ from 'lodash';
import { View, ElementType, Rect } from '../../domain/Entities';

export class SketchView extends View {
  constructor(node: any, parentId?: string) {
    super();

    const uidValue: string = uuidv4();

    // required
    this.type = ElementType.View;
    this.id = uidValue;
    this.name = node.name;
    this.isVisible = node.isVisible;
    this.rect = new Rect(<Rect>{
      x: node.frame.x,
      y: node.frame.y,
      width: node.frame.width,
      height: node.frame.height,
    });
    // optional
    this.originalRect = new Rect(<Rect>{
      x: node.frame.x, // this is not relevant if it's symbol
      y: node.frame.y, // this is not relevant if it's symbol
      width: node.frame.width,
      height: node.frame.height,
    });

    if (parentId && parentId.length > 0) {
      this.parentId = parentId;
    }

    //todo: just for testing. randomly adopt background.
    // this.backgroundColor = new Color(<Color>{
    //   fill: ColorComponents.randomColor(),
    // });
    //this.parseBackground(node);
  }

  // AutoParserで行う parseBackgroundと同じものをここでもやってもいいが、
  // 本Viewをinstanciateした後に、HogeParser.parse() にて背景をパースするので、ここでは
  // デフォの値を入れなくてもいいっちゃいいとは思う
  private parseBackground(node: any) {}
}
