/* A modified version of linearLex which adds support for explicit
 * parenthetical operators via the open and close properties: */
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

/* A wrapper around a text input element. A tokenization of the element's value
 * is maintained, and various utility methods are provided for using and
 * manipulating the input value based on that tokenization: */
class TokenizedInputElement {
  constructor(inputElement, options = {}) {
    this.element = inputElement;
    if (options.lexer) {
      this.lexer = options.lexer;
    } else if (options.grammar) {
      this.lexer = linearLex(options.grammar);
    } else {
      throw new Error('A lexer or grammar must be given.');
    }
    this.tokenizeListeners = [];
    this.validTokenizeListeners = [];
    this.tokenize();
    this.element.addEventListener('input', ()=>this.tokenize(), false);
  }
  /* Returns an array of tokens produced by lexing the value of the input: */
  tokenize(grammar) {
    const lexer = (grammar === undefined) ? this.lexer : linearLex(grammar);
    this.lexData = lexer(this.element.value);
    this.tokens = this.lexData.tokens;
    for (const listener of this.tokenizeListeners) {
      listener(this.tokens, this);
    }
    if (this.lexData.valid) {
      for (const listener of this.validTokenizeListeners) {
        listener(this.tokens, this);
      }
    }
  }
  /* Adds the parameter functions as listeners for whenever the input element
   * is tokenized. Listeners are called with 2 parameters: the list of tokens
   * and this instance of TokenizedInputElement. */
  onTokenize(...functions) {
    this.tokenizeListeners.push(...functions);
  }
  /* Ibid, but listeners are only called if the tokenization is valid: */
  onValidTokenize(...functions) {
    this.validTokenizeListeners.push(...functions);
  }
  /* Allows removal of listeners added via onTokenize. Listeners may be
   * specified by name or identity. Returns true if any are removed: */
  removeTokenizeListener(...functions) {
    const listeners = this.tokenizeListeners;
    let anyRemoved = false;
    for (const fn of functions) {
      let index;
      if (typeof fn === 'string') {
        index = listeners.findIndex(listener => listener.name === fn);
      } else {
        index = listeners.indexOf(fn);
      }
      if (index === -1) continue;
      anyRemoved = true;
      listeners.splice(index, 1);
    }
    return anyRemoved;
  }
  /* Returns the input element's user-selection (highlight) bounds: */
  selectionIndices() {
    return [this.element.selectionStart, this.element.selectionEnd];
  }
  /* Gets the tokens which are included in the text selection given by either
   * the inputs selectionStart/End or the parameters if they're provided: */
  selectedTokens(trimFilter, start, end) {
    const tokens = this.tokens;
    const numTokens = tokens.length;

    /* Validate selection bounds: */
    const inputVal = this.element.value;
    const inputLen = inputVal.length;
    if (start < 0 || end > inputLen) throw new Error('Selection out of range!');
    if (start > end) throw new Error('Selection has reversed bounds!');

    /* Make bounds optional: */
    if (start === undefined) [start, end] = this.selectionIndices();
    else if (end === undefined) end = start;

    let tokenStartIndex = 0;
    for (; tokenStartIndex < numTokens; ++tokenStartIndex) {
      if (tokens[tokenStartIndex].end >= start) break;
    }
    let tokenEndIndex = tokenStartIndex;
    for (; tokenEndIndex < numTokens; ++tokenEndIndex) {
      if (tokens[tokenEndIndex].start > end) break;
    }

    /* Allow the user to filter out undesired tokens from the start and end */
    if (trimFilter !== undefined) {
      let [trimStart, trimEnd] = [tokenStartIndex, tokenEndIndex - 1];
      for (; trimStart < tokenEndIndex; ++trimStart) {
        if (!trimFilter(tokens[trimStart])) break;
      }
      for (; trimEnd > trimStart; --trimEnd) {
        if (!trimFilter(tokens[trimEnd])) break;
      }
      [tokenStartIndex, tokenEndIndex] = [trimStart, trimEnd + 1];
    }

    let stringStartIndex, stringEndIndex;
    if (tokenStartIndex === numTokens || tokenEndIndex === 0) {
      /* If no tokens are selected because the selection is entirely before or
       * after any tokens: */
      stringStartIndex = start;
      stringEndIndex = end;
    } else {
      stringStartIndex = Math.min(start, tokens[tokenStartIndex].start);
      stringEndIndex = Math.max(end, tokens[tokenEndIndex - 1].end);
    }
    const substring = inputVal.substring(stringStartIndex, stringEndIndex);
    return {
      tokenStartIndex, tokenEndIndex,
      tokens: tokens.slice(tokenStartIndex, tokenEndIndex),
      stringStartIndex, stringEndIndex, substring
    };
  }
  replaceSelectedTokens(replacementStr, filter, start, end) {
    const {stringStartIndex, stringEndIndex} = this.selectedTokens(filter, start, end);
    const currentVal = this.element.value;
    const modifiedVal = (
      currentVal.substring(0, stringStartIndex) +
      replacementStr +
      currentVal.substring(stringEndIndex)
    );
    this.element.value = modifiedVal;

    /* Refresh the tokenization after the change: */
    this.tokenize();
    return modifiedVal;
  }
} //Close Class TokenizedInputElement

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

const input = document.createElement('input');
input.type = 'text';
document.body.appendChild(input);
const selOut = document.createElement('pre');
const allOut = document.createElement('pre');
document.body.appendChild(selOut);
document.body.appendChild(allOut);
selOut.style.height = "2em";
allOut.style.height = "2em";
const tokenizer = new TokenizedInputElement(input, {grammar});

const labelTokenFilter = (token) => token.type !== "label";
const stringifyToken = t => t.match ? t.match[0] : t.code.toString();
tokenizer.onTokenize((tokens)=>{
  console.log(tokens);
  const selTokens = tokenizer.selectedTokens(labelTokenFilter).tokens;
  selOut.innerText = selTokens.map(stringifyToken);
  allOut.innerText = tokens.map(stringifyToken);
});

input.addEventListener('keyup', ()=>{
  const selTokens = tokenizer.selectedTokens(labelTokenFilter).tokens;
  selOut.innerText = selTokens.map(stringifyToken);
}, false);

const dogReplace = document.createElement('button');
dogReplace.innerHTML = 'Dog-ify';
document.body.appendChild(dogReplace);
dogReplace.addEventListener('click', ()=>{
  tokenizer.replaceSelectedTokens('Dog', labelTokenFilter);
});
