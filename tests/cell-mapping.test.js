'use strict';
const { GRAY2, cellToMinterm, mintermToCell, rowsCols } = require('../kmap-core.js');

test('GRAY2 sequence', () => assertEqual(GRAY2, [0,1,3,2]));

test('rowsCols n=1', () => assertEqual(rowsCols(1), { rows: [0], cols: [0,1] }));
test('rowsCols n=2', () => assertEqual(rowsCols(2), { rows: [0,1], cols: [0,1] }));
test('rowsCols n=3', () => assertEqual(rowsCols(3), { rows: [0,1], cols: [0,1,3,2] }));
test('rowsCols n=4', () => assertEqual(rowsCols(4), { rows: [0,1,3,2], cols: [0,1,3,2] }));

test('cellToMinterm n=1', () => {
  assertEqual(cellToMinterm(0,0,1), 0);
  assertEqual(cellToMinterm(0,1,1), 1);
});
test('cellToMinterm n=2', () => {
  assertEqual(cellToMinterm(0,0,2), 0);
  assertEqual(cellToMinterm(1,1,2), 3);
});
test('cellToMinterm n=3 row0 cols [0,1,3,2]', () => {
  assertEqual([0,1,2,3].map(c => cellToMinterm(0,c,3)), [0,1,3,2]);
});
test('cellToMinterm n=3 row1 cols [4,5,7,6]', () => {
  assertEqual([0,1,2,3].map(c => cellToMinterm(1,c,3)), [4,5,7,6]);
});
test('cellToMinterm n=4 reference table', () => {
  const expected = [
    [0,1,3,2],
    [4,5,7,6],
    [12,13,15,14],
    [8,9,11,10],
  ];
  for (let r=0;r<4;r++) for (let c=0;c<4;c++)
    assertEqual(cellToMinterm(r,c,4), expected[r][c], `r=${r} c=${c}`);
});
test('mintermToCell inverts cellToMinterm for all n', () => {
  for (const n of [1,2,3,4]) {
    const {rows, cols} = rowsCols(n);
    for (let r=0;r<rows.length;r++) for (let c=0;c<cols.length;c++) {
      const m = cellToMinterm(r,c,n);
      assertEqual(mintermToCell(m,n), { r, c }, `n=${n} m=${m}`);
    }
  }
});
