import { SketchNamingRuleValidator } from '../../cli-app/NamingRuleValidator';
import { NameInterface } from '../domain/entities/Name';
import { SketchElementType } from '../domain/entities/SketchElementType';

describe('Test NamingRuleValidator', () => {
  class NameMock implements NameInterface {
    id: string;
    name: string;
    isValid: boolean;
    hints: string[];
    type: SketchElementType;
  }

  let validator, nameMock;

  beforeAll(async () => {
    validator = new SketchNamingRuleValidator(null);
    nameMock = new NameMock();
  });

  describe('isMatchedPattern', () => {
    it('validate underscore and few letters', () => {
      nameMock.name = 'Booking_null';
      const result: [boolean, string?] = validator.isMatchedPattern(
        nameMock,
        '%s - %s - %s',
      );
      expect(result[0]).toBe(false);
      //expect(result[1]).toBe(string);
    });

    it('validate hyphen without space', () => {
      nameMock.name = 'Booking-null-error';
      const result: [boolean, string?] = validator.isMatchedPattern(
        nameMock,
        '%s - %s - %s',
      );
      expect(result[0]).toBe(false);
      //expect(result[1]).toBe(string);
    });

    it('validate ok pattern', () => {
      nameMock.name = 'Booking - null - error';
      const result: [boolean, string?] = validator.isMatchedPattern(
        nameMock,
        '%s - %s - %s',
      );
      expect(result[0]).toBe(true);
      //expect(result[1]).toBe(string);
    });
  });
});
