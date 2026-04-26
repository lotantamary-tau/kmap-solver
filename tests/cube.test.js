'use strict';
const { isValidCube, extractTerm, groupRects } = require('../kmap-core.js');

test('isValidCube: single minterm is valid', () => {
  const r = isValidCube([5], 4);
  assertEqual(r.ok, true); assertEqual(r.andMask, 5); assertEqual(r.freeBits, 0);
});
test('isValidCube: power-of-2 size required', () => {
  assertEqual(isValidCube([0,1,2], 3).ok, false);
});
test('isValidCube: {0,1,4,5} n=4 is a cube (freeBits = 0b0101)', () => {
  const r = isValidCube([0,1,4,5], 4);
  assertEqual(r.ok, true); assertEqual(r.andMask, 0); assertEqual(r.freeBits, 0b0101);
});
test('isValidCube: {0,5} n=3 is not a cube', () => {
  assertEqual(isValidCube([0,5], 3).ok, false);
});
test('isValidCube: 4 corners {0,2,8,10} n=4 is a cube', () => {
  const r = isValidCube([0,2,8,10], 4);
  assertEqual(r.ok, true); assertEqual(r.andMask, 0); assertEqual(r.freeBits, 0b1010);
});
test('isValidCube: full cube {0..15} n=4 is valid (freeBits=0xF)', () => {
  const all = Array.from({length:16},(_,i)=>i);
  const r = isValidCube(all, 4);
  assertEqual(r.ok, true); assertEqual(r.freeBits, 0xF);
});

const ABCD = ['A','B','C','D'];

test('extractTerm SOP: andMask=5,freeBits=0,n=3 → AB\'C', () => {
  assertEqual(extractTerm(5, 0, 3, ['A','B','C'], 'SOP'), "AB'C");
});
test('extractTerm SOP: andMask=0,freeBits=0b0101,n=4 → A\'C\'', () => {
  assertEqual(extractTerm(0, 0b0101, 4, ABCD, 'SOP'), "A'C'");
});
test('extractTerm SOP: andMask=0,freeBits=0b1010,n=4 → B\'D\' (4 corners)', () => {
  assertEqual(extractTerm(0, 0b1010, 4, ABCD, 'SOP'), "B'D'");
});
test('extractTerm SOP: all free → "1"', () => {
  assertEqual(extractTerm(0, 0xF, 4, ABCD, 'SOP'), '1');
});
test('extractTerm POS: same {0,5} cube but POS form', () => {
  assertEqual(extractTerm(0, 0, 2, ['A','B'], 'POS'), '(A+B)');
});
test('extractTerm POS: all free → "0"', () => {
  assertEqual(extractTerm(0, 0xF, 4, ABCD, 'POS'), '0');
});

test('groupRects: contiguous row n=3 minterms {4,5,7,6}', () => {
  const rs = groupRects([4,5,7,6], 3);
  assertEqual(rs.length, 1);
  assertEqual(rs[0], { r0: 1, c0: 0, h: 1, w: 4 });
});
test('groupRects: wrap pair n=3 {0,2}', () => {
  const rs = groupRects([0,2], 3);
  assertEqual(rs.length, 2);
  rs.sort((a,b)=>a.c0-b.c0);
  assertEqual(rs[0], { r0: 0, c0: 0, h: 1, w: 1 });
  assertEqual(rs[1], { r0: 0, c0: 3, h: 1, w: 1 });
});
test('groupRects: 4 corners n=4 → 4 rects', () => {
  const rs = groupRects([0,2,8,10], 4);
  assertEqual(rs.length, 4);
});
