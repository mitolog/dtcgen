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
