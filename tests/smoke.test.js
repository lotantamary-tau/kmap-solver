'use strict';
const KMapCore = require('../kmap-core.js');
test('kmap-core loads as a module', () => {
  assert(typeof KMapCore === 'object', 'expected KMapCore to be an object');
});
