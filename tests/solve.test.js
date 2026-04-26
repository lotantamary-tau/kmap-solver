'use strict';
const { solve } = require('../kmap-core.js');

const ABCD = ['A','B','C','D'];

function valuesFromMinterms(ones, dontCares, n) {
  const v = Array(1<<n).fill(0);
  for (const m of ones) v[m] = 1;
  for (const m of dontCares) v[m] = 'X';
  return v;
}

test('solve SOP: tautology n=2', () => {
  const r = solve([1,1,1,1], 2, 'SOP', ['A','B']);
  assertEqual(r.expression, '1');
  assertEqual(r.groups.length, 1);
});
test('solve SOP: F=0 n=2', () => {
  const r = solve([0,0,0,0], 2, 'SOP', ['A','B']);
  assertEqual(r.expression, '0');
  assertEqual(r.groups.length, 0);
});
test('solve SOP: m=5 only n=3 → AB\'C', () => {
  const v = valuesFromMinterms([5], [], 3);
  const r = solve(v, 3, 'SOP', ['A','B','C']);
  assertEqual(r.expression, "AB'C");
});
test('solve SOP: m={1,3} n=3 → A\'C', () => {
  const v = valuesFromMinterms([1,3], [], 3);
  const r = solve(v, 3, 'SOP', ['A','B','C']);
  assertEqual(r.expression, "A'C");
});
test('solve SOP: m={0,2} n=3 → A\'C\'', () => {
  const v = valuesFromMinterms([0,2], [], 3);
  const r = solve(v, 3, 'SOP', ['A','B','C']);
  assertEqual(r.expression, "A'C'");
});
test('solve SOP: 4 corners n=4 → B\'D\'', () => {
  const v = valuesFromMinterms([0,2,8,10], [], 4);
  const r = solve(v, 4, 'SOP', ABCD);
  assertEqual(r.expression, "B'D'");
});
test('solve SOP: classic n=4 → 2 terms (A + BC\'D\')', () => {
  const v = valuesFromMinterms([4,8,9,10,11,12,13,14,15], [], 4);
  const r = solve(v, 4, 'SOP', ABCD);
  assertEqual(r.groups.length, 2);
});
test('solve SOP with don\'t cares: ones={1,3,7,11,15} X={0,2,5} → 2 terms', () => {
  const v = valuesFromMinterms([1,3,7,11,15], [0,2,5], 4);
  const r = solve(v, 4, 'SOP', ABCD);
  assertEqual(r.groups.length, 2);
});
test('solve POS: zeros={0,1,4,5} n=3 → F=B', () => {
  const v = Array(8).fill(0);
  for (const m of [2,3,6,7]) v[m] = 1;
  const r = solve(v, 3, 'POS', ['A','B','C']);
  assertEqual(r.expression, 'B');
});
test('solve uses custom var names', () => {
  const v = valuesFromMinterms([5], [], 3);
  const r = solve(v, 3, 'SOP', ['X','Y','Z']);
  assertEqual(r.expression, "XY'Z");
});
test('group has minterms, term, color, rects', () => {
  const v = valuesFromMinterms([0,2,8,10], [], 4);
  const r = solve(v, 4, 'SOP', ABCD);
  const g = r.groups[0];
  assert(Array.isArray(g.minterms));
  assert(typeof g.term === 'string');
  assert(typeof g.color === 'string');
  assert(Array.isArray(g.rects));
});
