'use strict';
const path = require('path');
const fs = require('fs');

const ejs = require('ejs');

const EJS_EXTENSION_REGEX = /.ejs$/;

/**
 * Node program is used to process ejs and is highly configurable
 */
(async function() {
  // Get arguments
  const inDir = process.argv[2];
  const outDir = process.argv[3];
  const optsFileName = process.argv[4];

  // Get options
  let ejsOptions;
  try {
    ejsOptions = require(optsFileName);
  } catch (e) {
    console.error('ERROR GETTING EJS OPTIONS');
    console.error(e);
    throw e;
  }

  // Force async
  if (!ejsOptions) console.warn('Async required for operation - enabling');
  ejsOptions.async = true;

  // Get all ejs files in the root of the inDir
  console.log('Getting filenames...\n');
  let ejsFilenames = fs.readdirSync(inDir).filter((file) => EJS_EXTENSION_REGEX.test(file));

  // Get the styling
  let style = fs.readFileSync('./.pre_build/style.css');

  // Render all the files found
  console.log('Rendering EJS..\n');
  let renderPromises = ejsFilenames.map((filename) => {
    return ejs.renderFile(path.join(inDir, filename), {style: style}, ejsOptions);
  });
  let rendered = await Promise.all(renderPromises);

  // Save all the files
  console.log('Writing HTML..\n');
  let writePromises = rendered.map((htmlString, index) => {
    // Alter the ejs filename to an html extension
    let filename = ejsFilenames[index].replace(EJS_EXTENSION_REGEX, '.html');

    return new Promise((resolve, reject) => {
      fs.writeFile(path.join(outDir, filename), htmlString, (err) => {
        if (err) {
          return reject(err);
        }

        resolve(err);
      });
    });
  });
  await Promise.all(writePromises);

  console.log('EJS Rendering Complete!\n');
})();
