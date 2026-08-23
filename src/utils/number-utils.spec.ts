import { boundValue, formatNumber, formatPercent } from './number-utils';

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
        scenario                    | value | min   | max   | expected
        ${'integers'}               | ${5}  | ${10} | ${1}  | ${1}
        ${'floats'}                 | ${5}  | ${10} | ${1}  | ${1}
        ${'min integer, max float'} | ${5}  | ${10} | ${1}  | ${1}
        ${'min float, max integer'} | ${5}  | ${10} | ${1}  | ${1}
        ${'min and max are equal'}  | ${5}  | ${10} | ${10} | ${10}
      `('$scenario', ({ value, min, max, expected }) => {
        expect(() => boundValue(value, min, max)).toThrow(Error);
      });
    });
  });

  describe('formatNumber', () => {
    describe('should format numbers below 100K with comma grouping', () => {
      it.each`
        scenario                   | value     | decimals     | expected
        ${'zero'}                  | ${0}      | ${0}         | ${'0'}
        ${'small integer'}         | ${42}     | ${0}         | ${'42'}
        ${'thousands with commas'} | ${1234}   | ${0}         | ${'1,234'}
        ${'tens of thousands'}     | ${99_999}  | ${0}         | ${'99,999'}
        ${'with decimal places'}   | ${1234.5} | ${1}         | ${'1,234.5'}
        ${'default zero decimals'} | ${1234.7} | ${undefined} | ${'1,235'}
      `('$scenario', ({ value, decimals, expected }) => {
        expect(formatNumber(value, decimals)).toBe(expected);
      });
    });

    describe('should collapse large numbers with K/M/B suffixes', () => {
      it.each`
        scenario              | value            | expected
        ${'100K threshold'}   | ${100_000}       | ${'100.0K'}
        ${'hundreds of K'}    | ${456_789}       | ${'456.8K'}
        ${'millions'}         | ${1_500_000}     | ${'1.5M'}
        ${'tens of millions'} | ${12_345_678}    | ${'12.3M'}
        ${'billions'}         | ${2_500_000_000} | ${'2.5B'}
      `('$scenario', ({ value, expected }) => {
        expect(formatNumber(value)).toBe(expected);
      });
    });

    describe('should handle negative values', () => {
      it.each`
        scenario               | value       | expected
        ${'negative small'}    | ${-42}      | ${'-42'}
        ${'negative millions'} | ${-1_500_000} | ${'-1.5M'}
      `('$scenario', ({ value, expected }) => {
        expect(formatNumber(value)).toBe(expected);
      });
    });
  });

  describe('formatPercent', () => {
    describe('should format ratios as percentages', () => {
      it.each`
        scenario                 | ratio    | decimals     | expected
        ${'zero'}                | ${0}     | ${2}         | ${'0.00%'}
        ${'50%'}                 | ${0.5}   | ${2}         | ${'50.00%'}
        ${'100%'}                | ${1}     | ${2}         | ${'100.00%'}
        ${'fractional percent'}  | ${0.853} | ${2}         | ${'85.30%'}
        ${'no decimals'}         | ${0.75}  | ${0}         | ${'75%'}
        ${'one decimals'}        | ${0.123} | ${1}         | ${'12.3%'}
        ${'default two decimal'} | ${0.999} | ${undefined} | ${'99.90%'}
        ${'over 100%'}           | ${1.5}   | ${2}         | ${'150.00%'}
      `('$scenario', ({ ratio, decimals, expected }) => {
        expect(formatPercent(ratio, decimals)).toBe(expected);
      });
    });
  });
});
