'use strict';
const { generatePrimes } = require('../kmap-core.js');

function primeKey(p) { return `${p.mask}|${p.dashes}`; }
function primeKeys(ps) { return ps.map(primeKey).sort(); }

test('single minterm: prime is itself', () => {
  const p = generatePrimes([5], 3);
  assertEqual(p.length, 1);
  assertEqual(p[0].mask, 5);
  assertEqual(p[0].dashes, 0);
});
test('two adjacent: m={1,3} n=3 merges to one prime mask=1, dashes=2', () => {
  const p = generatePrimes([1,3], 3);
  assertEqual(p.length, 1);
  assertEqual(p[0].mask & ~p[0].dashes, 1); // C=1, B free
  assertEqual(p[0].dashes, 0b010);
});
test('full row m={4,5,6,7} n=3 collapses to mask=4, dashes=0b011', () => {
  const p = generatePrimes([4,5,6,7], 3);
  assertEqual(p.length, 1);
  assertEqual(p[0].dashes, 0b011);
  assertEqual(p[0].mask & ~p[0].dashes, 4); // A=1, B and C free
});
test('all 16 cells n=4 collapse to one all-dashed prime', () => {
  const p = generatePrimes(Array.from({length:16},(_,i)=>i), 4);
  assertEqual(p.length, 1);
  assertEqual(p[0].dashes, 0b1111);
});
test('classic 4-var: m={4,8,9,10,11,12,13,14,15} n=4 yields 2 primes', () => {
  // QM generates exactly 2 prime implicants: {4,12} and {8..15}
  const p = generatePrimes([4,8,9,10,11,12,13,14,15], 4);
  assert(p.length >= 2, `expected ≥2 primes, got ${p.length}`);
});

const { findMinimumCover } = require('../kmap-core.js');

test('cover: m={1,3} n=3 → single prime cover (essential)', () => {
  const r = findMinimumCover([1,3], [], 3);
  assertEqual(r.length, 1);
});
test('cover: classic 4-var → 2 primes (A + BC\'D\')', () => {
  const r = findMinimumCover([4,8,9,10,11,12,13,14,15], [], 4);
  assertEqual(r.length, 2);
});
test('cover with don\'t cares: ones={1,3,7,11,15} X={0,2,5} → 2 primes', () => {
  const r = findMinimumCover([1,3,7,11,15], [0,2,5], 4);
  assertEqual(r.length, 2);
});
test('cover: empty ones → empty cover', () => {
  const r = findMinimumCover([], [], 3);
  assertEqual(r.length, 0);
});
test('cover: all 1s → single all-dashed prime', () => {
  const r = findMinimumCover([0,1,2,3], [], 2);
  assertEqual(r.length, 1);
  assertEqual(r[0].dashes, 0b11);
});
