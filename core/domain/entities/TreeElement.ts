import { Container } from './Container';

export class TreeElement {
  public uid: string;
  public name: string;
  public elements: [TreeElement?];

  constructor(container: Container, elements?: [TreeElement]) {
    this.uid = container.id;
    this.name = container.name;
    this.elements = elements || [];
  }
}
