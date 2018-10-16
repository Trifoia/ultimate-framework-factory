'use_strict';
/* eslint-disable valid-jsdoc */

const DEFAULT_REGEX = /{{[A-Z0-9]+}}/g;

/**
 * The RegexMatch class handles the regex-match transform style. All values matching
 * a provided / pre-defined regex identifier will be replaced with the provided vars that
 * match that identifier
 *
 * The form of the functions in this file are described here:
 * https://nodejs.org/api/stream.html#stream_implementing_a_transform_stream
 */
class RegexMatch {
  constructor(args) {
    this.pattern = DEFAULT_REGEX;
    if (args.opts.pattern) {
      // The pattern was set in the arguments
      this.pattern = new RegExp(args.opts.pattern);
    }

    // Gather all vars
    this.vars = args.vars;
  }

  /**
   * The transform function simply saves the chunks into memory
   */
  transform(chunk, encoding, callback) {
    if (!this.chunks) this.chunks = [];
    this.chunks.push(chunk);
    callback();
  }

  /**
   * The flush function uses the saved chunk data to modify the string
   */
  flush(callback) {
    if (!this.chunks) {
      return callback(null, Buffer.alloc(0));
    }

    let fileString = Buffer.concat(this.chunks).toString();

    let match = fileString.match(this.pattern);
    if (!match) {
      // No match means there is nothing to alter
      return callback(null, Buffer.from(fileString));
    }

    // Check the matches against the provided vars
    // Start by converting all vars into regex
    let varKeys = Object.keys(this.vars);
    let varRegex = varKeys.map((key) => {
      return new RegExp(key);
    });

    // Now check for matches that contain the provided vars
    let foundMatches = [];
    match = match.filter((matchStr) => {
      let notFound = true;
      varRegex.forEach((varReg, varIndex) => {
        if (varReg.test(matchStr)) {
          // Match found! Add it to the found matches if it's not already there
          if (!foundMatches.includes(matchStr)) {
            foundMatches.push({matchStr, value: this.vars[varKeys[varIndex]]});
          }

          notFound = false;
        }
      });

      return notFound;
    });

    // If any matches remain, that means we don't have a var that goes with it
    if (match.length > 0) {
      let err = new Error(`\n
  Error: Unable to find matching var for pattern(s): 
    ${match}
    Aborting process
`);
      throw err;
    }

    // Apply the found matches!
    foundMatches.forEach((foundMatch) => {
      let matchRegex = new RegExp(foundMatch.matchStr, 'g');
      fileString = fileString.replace(matchRegex, foundMatch.value);
    });

    callback(null, Buffer.from(fileString));
  }
}

module.exports = RegexMatch;
