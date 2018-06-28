const removeByValue = (arr, val)=>{
  const valIndex = arr.indexOf(val);
  if(valIndex !== -1) arr.splice(valIndex, 1);
  return arr;
};
const nullishDefault = (...vals)=>{
  for (const val of vals) if (val !== null && val !== undefined) return val;
  return null;
};
const linearLex = (grammar)=> {
  const anyType = removeByValue(Object.keys(grammar), 'start');
  const startingTypes = nullishDefault(grammar.start, anyType);
  const endingTypes = nullishDefault(grammar.end, anyType);
  return (str)=>{
    const tokens = [];
    let allowedTypes = startingTypes;
    let lastToken = null;

    /* Run the loop at least once, even if the string is empty (''), to allow
     * for potential matches, e.g. /(\s*)/: */
    let once = true;
    outer: for (let i = 0, len = str.length; once || i < len; once = false) {
      const remainingStr = str.substring(i);
      for (const typeName of allowedTypes) {
        const type = grammar[typeName];
        const match = remainingStr.match(type.regex);
        if (match === null) continue;
        const start = i + match.index;
        const end = start + match[0].length;
        i = end;
        lastToken = {match, type: typeName, start, end};
        tokens.push(lastToken);
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
          `'${lastToken.type}'`
        );
      }
      throw new Error(
        `Lexing Error: Could not find a match ${locationInfo} among the `+
        `following token types: [${allowedTypes}].`
      );
    }
    if (endingTypes.indexOf(lastToken.type) === -1) throw new Error(
      `Lexing Error: String terminated with token of type '${lastToken.type}', `+
      `but only the following are allowed: [${endingTypes}].`
    );
    return tokens;
  };
};

const operand = ['not', 'label', 'lParen'];
const operator = ['and', 'or', 'rParen', 'termSpace'];
const grammar = {
  start: operand,
  end: ['label', 'rParen', 'termSpace'],
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
const myLexer = linearLex(grammar);

/* Test: */

function t(str) {
  console.log(myLexer(str));
  console.log(myLexer(str).map(t=>t.match[1]));
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
  myLexer(str).map(t=>t.type),
  exp
), `Results from parsing "${str}" did not match the expected [${exp}].`);
