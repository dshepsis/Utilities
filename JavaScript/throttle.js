/* Returns a function which will execute the parameter function fn, and prevent
 * re-executing the function for the next timeBetweenCalls milliseconds.
 *
 * It is essentially debounce-like function which doesn't refresh the blocking
 * timer on each callback. Instead, the function is simply blocked for the
 * specified ammount of time, regardless of the number of calls made during that
 * time.
 *
 * If queue1Call is set to a truthy value, and the returned function is
 * called while blocked, a call to the function is queued. That is, it will be
 * called immediately when the initial timer expires (timeBetweenCalls
 * milliseconds after the initial blocking call). Regardless of the amount of
 * calls blocked, only 1 call to fn is queued. The queued call also refreshes
 * the blocking timer, preserving the rate-limitting property. */
function throttle(fn, timeBetweenCalls, queue1Call) {
  let blocked = false, queuedArgs = null;
  return function limitedFn(...args) {
    let context = this;
    queuedArgs = (queue1Call && blocked) ? args : null;
    if (blocked) return;
    blocked = true;
    const onTimeout = ()=>{
      blocked = false;
      if (queue1Call && queuedArgs !== null) {
        limitedFn.apply(context, queuedArgs);
      }
    }
    window.setTimeout(onTimeout, timeBetweenCalls);

    /* Call the function with apply, to preserve
     * context for things like prototype functions: */
    fn.apply(context, args);
  }
}
