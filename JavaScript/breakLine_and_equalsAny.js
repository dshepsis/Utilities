function fillStr(char, len) {
  const strSects = [];
  const numSects = Math.floor(len/char.length);
  for (let i = 0; i < numSects; ++i) {
    strSects.push(char);
  }
  return strSects.join('');
}

function equalsAny(val, possibleMatches) {
  for (const match of possibleMatches) {
    if (val === match) return true;
  }
  return false;
}

function breakLine(str) {
  const len = str.length;
  let ch = 0;
  let tokenStart = ch;
  const strParts = [];
  while (ch < len && /^\s$/.test(str.charAt(ch))) {
    ++ch;
  }
  const baseTabLevel = str.substring(tokenStart, ch);
  tokenStart = ch;

  let currTabLevel = 0;
  let nextLineTabLevel = currTabLevel;
  while (ch < len-1) {
    let lineBrokenAfterThisChar = false;
    let nextLineTabLevel = currTabLevel;
    const currChar = str.charAt(ch);
    const nextChar = str.charAt(ch+1);
    if        (equalsAny(currChar, '([{')) {
      ++nextLineTabLevel;
      lineBrokenAfterThisChar = true;
    } else if (equalsAny(currChar, ','  )) {
      lineBrokenAfterThisChar = true;
    } else if (equalsAny(nextChar, ')]}')) {
      --nextLineTabLevel;
      lineBrokenAfterThisChar = true;
    }

    if (lineBrokenAfterThisChar) {
    /* If this character *is* a token delimeter, make a new line: */
      let thisToken = baseTabLevel;
      thisToken += fillStr('\t', currTabLevel);
      thisToken += str.substring(tokenStart, ch + 1).trim();
      strParts.push(thisToken);
      tokenStart = ch+1;
    }
    currTabLevel = nextLineTabLevel
    ++ch;
  }
  let thisToken = baseTabLevel;
  thisToken += fillStr('\t', currTabLevel);
  thisToken += str.substring(tokenStart).trim();
  strParts.push(thisToken);
  return strParts.join('\n');
}
