str = `        msg = "A 400 Error occurred when requesting " + URLOfPageToVisit + ", That means \
the request sent to the server was malformed or corrupted.";`

// Huh, maybe this should be done using an AST instead of trying to parse things
// out myself...
function reformatMultilineString(str, maxLen) {
  /* Break parameter string into parts: */
  const leadingSpace = str.match(/^\s*/)[0];
  const varNameMatch = str.substr(leadingSpace.length).match(/(\S+)\s*=\s*/);
  const varName = varNameMatch[1];
  const strStartIndex = str.substr(varNameMatch.index + varNameMatch[0].length);
  const strExpr = str.substr(strStartIndex);

  /* Preformat repeating parts of output string: */
  const spaceAndVar = leadingSpace + varName;
  const firstLineStart = spaceAndVar + "  = ";
  const lineStart = spaceAndVar + " += ";
  const baseRemainingLen = maxLen - lineStart.length;

  /* Write output string: */
  let refStr = firstLineStart;
  let thisLineRemainingLen = baseRemainingLen;
  let curLineIsFresh = true;
  for (const subExpr of strExpr.split(/\s*+\s*/g)) {
    if (curLineIsFresh) {
      refStr += " + ";
    }
    if (subExpr.length <= thisLineRemainingLen) {
      refStr += (curLineIsFresh) ? subExpr : subExpr//asdfasdf
      continue;
    }

  }
}

reformatMultilineString(str, maxLen);
