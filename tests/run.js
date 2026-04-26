'use strict';
const fs = require('fs');
const path = require('path');

const tests = [];
global.test = (name, fn) => tests.push({ name, fn });
global.assert = (cond, msg) => { if (!cond) throw new Error(msg || 'assertion failed'); };
global.assertEqual = (actual, expected, msg) => {
  const a = JSON.stringify(actual), b = JSON.stringify(expected);
  if (a !== b) throw new Error(`${msg || 'mismatch'}: expected ${b}, got ${a}`);
};
global.assertThrows = (fn, msg) => { let threw=false; try{fn();}catch{threw=true;} if(!threw) throw new Error(msg||'expected throw'); };

const dir = __dirname;
for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.test.js'))) {
  require(path.join(dir, f));
}

let pass = 0, fail = 0; const failures = [];
for (const t of tests) {
  try { t.fn(); pass++; }
  catch (e) { fail++; failures.push(`✗ ${t.name}\n    ${e.message}`); }
}
console.log(`\n${pass} passed, ${fail} failed (${tests.length} total)`);
if (failures.length) { console.log('\n' + failures.join('\n')); process.exit(1); }
