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

  // ─── Boolean Expression Parser ───────────────────────────────────────────

  function parseExpression(src, varNames) {
    try {
      if (!src || src.trim() === '') return { ok: false, error: 'empty expression' };

      // Decide whether implicit AND is allowed (all var names are single char)
      const useImplicitAnd = varNames.every(n => n.length === 1);

      // Normalize text operators on word boundaries before tokenizing
      let s = src;
      s = s.replace(/\bAND\b/g, '*').replace(/\band\b/g, '*');
      s = s.replace(/\bOR\b/g,  '+').replace(/\bor\b/g,  '+');
      s = s.replace(/\bNOT\b/g, '!').replace(/\bnot\b/g, '!');

      // ── Tokenizer ──────────────────────────────────────────────────────────
      // Sort varNames by length descending for longest-match
      const sortedVars = varNames.slice().sort((a, b) => b.length - a.length);

      const tokens = [];
      let pos = 0;
      while (pos < s.length) {
        // Skip whitespace
        if (/\s/.test(s[pos])) { pos++; continue; }

        // Try to match a variable name (longest-match)
        let matched = false;
        for (const name of sortedVars) {
          if (s.startsWith(name, pos)) {
            tokens.push({ type: 'VAR', name });
            pos += name.length;
            matched = true;
            break;
          }
        }
        if (matched) continue;

        // Single-char tokens
        const ch = s[pos];
        if (ch === '+')      { tokens.push({ type: 'OP_OR' });        pos++; continue; }
        if (ch === '*' || ch === '·') { tokens.push({ type: 'OP_AND' }); pos++; continue; }
        if (ch === '!')      { tokens.push({ type: 'OP_NOT' });        pos++; continue; }
        if (ch === '~')      { tokens.push({ type: 'OP_NOT' });        pos++; continue; }
        if (ch === "'")      { tokens.push({ type: 'POSTFIX_NOT' });   pos++; continue; }
        if (ch === '(')      { tokens.push({ type: 'LPAREN' });        pos++; continue; }
        if (ch === ')')      { tokens.push({ type: 'RPAREN' });        pos++; continue; }
        if (ch === '0')      { tokens.push({ type: 'CONST', value: 0 }); pos++; continue; }
        if (ch === '1')      { tokens.push({ type: 'CONST', value: 1 }); pos++; continue; }

        throw new Error('unknown variable: ' + ch);
      }

      // ── Recursive-descent parser ───────────────────────────────────────────
      // Build index map for variable names
      const varIndex = {};
      varNames.forEach((name, i) => { varIndex[name] = i; });

      let tpos = 0;

      function peek() { return tokens[tpos]; }
      function consume() { return tokens[tpos++]; }

      function isFactorStart(tok) {
        if (!tok) return false;
        return tok.type === 'VAR' || tok.type === 'LPAREN' ||
               tok.type === 'OP_NOT' || tok.type === 'CONST';
      }

      function parseExpr() {
        let left = parseTerm();
        while (peek() && peek().type === 'OP_OR') {
          consume(); // eat '+'
          const right = parseTerm();
          left = { op: 'OR', args: [left, right] };
        }
        return left;
      }

      function parseTerm() {
        let left = parseFactor();
        while (true) {
          const next = peek();
          if (!next) break;
          if (next.type === 'OP_AND') {
            consume(); // eat explicit AND
            const right = parseFactor();
            left = { op: 'AND', args: [left, right] };
          } else if (isFactorStart(next)) {
            // Implicit AND
            if (!useImplicitAnd) {
              throw new Error('implicit AND not allowed with multi-character variable names');
            }
            const right = parseFactor();
            left = { op: 'AND', args: [left, right] };
          } else {
            break;
          }
        }
        return left;
      }

      function parseFactor() {
        const tok = peek();
        if (!tok) throw new Error('unexpected end of expression');

        if (tok.type === 'OP_NOT') {
          consume();
          const arg = parseFactor();
          return { op: 'NOT', arg };
        }

        return parseAtom();
      }

      function parseAtom() {
        const tok = peek();
        if (!tok) throw new Error('unexpected end of expression');

        if (tok.type === 'CONST') {
          consume();
          return { op: 'CONST', value: tok.value };
        }

        if (tok.type === 'VAR') {
          consume();
          const idx = varIndex[tok.name];
          if (idx === undefined) throw new Error('unknown variable: ' + tok.name);
          let node = { op: 'VAR', index: idx };
          // Handle postfix NOT (')
          if (peek() && peek().type === 'POSTFIX_NOT') {
            consume();
            node = { op: 'NOT', arg: node };
          }
          return node;
        }

        if (tok.type === 'LPAREN') {
          consume();
          const inner = parseExpr();
          if (!peek() || peek().type !== 'RPAREN') {
            throw new Error('unbalanced parentheses: missing )');
          }
          consume(); // eat ')'
          // Handle postfix NOT after closing paren
          if (peek() && peek().type === 'POSTFIX_NOT') {
            consume();
            return { op: 'NOT', arg: inner };
          }
          return inner;
        }

        throw new Error('unexpected token: ' + tok.type);
      }

      const ast = parseExpr();

      // Ensure all tokens consumed
      if (tpos < tokens.length) {
        const remaining = tokens[tpos];
        throw new Error('unexpected token after expression: ' + JSON.stringify(remaining));
      }

      return { ok: true, ast };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }

  function evaluateExpr(ast, minterm, n) {
    switch (ast.op) {
      case 'CONST': return ast.value;
      case 'VAR':   return (minterm >> (n - 1 - ast.index)) & 1;
      case 'NOT':   return 1 - evaluateExpr(ast.arg, minterm, n);
      case 'AND':   return ast.args.every(a => evaluateExpr(a, minterm, n) === 1) ? 1 : 0;
      case 'OR':    return ast.args.some(a => evaluateExpr(a, minterm, n) === 1)  ? 1 : 0;
      default: throw new Error('unknown AST node op: ' + ast.op);
    }
  }

  return { GRAY2, rowsCols, cellToMinterm, mintermToCell, popcount, isValidCube, extractTerm, groupRects, parseExpression, evaluateExpr };
}));
