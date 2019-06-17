//const madge = require('madge');
import * as madge from 'madge';

describe('dependency check', () => {
  it('check circular dependency', () => {
    return madge('dist/cli-app/index.js').then(res => {
      const ary = res.circular();
      expect(ary).toStrictEqual([]);
    });
  });
});
