import { boundValue } from './number-utils';

describe('Number Utils', () => {
  describe('boundValue', () => {
    describe('should return the number if it is within the bounds', () => {
      it.each`
        scenario                             | value    | min      | max     | expected
        ${'integer within bounds'}           | ${5}     | ${1}     | ${10}   | ${5}
        ${'integer at lower bound'}          | ${1}     | ${1}     | ${10}   | ${1}
        ${'integer at upper bound'}          | ${10}    | ${1}     | ${10}   | ${10}
        ${'negative integer within bounds'}  | ${-5}    | ${-10}   | ${-1}   | ${-5}
        ${'negative integer at lower bound'} | ${-10}   | ${-10}   | ${-1}   | ${-10}
        ${'negative integer at upper bound'} | ${-1}    | ${-10}   | ${-1}   | ${-1}
        ${'float within bounds'}             | ${5.5}   | ${1.0}   | ${10.0} | ${5.5}
        ${'float at lower bound'}            | ${1.0}   | ${1.0}   | ${10.0} | ${1.0}
        ${'float at upper bound'}            | ${10.0}  | ${1.0}   | ${10.0} | ${10.0}
        ${'negative float within bounds'}    | ${-5.5}  | ${-10.0} | ${-1.0} | ${-5.5}
        ${'negative float at lower bound'}   | ${-10.0} | ${-10.0} | ${-1.0} | ${-10.0}
        ${'negative float at upper bound'}   | ${-1.0}  | ${-10.0} | ${-1.0} | ${-1.0}
      `('$scenario', ({ value, min, max, expected }) => {
        expect(boundValue(value, min, max)).toBe(expected);
      });
    });

    describe('should return the appropriate bound if the number is outside the bounds', () => {
      it.each`
        scenario                       | value | min  | max   | expected
        ${'integer below lower bound'} | ${-5} | ${1} | ${10} | ${1}
        ${'integer above upper bound'} | ${15} | ${1} | ${10} | ${10}
      `('$scenario', ({ value, min, max, expected }) => {
        expect(boundValue(value, min, max)).toBe(expected);
      });
    });

    describe('should throw an error if the minimum boundary is greater than or equal to the maximum boundary', () => {
      it.each`
        scenario                                            | value | min   | max  | expected
        ${'integers'} | ${5}  | ${10} | ${1} | ${1}
        ${'floats'} | ${5}  | ${10} | ${1} | ${1}
        ${'min integer, max float'} | ${5}  | ${10} | ${1} | ${1}
        ${'min float, max integer'} | ${5}  | ${10} | ${1} | ${1}
        ${'min and max are equal'} | ${5}  | ${10} | ${10} | ${10}
      `(
        '$scenario',
        ({ value, min, max, expected }) => {
          expect(() => boundValue(value, min, max)).toThrow(Error);
        },
      );
    });
  });
});
