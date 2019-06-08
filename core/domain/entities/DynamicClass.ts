import { ElementType } from '../Entities';

export enum DynamicClassShift {
  up = 'UP',
  down = 'DOWN',
  left = 'LEFT',
  right = 'RIGHT',
}

export class DynamicClass {
  name: ElementType;
  excludeOnPaste: boolean;
  shift?: DynamicClassShift;

  private dynamicClassShifts: DynamicClassShift[] = [
    DynamicClassShift.up,
    DynamicClassShift.down,
    DynamicClassShift.left,
    DynamicClassShift.right,
  ];

  constructor(obj: Object) {
    this.name = obj['name'];
    this.excludeOnPaste = obj['excludeOnPaste'] || false;
    this.shift = (obj['shift'] as DynamicClassShift) || null;
  }

  getShift(): DynamicClassShift | null {
    if (this.shift === null) return null;
    const matched = this.dynamicClassShifts.filter(
      shift => shift === this.shift,
    );
    return matched && matched.length === 1 ? this.shift : null;
  }
}
