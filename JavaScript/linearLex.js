function linearLex(str, grammar) {
  const anyType = Object.keys(grammar);
  {
    const startIndex = anyType.indexOf('start');
    if (startIndex !== -1) anyType.splice(startIndex, 1);
  }
  const tokens = [];
  let allowedTypes = anyType;
  if (grammar.start !== undefined) allowedTypes = grammar.start;
  
  /* Run the loop at least once, even if the string is empty (''), to allow for
   * potential matches, e.g. /(\s*)/: */
  let once = true;
  outer: for (let i = 0, len = str.length; once || i < len; once = false) {
    const remainingStr = str.substring(i);
    for (const typeName of allowedTypes) {
      const type = grammar[typeName];
      const match = remainingStr.match(type.regex);
      if (match === null) continue;
      i += match.index;
      const start = i;
      i += match[0].length;
      const end = i;
      tokens.push({match, type: typeName, start, end});
      allowedTypes = type.next;
      if (allowedTypes === undefined || allowedTypes === "*") {
        allowedTypes = anyType;
      }
      continue outer;
    }
    /* If no match was found: */
    let locationInfo;
    if (tokens.length === 0) {
      locationInfo = `at the start of '${remainingStr}'`;
    } else {
      locationInfo = (
        `in '${remainingStr}' following token of type `+
        `'${tokens[tokens.length-1].type}'`
      );
    }
    throw new Error(
      `Lexing Error: Could not find a match ${locationInfo} among the `+
      `following token types: [${allowedTypes}].`
    );
  }
  return tokens;
}

const operand = ['not', 'label', 'lParen'];
const operator = ['and', 'or', 'rParen', 'termSpace'];
const grammar = {
  start: operand,
  label: {
    regex: /^\s*([\w-]+)/,
    next: operator
  },
  not: {
    regex: /^\s*(not|!)/,
    next: ['label', 'lParen']
  },
  and: {
    regex: /^\s*(and|&&?)/,
    next: operand
  },
  or: {
    regex: /^\s*(or|\|\|?|,)/,
    next: operand
  },
  lParen: {
    regex: /^\s*(\()/,
    next: operand
  },
  rParen: {
    regex: /^\s*(\))/,
    next: operator
  },
  termSpace: {
    regex: /^\s*$/
  }
};

/* Test: */

function t(str) {
  console.log(linearLex(str, grammar));
  console.log(linearLex(str, grammar).map(t=>t.match[1]));
}
const str = 'link&!internal';
t(str);
function arrayEquals(...arrs) {
  const len = arrs[0].length;
  for (const arr of arrs) if (len !== arr.length) return false;
  const nArrs = arrs.length;
  for (let i = 0; i < len; ++i) {
    const indexVal = arrs[0][i];
    for (let n = 1; n < nArrs; ++n) if (indexVal !== arrs[n][i]) return false;
  }
  return true;
}
const exp = ['label', 'and', 'not', 'label'];
console.assert(arrayEquals(
  linearLex(str, grammar).map(t=>t.type),
  exp
), `Results from parsing "${str}" did not match the expected [${exp}].`);
