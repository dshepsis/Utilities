/**
 * Load many JSON files asynchronously. When all are loaded, call a
 * callback function:
 *
 * NOTE: The first parameter, fileListObj, must be an object mapping
 *   the desired variable name (e.g. "myData") to the URL from which
 *   to collect that data (e.g. "data/myData.json"). The URL may be relative or
 *   absolute.
 *
 *   Like so:
 *   >loadMultiJSON({
 *      myData: "data/myData.json";
 *      myOtherData: "data/myData2.json";
 *    }, ()=>console.log("Loading JSON complete!"));
 */
function loadMultiJSON (fileListObj, completeCallBack) {
  var varNames = Object.keys(fileListObj);
  var numResources = varNames.length;
  var resourcesLoaded = 0;
  for (var i = 0; i < numResources; ++i) {
    AJAXTextLoader(
        /* Closure so that each callback has the right variables: */
        function(varName) {
          /* Return the actual callback function: */
          return function(responseText){
            console.log(varName);
            console.log("Resources Loaded: " + resourcesLoaded);
            /* Make a global variable with the given name: */
            window[varName] = JSON.parse(responseText);
            ++resourcesLoaded;
            /* If this is the last resource to be loaded, call the callback fn: */
            if (typeof completeCallBack === "function" && resourcesLoaded === numResources) {
              completeCallBack();
            }
            /* If we somehow loaded more resources than we were supposed to,
             * print an error to console. I don't expect this to ever run, though */
            if (resourcesLoaded > numResources) console.error("Extra resource loaded: " + varName);
          }
        }(varNames[i]), //End of closure
        /* The URL from which to load the JSON File: */
        fileListObj[ varNames[i] ]
    ); //End of call to AJAXTextLoader
  }
}

/* Similar to the above, but checks the filename and only applies JSON.parse
 * to files ending in ".json". Anything else is saved as a plain-text string. */
function loadMulti (fileListObj, completeCallBack) {
  var varNames = Object.keys(fileListObj);
  var numResources = varNames.length;
  var resourcesLoaded = 0;
  for (var i = 0; i < numResources; ++i) {
    var fileName = filesListObj[ varNames[i]];
    var isJSON = (fileName.substr(-5).toLowerCase() === ".json");
    AJAXTextLoader(
        /* Closure so that each callback has the right variables: */
        function(varName, isJSON) {
          /* Return the actual callback function: */
          return function(responseText){
            /* Make a global variable with the given name: */
            window[varName] = (isJSON) ? JSON.parse(responseText) : responseText;
            ++resourcesLoaded;
            /* If this is the last resource to be loaded, call the callback fn: */
            if (typeof completeCallBack === "function" && resourcesLoaded === numResources) {
              completeCallBack();
            }
            /* If we somehow loaded more resources than we were supposed to,
             * print an error to console. I don't expect this to ever run, though */
            if (resourcesLoaded > numResources) console.error("Extra resource loaded: " + varName);
          }
        }(varNames[i], isJSON), //End of closure
        /* The URL from which to load the JSON File: */
        fileName
    ); //End of call to AJAXTextLoader
  }
}
