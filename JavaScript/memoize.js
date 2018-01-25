class ArgMap {
  constructor() {
    this.weakMap = new WeakMap();
    this.primMap = new Map();
  }
  set(key, value) {
    if (typeof key === 'object') {
      this.weakMap.set(key, value);
    } else {
      this.primMap.set(key, value);
    }
    return this;
  }
  get(key) {
    if (typeof key === 'object' && key !== null) {
      return this.weakMap.get(key);
    }
    return this.primMap[key];
  }
}

function memoize(fn) {
  /* Array indexed by number of arguments -> array indexed by argument index ->
   * Map from argument (by identity) to return value: */
  const memo = [];

  /* This is done so that this function can memoize functions which return
   * undefined, which would otherwise have their memoized values be
   * indisitnguishable from unmemoized value, since Map.get will returnundefined
   * if the corresponding key has not yet been set. */
  const UNDEF_RETURN = Symbol("Function returned undefined");
  function undefToSymbol(fnRetVal) {
    return (fnRetVal === undefined) ? UNDEF_RETURN : fnRetVal;
  }

  function recordCallInMemo(args, numArgs) {
    if (numArgs === undefined) {
      numArgs = args.length || 1;
    }
    const retVal = fn(...args);
    let argIndexToArgMap = memo[numArgs];
    if (argIndexToArgMap === undefined) {
      argIndexToArgMap = [];
      for (let n = 0; n < numArgs; ++n) {
        const argToRetMap = new ArgMap();
        argToRetMap.set(args[n], undefToSymbol(retVal));
        argIndexToArgMap[n] = argToRetMap;
      }
      memo[numArgs] = argIndexToArgMap;
    } else {
      for (let n = 0; n < numArgs; ++n) {
        argIndexToArgMap[n].set(args[n], undefToSymbol(retVal));
      }
    }
    return retVal;
  }

  return function(...args) {
    /* Treat a zero-argument call as a 1-argument call: fn(undefined) */
    const numArgs = args.length || 1;
    const argIndexToArgMap = memo[numArgs];

    /* If we have not yet memoized a call with this many arguments, record it:
     * Note that we can't use recordCallInMemo here because we also need to
     * create the structure  */
    if (argIndexToArgMap === undefined) {
      return recordCallInMemo(args, numArgs);
    }

    /* Check if we've memoized a call by comparing arguments with the maps: */
    const memoizedRetVal = argIndexToArgMap[0].get(args[0]);

    /* If we have not recorded any calls with the same first (zeroth) argument,
     * memoize this call immediately: */
    if (memoizedRetVal === undefined) {
      return recordCallInMemo(args, numArgs);
    }

    /* If we have recorded a call with the same zeroth argument, make sure that
     * the rest of the arguments map to the same return value. Otherwise, this
     * call has not yet been memoized: */
    for (let n = 1; n < numArgs; ++n) {
      if(memoizedRetVal !== argIndexToArgMap[n].get(args[n])) {
        return recordCallInMemo(args, numArgs);
      }
    }
    return (memoizedRetVal === UNDEF_RETURN) ? undefined : memoizedRetVal;
  };
}

/* Example: */
function long(a) {
  for (let i = 0; i < 20000; ++i) {
    new Array(1000).join('*').split('').reverse().join('***');
  }
  return a + 3;
}

const mLong = memoize(long);
mLong(4); //Takes a while
mLong(4); //Very fast
mLong(3); //Takes a while
mLong(3, "Hello"); //Takes a while
