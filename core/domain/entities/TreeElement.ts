export class TreeElement {
  public uid: string;
  public name: string;
  public elements: [TreeElement?];

  constructor(uid: string, name: string, elements?: [TreeElement]) {
    this.uid = uid;
    this.name = name.toLowerCamelCase(' ');
    this.elements = elements || [];
  }
}
