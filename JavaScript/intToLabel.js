/* Produces a string label based on an integer number.
 * E.g. 0=>'A', 1=>'B', 26=>'AA', 27=>'AB' etc. */
function intToLabel(num) {
  var label = "";
  for (num = Math.floor(num); num >= 0; num = Math.floor(num/26)-1) {
    label = String.fromCharCode(num%26+65) + label;
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
