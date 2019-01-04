import { ElementType } from './ElementType';
import { Rect } from './Rect';

export class Container {
  type: ElementType;
  id: string;
  name: string;
  rect: Rect;

  constructor(node: any) {
    this.type = ElementType.Container;
    this.id = node['do_objectID'];
    this.name = node['name'];
    this.rect = new Rect(<Rect>{
      x: 0,
      y: 0,
      width: node['frame'].width,
      height: node['frame'].height,
    });
  }
}
