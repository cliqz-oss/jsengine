System.register('adblocker/utils', ['core/console'], function (_export) {
  // import CliqzADB from 'adblocker/adblocker';
  'use strict';

  var console;

  _export('log', log);

  function log(msg) {
    var message = '[adblock] ' + msg;
    if (true) {
      console.log('' + message);
    }
  }

  return {
    setters: [function (_coreConsole) {
      console = _coreConsole['default'];
    }],
    execute: function () {}
  };
});