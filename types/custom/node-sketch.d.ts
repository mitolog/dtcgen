// Type definitions for SketchNode
// Project: [LIBRARY_URL_HERE]
// Definitions by: [YOUR_NAME_HERE] <[YOUR_URL_HERE]>
// Definitions: https://github.com/borisyankov/DefinitelyTyped
declare namespace SketchNode.prototype {
  // Node.prototype.getAll.!ret
  type GetAllRet = Array<SketchNode>;
}

/**
 * Abstract class that it's used by all other classes, providing basic functionalities.
 *
 * @abstract
 */
declare interface SketchNode {
  /**
   *
   * @param parent
   * @param data
   */
  new (parent: SketchNode, data: any);

  /**
   * Find a SketchNode ascendent matching with the type and condition
   *
   * @param  {String} [type] - The SketchNode type
   * @param  {Function|String} [condition] - The SketchNode name or a callback to be executed on each parent and must return true or false. If it's not provided, only the type argument is be used.
   * @return {SketchNode|Sketch|undefined}
   * @param type?
   * @param condition?
   * @return
   */
  getParent(type?: string, condition?: {} | string): SketchNode;

  /**
   * Get the sketch element associated with this node
   *
   * @return {Sketch|undefined}
   * @return
   */
  getSketch(): /* !this */ any;

  /**
   * Add/replace new childrens in this node
   * @param {string} key  The node key
   * @param {SketchNode|Object|Array} node The node/s to insert
   * @param key
   * @param node
   */
  set(key: string, node: SketchNode | Array<SketchNode>): void;

  /**
   * Push a new children in this node
   * @param {string} key The node key
   * @param {SketchNode|Object} node The node/s to insert
   *
   * @return {SketchNode} The new node inserted
   * @param key
   * @param node
   * @return
   */
  push(key: string, node: SketchNode): SketchNode;

  /**
   * Search and returns the first descendant node that match the type and condition.
   *
   * @param  {String} type - The SketchNode type
   * @param  {Function|String} [condition] - The node name or a callback to be executed on each node that must return true or false. If it's not provided, only the type argument is be used.
   * @return {SketchNode|undefined}
   * @param type
   * @param condition?
   * @return
   */
  get(type: string, condition?: {} | string): SketchNode;

  /**
   * Search and returns all descendant nodes matching with the type and condition.
   * @example
   * //Get the first page
   * const page = sketch.pages[0];
   *
   * //Get all colors found in this page
   * const colors = page.getAll('color');
   *
   * //Get all colors with specific values
   * const blueColors = page.getAll('color', (color) => {
   *  return color.blue > 0.5 && color.red < 0.33
   * });
   *
   * @param  {String} type - The SketchNode type
   * @param  {Function|String} [condition] - The node name or a callback to be executed on each node that must return true or false. If it's not provided, only the type argument is be used.
   * @return {SketchNode[]}
   * @param type
   * @param condition?
   * @param result
   * @return
   */
  getAll(
    type: string,
    condition?: {} | string,
    result: Array<any>
  ): SketchNode.prototype.GetAllRet;

  /**
   * Removes the node from its parent
   *
   * @return {SketchNode}
   * @return
   */
  detach(): /* !this */ any;

  /**
   * Replace this node with other
   *
   * @param {SketchNode} node - The node to use
   *
   * @return {SketchNode} The new node
   * @param node
   * @return
   */
  replaceWith(node: SketchNode): SketchNode;

  /**
   * Creates a deep clone of this node
   *
   * @param {SketchNode|undefined} parent - The new parent of the clone. If it's not defined use the current parent.
   *
   * @return {SketchNode}
   * @param parent
   * @return
   */
  clone(parent: SketchNode): SketchNode;

  /**
   * Returns a json with the node data
   *
   * @return {Object}
   * @return
   */
  toJson(): any;
}

/**
 *
 * @param type
 * @param condition
 * @return
 */
declare function getCondition(type: string, condition: {} | string): string;

/**
 *
 * @param target
 * @param condition
 * @param result
 */
declare function findNode(
  target: SketchNode,
  condition: string,
  result: Array<any>
): void;

/**
 *
 * @param target
 * @param condition
 * @param result
 * @return
 */
declare function findLayer(
  target: SketchNode,
  condition: string,
  result: Array<any>
): Array<any>;

declare module "node-sketch" {
  export = SketchNode; //es6 style module export
}
