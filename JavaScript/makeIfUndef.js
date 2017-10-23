/* A function for handling object properties which may be undefined. If the
 * property given by the key-string prop (the second parameter) is undefined,
 * then it is assigned the value val (the third parameter), which is then
 * returned. If the property exists (is not undefined), then its value is
 * returned.
 *
 * If the val parameter is a function, then it is lazily executed with no
 * parameters, and the return value is assigned to the object property only if
 * that property was undefined. This is useful if one wants to call an expensive
 * constructor only if there is not such an object already constructed with the
 * given property name. If you would actually like to assign a function, then
 * you will need to return that function from another one, like so:
 *
 *   makeIfUndef(myObj, "myMethod", ()=>myFunction)
 *
 * There is an optional fourth parameter, onExistence, which, if it is defined,
 * is executed when there is already a property on the given object with the
 * given name. onExistence is called with 1 parameter, the value of the pre-
 * existing property. */
function makeIfUndef(obj, prop, val, onExistence) {
  let existingVal = obj[prop];
  if (existingVal === undefined) {
    let newVal = (typeof val === "function") ? val() : val;
    obj[prop] = newVal
    return newVal;
  } else {
    if (onExistence !== undefined) onExistence(existingVal);
    return existingVal;
  }
}

/* An example use case, for objects with array values. If the given property
 * name is undefined, then a new, empty array literal is assigned to that
 * key, and the given value is pushed to that empty array. If the array already
 * existed, the given value is pushed to that existing array: */
function maybeArrayPush(obj, arrName, val) {
  makeIfUndef(obj, arrName, ()=>[]).push(val);
}
