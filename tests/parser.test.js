'use strict';
const { parseExpression, evaluateExpr } = require('../kmap-core.js');

function evalAll(src, varNames, n) {
  const r = parseExpression(src, varNames);
  if (!r.ok) throw new Error('parse failed: ' + r.error);
  const out = [];
  for (let m = 0; m < (1<<n); m++) out.push(evaluateExpr(r.ast, m, n));
  return out;
}

test('constants: "0" and "1"', () => {
  assertEqual(evalAll('0', ['A','B'], 2), [0,0,0,0]);
  assertEqual(evalAll('1', ['A','B'], 2), [1,1,1,1]);
});
test('single variable A in n=2', () => {
  assertEqual(evalAll('A', ['A','B'], 2), [0,0,1,1]);
});
test('negation A\' and !A', () => {
  assertEqual(evalAll("A'", ['A','B'], 2), [1,1,0,0]);
  assertEqual(evalAll('!A', ['A','B'], 2), [1,1,0,0]);
});
test('implicit AND: AB', () => {
  assertEqual(evalAll('AB', ['A','B'], 2), [0,0,0,1]);
});
test('OR: A+B', () => {
  assertEqual(evalAll('A+B', ['A','B'], 2), [0,1,1,1]);
});
test('mixed: A\'B + AC, n=3', () => {
  assertEqual(evalAll("A'B + AC", ['A','B','C'], 3), [0,0,1,1,0,1,0,1]);
});
test('parens: A(B+C)', () => {
  assertEqual(evalAll('A(B+C)', ['A','B','C'], 3), [0,0,0,0,0,1,1,1]);
});
test('custom var names: X\'Y + XZ, n=3', () => {
  assertEqual(evalAll("X'Y + XZ", ['X','Y','Z'], 3), [0,0,1,1,0,1,0,1]);
});
test('multi-char names require explicit AND', () => {
  const r = parseExpression('In1 In2', ['In1','In2']);
  assert(!r.ok, 'should reject implicit AND with multi-char names');
});
test('multi-char names with explicit AND parse ok', () => {
  const r = parseExpression('In1 * In2', ['In1','In2']);
  assert(r.ok, 'should accept explicit AND');
});
test('unknown variable → parse error', () => {
  const r = parseExpression('A + Q', ['A','B']);
  assert(!r.ok);
});
test('unbalanced parens → parse error', () => {
  const r = parseExpression('A(B+C', ['A','B','C']);
  assert(!r.ok);
});
