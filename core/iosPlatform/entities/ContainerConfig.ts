import { Container, View, ElementType } from '../../domain/Entities';

export type DataVariable = {
  type: ElementType;
  variableName: string;
  treeName: string;
  classPrefix: string;
};
export type Size = { width: number; height: number };
export type Insets = {
  top: number;
  left: number;
  bottom: number;
  right: number;
};
export type ListSection = {
  sectionName: string;
  classPrefix: string;
  variableName: string;
  size: Size;
  insets: Insets;
};
export class ContainerConfig {
  container?: Container;
  dataVariables?: DataVariable[];
  dynamicClasses?: string[];
  listName?: string;
  listViewId: string;
  listSections?: ListSection[];
  views?: View[];
}

/**
  // containerNameConfig.swift.hbs
  {
    container: { name: "travelCities" },
    dataVariables: [
      { 
        type: "Cities",  // quickTypeで生成したクラスと同名
        name: "cities"   // quickTypeで生成したクラスの頭文字を小文字に
      }
    ],
    dynamicClasses: [
        "cityCell", "hotelCell"  // tree.json上での名前
    ],
    listName: "CityList",
    listSections: [
      { 
        sectionName: "CitySection",   // quickTypeで生成したクラス名 + Section
        classPrefix: "City",
        variableName: "cities",
        size: { width: 100, height: 100},
        insets: { top: 0, left: 0, bottom: 0, right: 0 }
      }
    ]
  }
 */
