System.register('adblocker/utils', ['adblocker/adblocker'], function (_export) {
  'use strict';

  var CliqzADB;

  _export('default', log);

  function log(msg) {
    var message = '[adblock] ' + msg;
    if (CliqzADB.adbDebug) {
      dump(message + '\n');
    }
  }

  return {
    setters: [function (_adblockerAdblocker) {
      CliqzADB = _adblockerAdblocker['default'];
    }],
    execute: function () {}
  };
});