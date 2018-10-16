'use strict';
const path = require('path');
const fs = require('fs');

const sass = require('node-sass');

const SCSS_EXTENSION_REGEX = /.scss$/;

/**
 * Node program is used to process scss and is highly configurable
 */
(async function() {
  // Get arguments
  const inDir = process.argv[2];
  const outDir = process.argv[3];
  const optsFileName = process.argv[4];

  // Get options
  let scssOptions;
  try {
    scssOptions = require(optsFileName);
  } catch (e) {
    console.error('ERROR GETTING SCSS OPTIONS');
    console.error(e);
    throw e;
  }

  // Get all scss files in the root of the inDir
  console.log('Getting filenames...\n');
  let scssFilenames = fs.readdirSync(inDir).filter((file) => SCSS_EXTENSION_REGEX.test(file));

  // Render all the files found
  console.log('Rendering scss..\n');
  let renderPromises = scssFilenames.map((filename) => {
    let opts = {
      file: path.join(inDir, filename)
    };
    opts = Object.assign(opts, scssOptions);

    return new Promise((resolve, reject) => {
      sass.render(opts, (err, rendered) => {
        if (err) {
          return reject(err);
        }

        return resolve(rendered);
      });
    });
  });
  let rendered = await Promise.all(renderPromises);

  // Save all the files
  console.log('Writing CSS..\n');
  let writePromises = rendered.map((css, index) => {
    // Alter the scss filename to an css extension
    let filename = scssFilenames[index].replace(SCSS_EXTENSION_REGEX, '.css');

    return new Promise((resolve, reject) => {
      fs.writeFile(path.join(outDir, filename), css.css, (err) => {
        if (err) {
          console.log(err);
          return reject(err);
        }

        resolve(err);
      });
    });
  });
  await Promise.all(writePromises);

  console.log('SCSS Rendering Complete!\n');
})();
