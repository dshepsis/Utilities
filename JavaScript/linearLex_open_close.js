/* A modified version of linearLex which adds support for explicit
 * parenthetical operators via the open and close properties: */
const nullishDefault = (...vals)=>{
  for (const val of vals) if (val !== null && val !== undefined) return val;
  return null;
};
function linearLex(grammar) {
  const anyType = nullishDefault(
    grammar.DEFAULT_NEXT,
    /* By default, properties in the grammar object are ignored if their value
     * isn't an object containing a regex property: */
    Object.keys(grammar).filter(typeName=>{
      const type = grammar[typeName];
      return (typeof type === 'object' && type.regex !== undefined);
    })
  );
  const startingTypes = nullishDefault(grammar.START, anyType);
  const endingTypes = nullishDefault(grammar.END, anyType);
  return (str)=>{
    const tokens = [];
    const openOperatorStack = [];
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

        /* Handle opening parenthetical operators: */
        /* Note that closing operators are handled first, to make the rare case
         * of something closing and opening the same tag be more useful: */
        let closeTag = type.close;
        if (closeTag !== undefined) {
          if (typeof closeTag === 'function') closeTag = closeTag(match);
          const lastOpener = openOperatorStack.pop();
          const emptyStack = (lastOpener === undefined);
          if (emptyStack || closeTag !== lastOpener.tag) {
            const lastOpenerInfo = emptyStack ?
              '' : ` Last opening operator had tag name "${lastOpener.tag}".`;
            throw new Error(
              `Lexing Error: Unmatched closing parenthetical operator `+
              `"${match[0]}" with tag name "${closeTag}" at character `+
              `${start} of parameter string.${lastOpenerInfo}`
            );
          }
          Object.assign(lastOpener.token, {
            closedAt: tokens.length,
            closingToken: lastToken,
          });
          Object.assign(lastToken, {
            isParenthetical: true,
            isCloser: true,
            closes: lastOpener.tag,
            openedAt: lastOpener.index,
            openingToken: lastOpener.token
          });
        }
        let openTag = type.open;
        if (openTag !== undefined) {
          if (typeof openTag === 'function') openTag = openTag(match);
          openOperatorStack.push({
            tag: openTag,
            token: lastToken,
            index: tokens.length
          });
          Object.assign(lastToken, {
            isParenthetical: true,
            isOpener: true,
            opens: openTag,
          });
        }

        /* Let grammar specify custom behavior on match: */
        if (typeof type.onMatch === 'function') {
          const modifiedToken = type.onMatch(lastToken, tokens);
          if (modifiedToken !== undefined) lastToken = modifiedToken;
          /* If the returned object has a truthy reject property, ignore this
           * match: */
          else if (modifiedToken.reject) continue;
        }

        tokens.push(lastToken);

        allowedTypes = type.next;
        if (allowedTypes === undefined || allowedTypes === "*") {
          allowedTypes = anyType;
        }
        continue outer;
      }
      /* If no match was found: */
      let errorLocation;
      if (tokens.length === 0) {
        errorLocation = `at the start of '${remainingStr}'`;
      } else {
        errorLocation = (
          `in '${remainingStr}' following a token of type '${lastToken.type}'`
        );
      }
      throw new Error(
        `Lexing Error: Could not find a match ${errorLocation} among the `+
        `following token types: [${allowedTypes}].`
      );
    }
    if (openOperatorStack.length !== 0) {
      const lastOpener = openOperatorStack[openOperatorStack.length - 1];
      throw new Error(
        `Lexing Error: Unmatched opening parenthetical operator `+
        `"${lastOpener.token.match[0]}" with tag name "${lastOpener.tag}" `+
        `at character ${lastOpener.token.start} of the parameter string.`
      );
    }
    if (endingTypes.indexOf(lastToken.type) === -1) throw new Error(
      `Lexing Error: String terminated with token "${lastToken.match[0]}" of `+
      `type "${lastToken.type}", but only the following types are allowed: `+
      `[${endingTypes}].`
    );
    return tokens;
  };
}

const operand = ['not', 'label', 'lParen'];
const operator = ['and', 'or', 'rParen', 'termSpace'];
const grammar = {
  START: operand,
  END: ['label', 'rParen', 'termSpace'],
  label: {
    regex: /^\s*\b([\w-]+)\b/,
    next: operator
  },
  not: {
    regex: /^\s*(\bnot\b|!)/,
    next: ['label', 'lParen']
  },
  and: {
    regex: /^\s*(\band\b|&&?|\+)/,
    next: operand
  },
  or: {
    regex: /^\s*(\bor\b|\|\|?|,)/,
    next: operand
  },
  lParen: {
    regex: /^\s*(\()/,
    open: 'paren',
    next: operand
  },
  rParen: {
    regex: /^\s*(\))/,
    close: 'paren',
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
const str = 'link&!internal&(anchor|notFound)';
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
const exp = ['label', 'and', 'not', 'label', 'and', 'lParen', 'label', 'or', 'label', 'rParen'];
console.assert(arrayEquals(
  myLexer(str).map(t=>t.type),
  exp
), `Results from parsing "${str}" did not match the expected [${exp}].`);
