'use strict';

const FileUtil = require('../utils/file-util.js');
const path = require('path');

const RegexMatch = require('../transforms/regex-match.js');

const help = `
Framework Factory Help
Action: run

Command Structure:
  $ tf run <template> <vars...> [options]

Arguments:
  - template:
    The exact name of the template directory, within the lib/templates folder

  - vars:
    Variables to be injected into the template, Make style
    EX: NAME=some_name DESCRIPTION="some description"

Options:
  -v --verbose {flag} Enable verbose (debug) logging
  --pattern {string}  Regex used to identify variables
                        Default: /{{[A-Z0-9]+}}/g
  --dest {string}     Relative destination of the target folder
                        Default: . (the current directory) 
`;

const exec = async (args) => {
  // The second argument will be the template
  let templateName = args.args[1];

  // Get all the files we need to transfer
  let filePaths = await FileUtil.getTemplateFilePaths(templateName);

  let destDir = process.cwd();
  if (args.opts.dest) {
    destDir = path.join(destDir, args.opts.dest);
  }

  // Copy files
  let promises = filePaths.map((sourcePath) => {
    // Set up the transform function
    let regexMatch = new RegexMatch(args);
    let {transform, flush} = regexMatch;

    // Bind the transform functions to their parent object
    transform = transform.bind(regexMatch);
    flush = flush.bind(regexMatch);

    // Generate the destination path by stripping out everything before and including
    // the template name and appending that to the pre-defined destDir
    let postNameRegex = new RegExp(`.+${templateName}(.+)`);
    let dest = path.join(destDir, sourcePath.match(postNameRegex)[1]);

    return FileUtil.transformCopy(sourcePath, dest, transform, flush);
  });

  await Promise.all(promises);
  console.log('End of program');
};

module.exports.exec = exec;
module.exports.help = help;
