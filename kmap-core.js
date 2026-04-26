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

  function popcount(x){ x = x - ((x>>1)&0x55555555); x = (x&0x33333333) + ((x>>2)&0x33333333); return (((x + (x>>4)) & 0x0F0F0F0F) * 0x01010101) >> 24; }

  function isValidCube(minterms, n) {
    const k = minterms.length;
    if (k === 0 || (k & (k-1)) !== 0) return { ok:false, reason:'size not a power of 2' };
    let andMask = (1<<n) - 1, orMask = 0;
    for (const m of minterms) { andMask &= m; orMask |= m; }
    const freeBits = orMask & ~andMask;
    if (popcount(freeBits) !== Math.log2(k)) return { ok:false, reason:'not a cube' };
    const expect = new Set();
    for (let sub = 0; ; sub = (sub - freeBits) & freeBits) {
      expect.add(andMask | sub);
      if (sub === freeBits) break;
    }
    if (expect.size !== k) return { ok:false, reason:'not a cube' };
    for (const m of minterms) if (!expect.has(m)) return { ok:false, reason:'not a cube' };
    return { ok:true, andMask, freeBits };
  }

  function extractTerm(andMask, freeBits, n, varNames, mode) {
    const lits = [];
    for (let i = 0; i < n; i++) {
      const bit = 1 << (n - 1 - i);
      if (freeBits & bit) continue;
      const fixedOne = (andMask & bit) !== 0;
      if (mode === 'SOP') lits.push(fixedOne ? varNames[i] : varNames[i] + "'");
      else /* POS */     lits.push(fixedOne ? varNames[i] + "'" : varNames[i]);
    }
    if (lits.length === 0) return mode === 'SOP' ? '1' : '0';
    if (mode === 'SOP') return lits.join('');
    return '(' + lits.join('+') + ')';
  }

  function groupRects(minterms, n) {
    const cells = minterms.map(m => mintermToCell(m, n));
    const rs = [...new Set(cells.map(c => c.r))].sort((a,b)=>a-b);
    const cs = [...new Set(cells.map(c => c.c))].sort((a,b)=>a-b);
    const totalRows = rowsCols(n).rows.length;
    const totalCols = rowsCols(n).cols.length;
    function splitRanges(arr, total) {
      if (arr.length === total) return [{ start: 0, len: total }];
      if (arr[arr.length-1] - arr[0] === arr.length - 1) return [{ start: arr[0], len: arr.length }];
      for (let i = 1; i < arr.length; i++) {
        if (arr[i] !== arr[i-1] + 1) {
          return [
            { start: arr[0],   len: i },
            { start: arr[i],   len: arr.length - i },
          ];
        }
      }
      return [{ start: arr[0], len: arr.length }];
    }
    const rowRanges = splitRanges(rs, totalRows);
    const colRanges = splitRanges(cs, totalCols);
    const out = [];
    for (const rr of rowRanges) for (const cr of colRanges) {
      out.push({ r0: rr.start, c0: cr.start, h: rr.len, w: cr.len });
    }
    return out;
  }

  return { GRAY2, rowsCols, cellToMinterm, mintermToCell, popcount, isValidCube, extractTerm, groupRects };
}));
