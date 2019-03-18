import { ElementType, Container } from './domain/Entities';

// you can refer "Type Guards and Differentiating Types" section
// https://www.typescriptlang.org/docs/handbook/advanced-types.html
const isNumber = (x: any): x is number => {
  return typeof x === 'number';
};
const isString = (x: any): x is string => {
  return typeof x === 'string';
};
const isBoolean = (x: any): x is boolean => {
  return typeof x === 'boolean';
};
const isSymbol = (x: any): x is Symbol => {
  return typeof x === 'symbol';
};

// todo: what if x is null or undefined?
const isContainer = (x: any): x is Container => {
  return (
    x.type !== undefined && x.type !== null && x.type === ElementType.Container
  );
};

export { isContainer };
