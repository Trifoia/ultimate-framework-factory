/**
 * Options passed to ejs when rendering
 * 
 * See individual items for option descriptions taken directly from ejs docs
 */
module.exports = {
  // Compiled functions are cached, requires filename
  // cache: null,

  // Used by cache to key caches, and for includes
  // filename: null,

  // Function execution context
  // context: null,

  // When false no debug instrumentation is compiled
  // compileDebug: null,

  // Returns standalone compiled function
  // client: null,

  // Character to use with angle brackets for open/close
  // delimiter: null,

  // Output generated function body
  // debug: null,

  // Whether or not to use with() {} constructs. If false then the locals will be stored in the locals object.
  // _with: null,

  // Name to use for the object storing local variables when not using with Defaults to locals
  // localsName: null,

  // Remove all safe-to-remove whitespace, including leading and trailing whitespace. It also enables a safer
  // version of -%> line slurping for all scriptlet tags (it does not strip new lines of tags in the middle of a line).
  rmWhitespace: true,

  // The escaping function used with <%= construct. It is used in rendering and is .toString()ed in the
  // generation of client functions. (By default escapes XML).
  // escape: null,

  // Set to a string (e.g., 'echo' or 'print') for a function to print output inside scriptlet tags.
  // outputFunctionName: null,

  // When true, EJS will use an async function for rendering. (Depends on async/await support in the JS runtime.)
  async: true
};
