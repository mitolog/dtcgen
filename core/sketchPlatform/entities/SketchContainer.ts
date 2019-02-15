import * as uuidv4 from 'uuid/v4';
import { Container } from '../../domain/entities/Container';
import { ElementType } from '../../domain/entities/ElementType';
import { Rect } from '../../domain/entities/Rect';

export class SketchContainer extends Container {
  constructor(node: any) {
    super();

    const uidValue: string = uuidv4();

    this.type = ElementType.Container;
    this.id = uidValue;
    this.name = node['name'];
    this.rect = new Rect(<Rect>{
      x: 0,
      y: 0,
      width: node['frame'].width,
      height: node['frame'].height,
    });
  }
}
