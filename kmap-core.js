(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.KMapCore = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const GRAY2 = [0, 1, 3, 2];

  function rowsCols(n) {
    if (n === 1) return { rows: [0],   cols: [0,1] };
    if (n === 2) return { rows: [0,1], cols: [0,1] };
    if (n === 3) return { rows: [0,1], cols: GRAY2.slice() };
    return         { rows: GRAY2.slice(), cols: GRAY2.slice() };
  }

  function cellToMinterm(r, c, n) {
    const { rows, cols } = rowsCols(n);
    const rBits = rows[r], cBits = cols[c];
    if (n === 1) return cBits;
    if (n === 2) return (rBits << 1) | cBits;
    return (rBits << 2) | cBits; // n=3 or n=4
  }

  function mintermToCell(m, n) {
    const { rows, cols } = rowsCols(n);
    let rBits, cBits;
    if (n === 1) { rBits = 0;            cBits = m & 1; }
    else if (n === 2) { rBits = (m>>1)&1; cBits = m & 1; }
    else { rBits = (m >> 2) & 3;  cBits = m & 3; }
    return { r: rows.indexOf(rBits), c: cols.indexOf(cBits) };
  }

  return { GRAY2, rowsCols, cellToMinterm, mintermToCell };
}));
