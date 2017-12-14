/* A function for chaining together asynchronous methods which use callbacks.
 * Pass in any number of functions. They will be composed such that the
 * first one is the outermost function in the callback chain, and the last one
 * is the innermost function.
 *
 * The return value is a function which executes the
 * chain. Any arguments to the returned function are passed as the second,
 * third, and so on arguments to the first function passed to callbackCompose.
 *
 * All parameter functions must accept a callback as their first argument,
 * except the last function in the list, which of course has no more callbacks
 * to chain towards.
 *
 * See below for an example. Note that this is similar to async.js's waterfall
 * function. The main difference is that waterfall accepts a fall-through error
 * callback. */
function callbackCompose(...funcs) {
  const callbackBind = (func, callback)=>{
    return (...args)=>func(callback, ...args);
  }
  let i = funcs.length-1;
  let chain = funcs[i];
  while (i>0) {
    --i;
    chain = callbackBind(funcs[i], chain);
  }
  return chain;
}

/* Example: */
callbackCompose(
  function getData(cb, url) {
    console.log(`Getting data from ${url}...`);
    window.setTimeout(()=>cb({text:"My Data",next:"/other/url"}), 3000);
  },
  function doWithData(cb, data) {
    console.log(`Got data!: <<${data.text}>>.`);
    console.log(`Getting additional data from ${data.next}...`);
    window.setTimeout(()=>cb({text:"We're done!"}), 1000);
  },
  function doneWithData(data) {
    console.log(`Got final bit of data!: <<${data.text}>>`);
  }
)
