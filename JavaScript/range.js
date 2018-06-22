/* Step is positive, even for reverse ranges: */
const range = (s, e, step = 1)=>{
  if (step <= 0) throw new Error('Step must be a positive number');
  if (s > e) [s, e] = [e, s];
  const length = Math.floor((e - s) / step) + 1;
  const rangeArr = Array.from({length});
  for (let i = 0, v = s; v <= e; ++i, v += step) rangeArr[i] = v;
  return rangeArr;
};
