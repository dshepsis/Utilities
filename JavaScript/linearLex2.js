/* Adds support for sequences of types in a type's 'next' property: */
function linearLex(str, grammar) {
  const anyType = Object.keys(grammar);
  {
    const startIndex = anyType.indexOf('start');
    if (startIndex !== -1) anyType.splice(startIndex, 1);
  }
  const tokens = [];
  let allowedSequences = anyType;
  if (grammar.start !== undefined) allowedSequences = grammar.start;

  const checkToken = (typeName, index)=>{
    const type = grammar[typeName];
    const match = str.substr(index).match(type.regex);
    if (match === null) return null;
    const start = index + match.index;
    const end = start + match[0].length;
    const token = {match, type: typeName, start, end};
    let next = type.next;
    if (next === undefined || next === "*") {
      next = anyType;
    }
    return {token, next};
  };

  /* Run the loop at least once, even if the string is empty (''), to allow for
   * potential matches, e.g. /(\s*)/: */
  let once = true;
  loopStr: for (let i = 0, len = str.length; once || i < len; once = false) {
    loopSeqs: for (const sequence of allowedSequences) {
      if (!Array.isArray(sequence)) {
        /* If the "sequence" is just a single type name (string): */
        const result = checkToken(sequence, i);

        /* If the pattern for the type doesn't match, check the next sequence: */
        if (result === null) continue;
        tokens.push(result.token);
        i = result.token.end;
        allowedSequences = result.next;
        continue loopStr;
      }
      let lastResultInSeq;
      const iBeforeSeq = i;
      for (const typeName of sequence) {
        const result = checkToken(typeName, i);
        if (result === null) {
          /* If the sequence breaks, reset i to the start of the sequence: */
          i = iBeforeSeq;
          continue loopSeqs;
        }
        /* This will keep getting overwritten until the last item in sequence: */
        lastResultInSeq = result;
        tokens.push(result.token);
        i = result.token.end;
      }
      /* We ignore the "next" values for types in the middle of a sequence.
       * only the "next" of the last result in a matching sequence is used: */
      allowedSequences = lastResultInSeq.next;
      continue loopStr;
    }
    /* If no match was found: */
    let locationInfo;
    const remainingStr = str.substr(i);
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
      `following token types/sequences: ${JSON.stringify(allowedSequences)}.`
    );
  }
  return tokens;
}

const operand = ['not', 'label', 'lParen'];
const operator = ['and', 'or', 'rParen', 'termSpace'];
const grammar = {
  start: operand,
  label: {
    regex: /^([\w-]+)/,
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
