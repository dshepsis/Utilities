/* Simple class for a mutable queue of functions which can be fired in-sequence
 * at any time. You could, say, pass to some event-handler a function which
 * calls the fire method on an instance of this class. You would then be able
 * to modify the behavior of that event-handler (e.g. add new listeners) without
 * maintaining a reference to it.
 *
 * Of course, addEventListener already does this sort of thing by default, but
 * there may be other APIs or situations where you would have to use this sort
 * of thing instead. */
class EventQueue {
  constructor(...funcs) {
    this.queue = [];
    this.subscribe(...funcs);
  }
  subscribe(...funcs) {
    this.queue.push(...funcs);
	  return this;
  }
  fire(...args) {
  	for (const func of this.queue) func(...args);
  }
}
