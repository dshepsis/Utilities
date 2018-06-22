function lexicalCompare(seq1, seq2) {
  const equalLen = (seq1.length === seq2.length);
  for (let i = 0; /* @No-conditional */; ++i) {
    if (seq1.length <= i) return (equalLen) ? 0 : -1;
    if (seq2.length <= i || seq1[i] > seq2[i]) return 1;
    if (seq1[i] < seq2[i]) return -1;
  }
}

console.assert(lexicalCompare([1, 2, 3], [0, 2, 3]) === 1);
console.assert(lexicalCompare([1, 2, 3], [1, 2, 2]) === 1);
console.assert(lexicalCompare([1, 2, 3], [1, 2]) === 1);
console.assert(lexicalCompare([1, 2, 3], [1, 2, 3]) === 0);
