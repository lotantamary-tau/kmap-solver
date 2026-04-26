'use strict';
const { defaultLayout, cellToMinterm, mintermToCell, rowsCols, groupRects, GRAY2, GRAY3 } = require('../kmap-core.js');

test('GRAY3 sequence', () => assertEqual(GRAY3, [0,1,3,2,6,7,5,4]));

test('defaultLayout matches existing convention', () => {
  assertEqual(defaultLayout(1), { rowVars: [],     colVars: [0] });
  assertEqual(defaultLayout(2), { rowVars: [0],    colVars: [1] });
  assertEqual(defaultLayout(3), { rowVars: [0],    colVars: [1, 2] });
  assertEqual(defaultLayout(4), { rowVars: [0, 1], colVars: [2, 3] });
});

// n=3 layout AB\C: rowVars=[0,1] (Gray over A,B), colVars=[2] (just C)
// Rows (top->bottom AB Gray = 00,01,11,10), Cols (left->right C = 0,1):
//   row=0 (AB=00): m=0 (000), m=1 (001)
//   row=1 (AB=01): m=2 (010), m=3 (011)
//   row=2 (AB=11): m=6 (110), m=7 (111)
//   row=3 (AB=10): m=4 (100), m=5 (101)
test('AB\\C layout cellToMinterm n=3', () => {
  const layout = { rowVars: [0, 1], colVars: [2] };
  const expected = [
    [0, 1],
    [2, 3],
    [6, 7],
    [4, 5],
  ];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 2; c++) {
    assertEqual(cellToMinterm(r, c, 3, layout), expected[r][c], `r=${r} c=${c}`);
  }
});

// n=3 layout B\AC: rowVars=[1] (just B), colVars=[0,2] (Gray over A,C)
// Rows (B=0,1), Cols (AC Gray = 00,01,11,10):
//   row=0 (B=0): m=0 (A=0 C=0), m=1 (A=0 C=1), m=5 (A=1 C=1), m=4 (A=1 C=0)
//   row=1 (B=1): m=2 (A=0 C=0,B=1), m=3, m=7, m=6
test('B\\AC layout cellToMinterm n=3', () => {
  const layout = { rowVars: [1], colVars: [0, 2] };
  const expected = [
    [0, 1, 5, 4],
    [2, 3, 7, 6],
  ];
  for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) {
    assertEqual(cellToMinterm(r, c, 3, layout), expected[r][c], `r=${r} c=${c}`);
  }
});

// n=4 layout A\BCD: rowVars=[0] (just A), colVars=[1,2,3] (3-bit Gray over B,C,D)
// Cols (BCD Gray = 000,001,011,010,110,111,101,100): GRAY3 = [0,1,3,2,6,7,5,4]
// row=0 (A=0): m = GRAY3[c]      // top half
// row=1 (A=1): m = 8 + GRAY3[c]  // bottom half
test('A\\BCD layout n=4', () => {
  const layout = { rowVars: [0], colVars: [1, 2, 3] };
  for (let c = 0; c < 8; c++) {
    assertEqual(cellToMinterm(0, c, 4, layout), GRAY3[c], `top c=${c}`);
    assertEqual(cellToMinterm(1, c, 4, layout), 8 + GRAY3[c], `bot c=${c}`);
  }
});

test('mintermToCell inverts cellToMinterm for non-standard layouts', () => {
  const cases = [
    { n: 3, layout: { rowVars: [0, 1], colVars: [2] } },
    { n: 3, layout: { rowVars: [1],    colVars: [0, 2] } },
    { n: 4, layout: { rowVars: [0],    colVars: [1, 2, 3] } },
    { n: 4, layout: { rowVars: [0, 1, 2], colVars: [3] } },
  ];
  for (const { n, layout } of cases) {
    const { rows, cols } = rowsCols(n, layout);
    for (let r = 0; r < rows.length; r++) for (let c = 0; c < cols.length; c++) {
      const m = cellToMinterm(r, c, n, layout);
      assertEqual(mintermToCell(m, n, layout), { r, c }, `n=${n} layout=${JSON.stringify(layout)} r=${r} c=${c}`);
    }
  }
});

// 4 corners {0,2,8,10} should still produce 4 single-cell rects under any layout
// because no matter how we arrange the variables, those 4 minterms differ in 2 bit positions
// and the others in their "cube" don't appear in the set, so each is isolated.
test('groupRects: 4 corners {0,2,8,10} under non-standard layouts', () => {
  for (const layout of [
    { rowVars: [0, 1], colVars: [2, 3] }, // standard
    { rowVars: [0],    colVars: [1, 2, 3] },
    { rowVars: [0, 1, 2], colVars: [3] },
    { rowVars: [1, 2], colVars: [0, 3] },
  ]) {
    const rs = groupRects([0, 2, 8, 10], 4, layout);
    assert(rs.length >= 1 && rs.length <= 4, `layout=${JSON.stringify(layout)} got ${rs.length} rects`);
  }
});

// The full 16-cell cube under any layout collapses to a single rectangle (the whole grid)
test('groupRects: full cube collapses to one rect under any layout', () => {
  const all16 = Array.from({length:16}, (_,i)=>i);
  for (const layout of [
    { rowVars: [0, 1], colVars: [2, 3] },
    { rowVars: [0],    colVars: [1, 2, 3] },
    { rowVars: [0, 1, 2], colVars: [3] },
  ]) {
    const rs = groupRects(all16, 4, layout);
    assertEqual(rs.length, 1);
  }
});
