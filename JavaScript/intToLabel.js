/* Produces a string vertex label based on its index (>=0): */
function intToLabel(index) {
  var label = "";
  index = Math.floor(index);
  for (; index >= 0; index = Math.floor(index/26)-1) {
    label = String.fromCharCode(index%26+65) + label;
  }
  return label;
}

/* Produces the integer corresponding to the given label string. Note that
 * labelToInt(intToLabel(i)) === i for all integers i less than 2^54 or so. */
function labelToInt(label) {
  var total = label.charCodeAt(label.length-1)-65;
  for (var i = label.length-2, factor = 26; i >= 0; --i, factor *= 26) {
    total += (label.charCodeAt(i)-65 + 1)*factor;
  }
  return total;
}
