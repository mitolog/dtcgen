import { Node } from 'node-sketch';
import { LayerName } from '../../domain/Entities';
import { injectable } from 'inversify';

export interface ISketchPresenter {
  translate(nodes: Node[]): LayerName[];
}

@injectable()
export class SketchPresenter implements ISketchPresenter {
  // Imagine nodes are artboards'
  translate(nodes: Node[]): LayerName[] {
    return nodes.map(node => {
      return new LayerName(node['do_objectID'], node['name'], node['_class']);
    });
  }
}
