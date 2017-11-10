/* A helper function which throws a pre-baked error message when the parameter
 * ambiguousVar does not match the type specified by desiredType:
 * NOTE: Not a substitute for proper type annotation or transpilation-time
 * validation such as Flow or TypeScript. */
function validateType(ambiguousVar, desiredType, nameStr = "variable") {
  /* Validate the type of nameStr: */
  if (typeof nameStr !== 'string') {
    throw new TypeError(`nameStr must be a string. Instead, its type was \
'${typeof nameStr}'.`);
  }
  let isCorrectType = false;
  let desiredTypeStr;
  const validationStyle = typeof desiredType;

  /* Check whether we are validating the type against a string (with typeof) or
   * a constructor function (with instanceof): */
  if (validationStyle === 'string') {
    isCorrectType = (typeof ambiguousVar === desiredType);
    desiredTypeStr = desiredType;
  } else if (
    validationStyle === 'function'
    && desiredType.prototype !== undefined
  ) {
    desiredTypeStr = desiredType.name;
    isCorrectType = (ambiguousVar instanceof desiredType);
  } else {
    /* Throw a TypeError because desiredType has an invalid type: */
    throw new TypeError(`desiredType must be a string (matching the typeof to \
validate against) or a constructor function (matching the instanceof to \
validate against). Instead, its type was: ${validationStyle}.`);
  }
  if (isCorrectType) {
    return ambiguousVar;
  } else {
    let wrongType = typeof ambiguousVar;

    /* Special case for null, which has type 'object' for legacy reasons: */
    if (ambiguousVar === null) wrongType = "null pointer";
    else if (wrongType === 'object') wrongType = ambiguousVar.constructor.name;

    /* Actually throw the meaningful error: */
    throw new TypeError(`${nameStr} must be of type "${desiredTypeStr}"! \
Instead, it was of type ${wrongType}.`);
  }
}
