import {
  ElementType,
  Container,
  FillType,
  FillTypeValues,
  Point,
  GradientType,
  GradientTypeValues,
  AutoDetectType,
  AutoDetectTypeValues,
  DynamicClass,
} from './domain/Entities';

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

const isFillType = (x: any): x is FillType => {
  return (
    x !== undefined &&
    x !== null &&
    isNumber(x) &&
    FillTypeValues.filter(val => val === x).length === 1
  );
};

const isGradientType = (x: any): x is GradientType => {
  return (
    x !== undefined &&
    x !== null &&
    isNumber(x) &&
    GradientTypeValues.filter(val => val === x).length === 1
  );
};

const isAutoDetectType = (x: any): x is AutoDetectType => {
  return (
    x !== undefined &&
    x !== null &&
    isString(x) &&
    AutoDetectTypeValues.filter(val => val === x).length === 1
  );
};

// check if `x` is string like "{0.99999999999999978, 0.49999999999999983}"
const isPoint = (x: any): x is Point => {
  return (
    x !== undefined &&
    x !== null &&
    typeof x === 'string' &&
    x.length > 0 &&
    x.match(/[0-9.]+/g) &&
    x.split(',').length === 2
  );
};

const isDynamicClass = (x: Object): x is DynamicClass => {
  return (
    x !== undefined &&
    x !== null &&
    typeof x === 'object' &&
    typeof x['name'] === 'string' &&
    typeof x['excludeOnPaste'] === 'boolean'
  );
};

export {
  isContainer,
  isFillType,
  isGradientType,
  isPoint,
  isAutoDetectType,
  isDynamicClass,
};
