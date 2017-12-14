/* Returns a function which will execute the parameter function func, and prevent
 * re-executing the function for the next timeBetweenCalls milliseconds.
 *
 * Calls made during that time will be buffered. Buffered calls will be executed
 * one at a time at an interval of timeBetweenCalls milliseconds. Arguments are
 * preserved from each buffered call, and used in the order in which the calls
 * were made.
 *
 * NOTE: This function as-is is Zalgo-y. That is to say, the returned function
 * of a call to buffer sometimes calls the parameter func synchronously (if
 * there has not been a call recently, so it is unblocked) and sometimes calls
 * the parameter func asynchronously (when a call has been buffered).
 *
 *   I recommend modifying the final line `return func.apply(this, args);` to use
 * artificial deferring (e.g. setInterval(egFun, 0), setImmediate, nextTick,
 * postMessage, etc.) if you are using this function with any amount of
 * complexity. You may also wish to instead implement a error-if-not-immediate
 * version instead.
 *   See http://blog.izs.me/post/59142742143/designing-apis-for-asynchrony */
function buffer(func, timeBetweenCalls, bufferSize) {
  const bufferingOn = (bufferSize !== undefined && bufferSize > 0);
  const argBuffer = (bufferingOn) ? [] : undefined;
  const addToBuffer = (item)=>{
    /* If we're over max size, discard the oldest entry(s) in the buffer: */
    if (argBuffer.length >= bufferSize) {
      argBuffer.pop();
    }
    /* Place the new item at the start of the buffer (queue): */
    argBuffer.unshift(item);
  }
  let blocked = false;
  return function throttledFn(...args) {
    if (blocked) {
      if (bufferingOn) addToBuffer(args);
      return
    }
    blocked = true;
    const onTimeout = ()=>{
      blocked = false;
      if (bufferingOn && argBuffer.length > 0) {
        throttledFn.apply(this, argBuffer.pop())
      }
    }
    window.setTimeout(onTimeout, timeBetweenCalls);
    return func.apply(this, args);
  }
}
