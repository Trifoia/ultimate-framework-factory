'use strict';

const help = `
Simple Static Framework Help

Command Structure:
  $ tf <action> <args> [options]

Arguments
- action:
  Will run a pre-defined action
  Valid options are: 'run'

- args:
  Arguments that will be passed to given action function

Tips:
- Use the --help (-h) with a action to access its help text
  EX: tf [action] --help
`;

const exec = async () => {
  console.log(help);
};

module.exports.exec = exec;
module.exports.help = help;
