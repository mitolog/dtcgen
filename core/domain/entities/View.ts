import { ElementType } from './ElementType';
import { Constraints } from './Constraints';
import { Container } from './Container';
import { Rect } from './Rect';
import { Color } from './Color';
import { ColorComponents } from './ColorComponents';

export class View extends Container {
  isVisible: boolean;
  originalRect: Rect; // hold original rect to use for calculating constraints properly.

  hierarchy?: number;
  containerId?: string;
  symbolId?: string;
  parentId?: string;
  constraints?: Constraints;
  backgroundColor?: Color;
  radius?: number;

  constructor(node: any, hierarchy: number) {
    super(node);

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
    this.originalRect = new Rect(<Rect>{
      x: node.frame.x, // this is not relevant if it's symbol
      y: node.frame.y, // this is not relevant if it's symbol
      width: node.frame.width,
      height: node.frame.height,
    });
    const belongingArtboard = node.getParent('artboard');
    if (belongingArtboard) {
      this.containerId = belongingArtboard.do_objectID;
    }

    // If the node is `symbolMaster`, it's parent will be `Symbols` page.
    // So you cannot track parent when `symbolMaster`.
    const parent = node.getParent();
    // parent can be: group, symbolMaster, page, artboard
    if (parent._class !== 'page') {
      this.parentId = parent.do_objectID;
    }
    this.hierarchy = hierarchy;

    if (node.symbolID) {
      this.symbolId = node.symbolID;
    }

    // todo: just for testing. randomly adopt background.
    this.backgroundColor = new Color(<Color>{
      fill: ColorComponents.randomColor(),
    });
  }
}
