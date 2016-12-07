System.register('core/fs', ['core/platform', 'platform/fs'], function (_export) {

  /**
   * Read file from default location.
   *
   * @param {string|Array} path
   * @param {Object} options - {bool} isText: decodes data before returning
   * @returns {Promise}
   */
  'use strict';

  var notImplemented, fs, readFile, writeFile, mkdir, write, renameFile, fileExists, truncateFile, openForAppend, writeFD, closeFD, removeFile, createFile, getFileSize, pathJoin;
  return {
    setters: [function (_corePlatform) {
      notImplemented = _corePlatform.notImplemented;
    }, function (_platformFs) {
      fs = _platformFs;
    }],
    execute: function () {
      readFile = fs.readFile || notImplemented;

      _export('readFile', readFile);

      /**
       * Write to file from default location.
       *
       * @param {string|Array} path
       * @param {data} data - in a format accepted by the platform
       * @param {Object} options - {bool} isText: encodes data before writing
       * @returns {Promise}
       */
      writeFile = fs.writeFile || notImplemented;

      _export('writeFile', writeFile);

      /**
       * Create directory in default location, does not fail if directory exists.
       *
       * @param {string|Array} path
       * @returns {Promise}
       */
      mkdir = fs.mkdir || notImplemented;

      _export('mkdir', mkdir);

      /**
       * Similar to writeFile, but this one does not do atomic write. Always truncates file.
       *
       * @param {string|Array} path
       * @param {data} data - in a format accepted by the platform
       * @param {Object} options - {bool} isText: encodes data before writing
       * @returns {Promise}
       */
      write = fs.write || notImplemented;

      _export('write', write);

      /**
       * Renames old path to new path.
       *
       * @param {string|Array} oldPath
       * @param {string|Array} newPath
       * @returns {Promise}
       */
      renameFile = fs.renameFile || notImplemented;

      _export('renameFile', renameFile);

      /**
       * Returns whether it exists a file with given path or not.
       *
       * @param {string|Array} path
       * @returns {Promise}
       */
      fileExists = fs.fileExists || notImplemented;

      _export('fileExists', fileExists);

      /**
       * Truncates file with given path.
       *
       * @param {string|Array} path
       * @returns {Promise}
       */
      truncateFile = fs.truncateFile || notImplemented;

      _export('truncateFile', truncateFile);

      /**
       * Opens file with given file (creating if does not exist) and return
       * file object to be used in writeFD and closeFD functions.
       *
       * @param {string|Array} path
       * @returns {Promise}
       */
      openForAppend = fs.openForAppend || notImplemented;

      _export('openForAppend', openForAppend);

      /**
       * Writes to given open file.
       *
       * @param {Object} openFile
       * @param {data} data - in a format accepted by the platform
       * @param {Object} options - {bool} isText: encodes data before writing
       * @returns {Promise}
       */
      writeFD = fs.writeFD || notImplemented;

      _export('writeFD', writeFD);

      /**
       * Closes given open file.
       *
       * @param {Object} openFile
       * @returns {Promise}
       */
      closeFD = fs.closeFD || notImplemented;

      _export('closeFD', closeFD);

      /**
       * Removes file with given path, does not fail if file does not exist.
       *
       * @param {string|Array} path
       * @returns {Promise}
       */
      removeFile = fs.removeFile || notImplemented;

      _export('removeFile', removeFile);

      /**
       * Creates empty file with given path.
       *
       * @param {string|Array} path
       * @returns {Promise}
       */
      createFile = fs.createFile || notImplemented;

      _export('createFile', createFile);

      /**
       * Returns file size.
       *
       * @param {string|Array} path
       * @returns {Promise}
       */
      getFileSize = fs.getFileSize || notImplemented;

      _export('getFileSize', getFileSize);

      /**
       * Joins the given path components.
       *
       * @param {Array} paths
       * @returns {Promise}
       */
      pathJoin = fs.pathJoin || notImplemented;

      _export('pathJoin', pathJoin);
    }
  };
});