import { SketchNamingRuleValidator } from '../../cli-app/NamingRuleValidator';
import { Name } from '../domain/entities/Name';
import { SketchElementType } from '../domain/entities/SketchElementType';

describe('Test NamingRuleValidator', () => {
  let validator = null;
  beforeAll(async () => {
    validator = new SketchNamingRuleValidator(null);
  });

  it('isMatchedPattern', () => {
    const name = new Name(null, SketchElementType.Artboard);
    name.name = 'Booking_null';
    const result: [boolean, string?] = validator.isMatchedPattern(
      name,
      '%s - %s - %s',
    );
    expect(result[0]).toBe(false);
  });
});
