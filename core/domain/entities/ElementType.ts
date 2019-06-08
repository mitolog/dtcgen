export enum ElementType {
  Page = 'Page',
  Artboard = 'Artboard',
  Symbol = 'Symbol',
  Container = 'Container',
  View = 'View',
  Button = 'Button',
  TextView = 'TextView',
  TextInput = 'TextInput',
  Image = 'Image',
  List = 'List',
  Cell = 'Cell',
  Map = 'Map',
  NavBar = 'NavigationBar',
}
export const ElementTypes: string[] = [
  ElementType[0],
  ElementType[1],
  ElementType[2],
  ElementType[3],
  ElementType[4],
  ElementType[5],
  ElementType[6],
  ElementType[7],
  ElementType[8],
  ElementType[9],
  ElementType[10],
  ElementType[11],
  ElementType[12],
];

export enum AutoDetectType {
  Text = 'text',
  Image = 'image',
  View = 'view',
  Cell = 'Cell',
}

export const AutoDetectTypeValues: string[] = [
  AutoDetectType.Text,
  AutoDetectType.Image,
  AutoDetectType.View,
  AutoDetectType.Cell,
];
