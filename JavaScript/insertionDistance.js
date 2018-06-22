/* Calculates the number of characters that would need to be inserted into
 * a pattern string in order to generate the reference string. Useful for
 * fuzzy-finders */
function insertionDistance(ptrn, refStr) {
  let insertions = 0;
  let ptrnIndex = 0;
  let refIndex = 0;
  const ptrnLen = ptrn.length;
  const refLen = refStr.length;
  if (ptrnLen > refLen) {
    return -1;
  }
  while (ptrnIndex < ptrnLen) {
    ++refIndex;
    if (ptrn.charAt(ptrnIndex) === refStr.charAt(refIndex-1)) {
      ++ptrnIndex;
      continue;
    } else {
      ++insertions;
      if (refIndex >= refLen) return -2;
    }
  }
  return insertions + refLen - refIndex;
}

console.log(insertionDistance("foo", "frodo")); // 2
console.log(insertionDistance("rodo", "frodo")); // 1
console.log(insertionDistance("frodo", "frodo")); //0
console.log(insertionDistance("gandalf", "frodo")); //-1, pattern longer than reference
console.log(insertionDistance("bilbo", "frodo")); //-2, pattern doesn't match reference
