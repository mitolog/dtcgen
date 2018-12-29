import { Rect } from '../../domain/entities/Rect';

/**
 * This class is for taking over from artboard view to symbol view
 */
export class TakeOverArtboardData {
  rect: Rect;
  hierarchy: number;
  parentId: string;

  name?: string;
  artboardId?: string;

  /**
   * take over data from the node on artboard to symbol.
   * @param node {any} node from which we take over data. should be instance on artboard.
   * @param hierarchy {number} hierarchy of view layer
   */
  constructor(node: any, hierarchy: number) {
    this.rect = new Rect(<Rect>{
      x: node.frame.x,
      y: node.frame.y,
      width: node.frame.width,
      height: node.frame.height,
    });
    this.hierarchy = hierarchy;
    this.artboardId = this.containerId(node);
    const parent = node.getParent();
    if (parent) {
      this.parentId = parent.do_objectID;
    } else {
      console.log('no parent on takeover data');
    }
    this.name = node.name;
  }

  private containerId(node: any): string {
    if (node._class === 'artboard') {
      return node.do_objectID;
    } else if (node._class === 'page' || node._class === 'sketch') {
      //console.log('no containerId on takeover data');
      return null;
    }
    const parent = node.getParent();
    return this.containerId(parent);
  }
}
