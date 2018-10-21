'use strict';

const fs = require('fs');
const path = require('path');

const {Transform} = require('stream');

const ROOT_DIR = path.join(path.dirname(require.main.filename), '..');
const TEXT_EXTENSIONS = require('./text-extensions/text-extensions.json');

/**
 * Directory the template folders can be found
 */
const TEMPLATE_DIR = path.join(ROOT_DIR, 'src', 'templates');

/**
 * Files extension names that are explicitly not transformed ever
 */
const TRANSFORM_BLACKLIST = [
  'git'
];

/**
 * Pseudo-Static class asynchronously wraps useful file system functions
 */
class FileUtil {
  /**
   * Retrieves all valid template directory names
   *
   * @return {Promise} Resolves with an array of template names
   */
  static async getTemplateNames() {
    return this.readdir(TEMPLATE_DIR);
  }

  /**
   * Simplified async wrapper for the fs.readdir method
   *
   * @param {string} dir Directory to read
   * @param {boolean} withFileTypes If file types should be provided
   *
   * @return {Promise} Resolves with either an array of strings, or fs.Dirent objects
   */
  static async readdir(dir, withFileTypes = false) {
    return new Promise((resolve, reject) => {
      fs.readdir(dir, {withFileTypes}, (err, files) => {
        if (err) return reject(err);
        return resolve(files);
      });
    });
  }

  /**
   * Retrieves all file paths within a given template
   *
   * @param {string} templateName Name of the template to use
   *
   * @return {Promise} Resolves will an array of template file paths
   */
  static async getTemplateFilePaths(templateName) {
    // Get an array of "dirent" objects for the root template directory
    let basePath = path.join(TEMPLATE_DIR, templateName);
    let files = await this.readdir(basePath, true);

    /**
     * Internal helper function checks if any of the dirent elements in a given
     * array are directories
     *
     * @param {fs.Dirent[]} dirents Array of dirents taken from this.readdir
     *
     * @return {boolean} If the provided array contains any directories
     */
    let containsDir = (dirents) => {
      return dirents.some((dirent) => {
        return dirent.isDirectory();
      });
    };

    // Translate all directories into the containing files
    while (containsDir(files)) {
      for (let i=0; i<files.length; i++) {
        let file = files[i];
        if (file.isDirectory()) {
          let subFiles = await FileUtil.readdir(path.join(basePath, file.name), true);
          subFiles = subFiles.map((subFile) => {
            // Add the directory of the subFile to each file we found
            subFile.name = path.join(file.name, subFile.name);
            return subFile;
          });

          // Remove the old directory and add the directory files
          files.splice(i--, 1);
          files = files.concat(subFiles);
        }
      }
    }

    // Convert all dirent objects to full file paths and return
    return files.map((fileData) => {
      return path.join(basePath, fileData.name);
    });
  }

  /**
   * Simple async wrapper for fs.mkdir
   *
   * @param {string} path Directory path to make
   *
   * @return {Promise} Resolves on success, rejects on failure
   */
  static async makeDirectory(path) {
    return new Promise((resolve, reject) => {
      fs.mkdir(path, (err, res) => {
        if (err) return reject(err);
        resolve(res);
      });
    });
  }

  /**
   * Will copy a file from one location to another, using provided "transform"
   * and "flush" functions.
   *
   * Notes:
   * - Only files with extensions in the `text-extensions.js` file will be subjected
   *   to the transform and flush functions
   * - If using both the transform and flush functions, use classic function declarations
   *   (non-arrow functions) for access to a shared `this`.
   *   - Alternatively, these function can be manually bound to a common object for
   *     greater control
   *
   * Documentation on the use of these transformation functions can be found here:
   * https://nodejs.org/api/stream.html#stream_implementing_a_transform_stream
   *
   * @param {string} source File path of the source file
   * @param {string} dest File path of the destination file
   * @param {function(Buffer, string, Function)} transform Function to use for transformation
   * @param {function(Function)} flush Function to use at the very end of transformation
   */
  static async transformCopy(source, dest, transform, flush) {
    return new Promise(async (resolve, reject) => {
      // Make sure the directory exists
      await FileUtil.makeDir(path.dirname(dest));
      if (TRANSFORM_BLACKLIST.includes(FileUtil.getExtname(source))) {
        // This file is on the blacklist
        console.group();
        console.log(`${source} [Skipped Copy]`);
        console.groupEnd();
        resolve(null);
        return;
      };

      if (!TEXT_EXTENSIONS.includes(FileUtil.getExtname(source))) {
        // If the source is not text, just do a regular fs.copy
        console.group();
        console.log(`${source} [Skipped Transform]`);
        console.groupEnd();

        fs.copyFile(source, dest, (err, res) => {
          if (err) return reject(err);
          resolve(res);
        });
        return;
      }

      // Log the destination
      console.log(dest);

      const trans = new Transform({transform, flush});

      const read = fs.createReadStream(source);
      const write = fs.createWriteStream(dest);

      read.pipe(trans);
      trans.pipe(write);

      write.on('error', (err) => {
        reject(err);
      });

      write.on('close', () => {
        resolve();
      });
    });
  }

  /**
   * Async wrapper for fs.mkdir that is recursive by default. If the file already
   * exists than that will be counted as success
   *
   * @param {string} dirPath Path of the directory to create
   *
   * @return {Promise} Resolves on success
   */
  static async makeDir(dirPath) {
    let opts = {
      recursive: true
    };
    return new Promise(async (resolve, reject) => {
      fs.mkdir(dirPath, opts, async (err) => {
        if (err) {
          // Check for the specific "File already exists" error
          if (err.code === 'EEXIST') return resolve();

          // The recursive nature of fs.mkdir doesn't go far enough. If we get a
          // "no such file or directory" error then make the parent directory and try again,
          // this will naturally recurses as much as necessary
          if (err.code === 'ENOENT') {
            await FileUtil.makeDir(path.dirname(dirPath));
            await FileUtil.makeDir(dirPath);
            return resolve();
          }

          return reject(err);
        }
        resolve();
      });
    });
  }

  /**
   * Gets the extension of a file, casting a wider net than the native path.extname
   * function. If path.extname fails to find an extension, the full base name will
   * be returned (minus any preceding dots);
   *
   * @param {string} filePath File path to find the extension of
   *
   * @return {string} File extension name
   */
  static getExtname(filePath) {
    let ext = path.extname(filePath);

    if (!ext) {
      // If there is no extension, return the full file name
      ext = path.basename(filePath);
    }

    // Remove any preceding dots
    ext = ext.match(/\.?(.+)/)[1];
    return ext;
  }
}

module.exports = FileUtil;
