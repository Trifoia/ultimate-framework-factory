'use strict';

const path = require('path');
const FileUtil = require('./file-util.js');
const ROOT_DIR = path.join(path.dirname(require.main.filename), '..');
const TEMPLATE_DIR = path.join(ROOT_DIR, 'src', 'templates');

/**
 * This class processes the raw argv values, extracting options and variables
 *
 * Options are defined as beginning with a '-' or '--' string. If only one dash
 * is used then all of the characters following it will be considered additional
 * single character flags. An any case, set a string option by using the following pattern:
```
  --<option>[=:]<value>
```
 * Variables follow the following pattern:
```
  <var_name>[=:]<value>
```
 */
class Args {
  /**
   * Directory the template folders can be found
   */
  static get TEMPLATE_DIR() {
    return TEMPLATE_DIR;
  }
  get TEMPLATE_DIR() {
    return Args.TEMPLATE_DIR;
  }

  /**
   * Constructor takes an array of arguments
   *
   * @param {string[]} argv Array of args, generally from process.argv
   */
  constructor(argv) {
    // Set up argument parts
    this.args = [];
    this.opts = {};
    this.vars = {};

    argv.forEach((arg, index) => {
      // Special case. Index 0 is the process (node)
      if (index === 0) {
        this.process = arg;
        return;
      }

      // Special case. Index 1 is the script
      if (index === 1) {
        this.script = arg;
        return;
      }

      // Extract single character flags
      let match = arg.match(/^-(?!-)(.+)(?![:=])/);
      if (match) {
        let flags = match[1];
        // Apply all characters as flags
        for (let i=0; i<flags.length; i++) {
          this.opts[flags.charAt(i)] = true;
        }
        return;
      }

      // Extract string options
      match = arg.match(/^--?(.+)[:=](.+)?/);
      if (match) {
        this.opts[match[1]] = match[2] || null;
        return;
      }

      // Extract multi character flags
      match = arg.match(/^--(.+)/);
      if (match) {
        this.opts[match[1]] = true;
        return;
      }

      // Extract Vars
      match = arg.match(/^(.+)[:=](.+)$/);
      if (match) {
        this.vars[match[1]] = match[2];
        return;
      }

      // Anything that remains is an argument
      this.args.push(arg);
    });
  }

  /**
   * Pseudo-Enum describes all valid actions. The 'action' is the first provided
   * argument
   */
  get ACTIONS() {
    return {
      /**
       * Runs the framework factory with a single action
       */
      RUN: 'run',
      /**
       * Displays the help text
       */
      HELP: 'help'
    };
  }

  /**
   * Validates the arguments provided to this class. If any mismatches are found
   * an error will be thrown detailing the issue
   *
   * @return {Promise} Resolves on success, rejects with an error on error
   */
  async validate() {
    // There must be at least one argument (the action)
    if (this.args.length < 1) {
      throw new Error('Invalid Number of Arguments: Must provide at least one argument');
    }

    // Make sure the action is valid
    if (!this.ACTIONS[this.args[0].toUpperCase()]) {
      throw new Error(`Invalid action: "${this.args[0]}"`);
    }

    let action = this.args[0];

    // If the help flag is present we are done
    if (this.opts.h || this.opts.help) return;

    // Validations for the `run` action...
    if (action.toLowerCase() === this.ACTIONS.RUN) {
      // There must be a second argument, the template directory
      if (this.args.length < 2) {
        throw new Error('Invalid number of Arguments: Must provide template directory');
      }

      let validTemplates = await FileUtil.readdir(TEMPLATE_DIR);
      let providedTemplate = this.args[1];
      if (!validTemplates.includes(providedTemplate)) {
        throw new Error(`Invalid template: Could not find template directory for "${providedTemplate}"`);
      }
    }
  }
}

module.exports = Args;
