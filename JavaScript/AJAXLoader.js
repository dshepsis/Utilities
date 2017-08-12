/**
 * General purpose asynchronous loading function.
 *
 * NOTE: This isn't really meant to be used on its own. Instead, I make other
 *     functions for each specific application (e.g. text loading, document
 *     loading, etc.) and write functions which serve to partially-apply arguments
 *     to AJAXLoader.
 *
 * @param {string} requestURL - The url of the request to be made. It may be
 *     relative or absolute.
 * @param {function} onGoodResponse - A callback for handling the httpRequest
 *     when the request is complete and valid (i.e. its readyState is DONE and
 *     its status is 200).
 * @param {*} [onError] - Used for handling of errors. Behavior depends on type:
 *     If onError is missing or undefined, a standard error will be thrown.
 *     If it is null, no error will be thrown (except by the browser itself) and
 *       the request will fail silently.
 *     If it is a function, it will be executed with the httpRequest object as
 *       its parameter.
 *     If it is of any other type, it will be printed as an error message using
 *       console.error.
 * @param {*} [onComplete] - Handles any remaining tasks after a request has been
 * completed. Behavior depends on type:
 *     If it is a function, it will be called as the last piece of code in a
 *       request. This occurs regardless of whether an error is called, and
 *       always happens after onGoodResponse and onError.
 *     If it is undefined, nothing will happen after onGoodResponse or onError.
 *     If it is of any other type, it will be printed using console.log (again,
 *       after onGoodResponse and onError).
 * @param {string} [responseType] - Sets the responseType property of the
 *     httpRequest object before it is sent. Valid values include "text", "json"
 *     "document" and "blob". This doesn't affect the parameters of the above 3
 *     callback functions, but it does affect how the response is parsed.
 *     If this parameter is omitted or set to undefined, no responseType will be
 *     set. This causes equivalent behavior to setting responseType to "text".
 */
function AJAXLoader(requestURL, onGoodResponse, onError, onComplete, responseType, onReadyStateChange) {
  let httpRequest = new XMLHttpRequest();
  httpRequest.onreadystatechange = function() {
    if (typeof onReadyStateChange === 'function') {
      onReadyStateChange(httpRequest);
    }
    if (httpRequest.readyState === XMLHttpRequest.DONE) {
      if (httpRequest.status === 200) { //Code for "Good"
        onGoodResponse(httpRequest);
      } else {
        /* onError is optional, but we should still emit an error if it's absent: */
        if (onError === undefined) {
          throw new Error("XHR Error: " + httpRequest.status);
        }
        /* If onError is a function, allow it to handle the error: */
        else if (typeof onError === 'function') {
          onError(httpRequest);
        }
        /* If onError is null, it must have been explicitly to null, defining
         * a deliberate lack of an error handler. In that case, fail silently.
         *
         * Otherwise, just print onError to console as an error message: */
        else if (onError !== null) {
          console.error(onError);
        }
      }
      /* onComplete is optional. If it is a function, execute it: */
      if (typeof onComplete === 'function') {
        onComplete(httpRequest);
      }
      /* ...Otherwise, just print it. This mainly assumes onComplete is a string,
       * bt it could be anything: */
      else if (onComplete !== undefined) console.log(onComplete);
    }
  }
  httpRequest.open("GET", requestURL);
  if (responseType !== undefined) httpRequest.responseType = responseType;
  httpRequest.send();
  httpRequest.sent = true;
  return httpRequest;
}

/* Partially applied version of AJAXLoader specialized for loading files
 * as plain-text. */
function textLoader(fileURL, responseCallBack, errorHandler, onComplete) {
  return AJAXLoader(fileURL,
    function onGoodResponse(httpRequest) {
      responseCallBack(httpRequest.responseText);
    },
    errorHandler,
    onComplete,
  );
}
