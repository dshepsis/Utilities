/* A modified version of linearLex_open_close which handles incomplete
 * strings without throwing errors. Instead, it returns a token array containing
 * error tokens which have more machine-readable descriptions of the issue: */
function nullishDefault(...vals) {
  for (const val of vals) if (val !== null && val !== undefined) return val;
  return null;
}

const linearLex = (()=>{
  const ERROR_CODES = {
    ILLEGAL_TYPE: Symbol('No legal token type was found.'),
    ILLEGAL_ENDING_TYPE: Symbol('No legal type was found at end of string.'),
    UNMATCHED_CLOSER: Symbol('Unmatched closing parenthetical operator'),
    UNMATCHED_OPENER: Symbol('Unmatched opening parenthetical operator')
  };
  function linearLex(grammar) {
    const ANY_TYPE = nullishDefault(
      grammar.DEFAULT_NEXT,
      /* By default, properties in the grammar object are ignored if their value
       * isn't an object containing a regex property: */
      Object.keys(grammar).filter(typeName=>{
        const type = grammar[typeName];
        return (typeof type === 'object' && type.regex !== undefined);
      })
    );
    const startingTypes = nullishDefault(grammar.START, ANY_TYPE);
    const endingTypes = nullishDefault(grammar.END, ANY_TYPE);
    const skipRegex = grammar.SKIP;
    return (str)=>{
      const tokens = [];
      const errorTokens = [];
      let valid = true;
      function pushErrorToken(token) {
        token.error = true;
        tokens.push(token);
        errorTokens.push(token);
        valid = false;
      }

      const openOperatorStack = [];
      let allowedTypes = startingTypes;
      let nonMatchingTypes = [];
      let lastToken = null;

      /* Run the loop at least once, even if the string is empty (''), to allow
       * for potential matches, e.g. /(\s*)/: */
      let once = true;
      outer: for (let i = 0, len = str.length; once || i < len; once = false) {
        const remainingStr = str.substring(i);
        if (skipRegex) {
          const match = remainingStr.match(skipRegex);
          if (match !== null) {
            const skippedChars = match.index + match[0].length;
            i += skippedChars;
            if (skippedChars !== 0) continue;
          }
        }
        for (const typeName of allowedTypes) {
          nonMatchingTypes.push(typeName);
          const type = grammar[typeName];
          const match = remainingStr.match(type.regex);
          if (match === null) continue;
          nonMatchingTypes = [];

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
              const message = (
                `Lexing Error: Unmatched closing parenthetical operator `+
                `"${match[0]}" with tag name "${closeTag}" at character `+
                `${start} of parameter string.${lastOpenerInfo}`
              );
              pushErrorToken({code: ERROR_CODES.UNMATCHED_CLOSER, message});
            } else {
              Object.assign(lastOpener.token, {
                closedAt: tokens.length,
                closingToken: lastToken,
              });
              Object.assign(lastToken, {
                closes: lastOpener.tag,
                openedAt: lastOpener.index,
                openingToken: lastOpener.token
              });
            }
            Object.assign(lastToken, {
              isParenthetical: true,
              isCloser: true
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
          if (allowedTypes === undefined) allowedTypes = ANY_TYPE;
          continue outer;
        }
        /* If no match was found: */
        let errorLocation;
        if (lastToken === null) {
          errorLocation = `at the start of '${remainingStr}'`;
        } else {
          errorLocation = (
            `in '${remainingStr}' following a token of type '${lastToken.type}'`
          );
        }
        const message = (
          `Lexing Error: Could not find a match ${errorLocation} among the `+
          `following token types: [${allowedTypes}].`
        );
        pushErrorToken({code: ERROR_CODES.ILLEGAL_TYPE, message});

        /* If no legal matching token was found, try allowing other types.
         * If all types were already checked, just exit. */
        if (allowedTypes === ANY_TYPE) break;
        const nonMatchingSet = new Set(nonMatchingTypes);
        allowedTypes = ANY_TYPE.filter(type => !nonMatchingSet.has(type));
        if (allowedTypes.length === 0) break;
      }
      if (openOperatorStack.length !== 0) {
        const lastOpener = openOperatorStack[openOperatorStack.length - 1];
        const message = (
          `Lexing Error: Unmatched opening parenthetical operator `+
          `"${lastOpener.token.match[0]}" with tag name "${lastOpener.tag}" `+
          `at character ${lastOpener.token.start} of the parameter string.`
        );
        pushErrorToken({code: ERROR_CODES.UNMATCHED_OPENER, message});
      }
      if (lastToken !== null && endingTypes.indexOf(lastToken.type) === -1) {
        const message = (
          `Lexing Error: String terminated with token "${lastToken.match[0]}" of `+
          `type "${lastToken.type}", but only the following types are allowed: `+
          `[${endingTypes}].`
        );
        pushErrorToken({code: ERROR_CODES.ILLEGAL_ENDING_TYPE, message});
      }
      return {valid, tokens, errorTokens};
    };
  }
  Object.assign(linearLex, ERROR_CODES);
  return linearLex;
})();

const operand = ['not', 'label', 'lParen'];
const operator = ['and', 'or', 'rParen'];
const grammar = {
  START: operand,
  END: ['label', 'rParen'],
  SKIP: /^\s*/,
  label: {
    regex: /^\b[\w-]+\b/,
    next: operator
  },
  not: {
    regex: /^(\bnot\b|!)/,
    next: ['label', 'lParen']
  },
  and: {
    regex: /^(\band\b|&&?|\+)/,
    next: operand
  },
  or: {
    regex: /^(\bor\b|\|\|?|,)/,
    next: operand
  },
  lParen: {
    regex: /^\(/,
    open: 'paren',
    next: operand
  },
  rParen: {
    regex: /^\)/,
    close: 'paren',
    next: operator
  }
};
const myLexer = linearLex(grammar);

/* Test: */

function t(str) {
  console.log(myLexer(str));
  console.log(myLexer(str).tokens.map(t=>t.match[0]));
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
  myLexer(str).tokens.map(t=>t.type),
  exp
), `Results from parsing "${str}" did not match the expected [${exp}].`);
