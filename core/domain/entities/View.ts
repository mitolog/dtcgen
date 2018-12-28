import { ElementType } from './ElementType';
import { Constraints } from './Constraints';
import { Container } from './Container';
import { Rect } from './Rect';
import { Color } from './Color';

export class View extends Container {
  isVisible: boolean;
  rect: Rect;
  hierarchy?: number;
  containerId?: string;
  parentId?: string;
  constraints?: Constraints;
  backgroundColor?: Color;
  radius?: number;

  constructor(node: any, hierarchy: number) {
    super();

    // required
    this.type = ElementType.View;
    this.id = node.do_objectID;
    this.name = node.name;
    this.isVisible = node.isVisible;
    this.rect = new Rect(<Rect>{
      x: node.frame.x,
      y: node.frame.y,
      width: node.frame.width,
      height: node.frame.height,
    });
    // optional
    const belongingArtboard = node.getParent('artboard');
    if (belongingArtboard) {
      this.containerId = belongingArtboard.do_objectID;
    }
    const parent = node.getParent(); //node.getParent('group');
    // parent can be:
    // group, symbolMaster, page, artboard
    if (parent._class !== 'page') {
      this.parentId = parent.do_objectID;
    }
    this.hierarchy = hierarchy;
  }
}
