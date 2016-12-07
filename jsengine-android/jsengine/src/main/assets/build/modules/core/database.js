System.register('core/database', ['platform/database'], function (_export) {
  'use strict';

  var Database;
  return {
    setters: [function (_platformDatabase) {
      Database = _platformDatabase['default'];
    }],
    execute: function () {
      _export('default', Database);
    }
  };
});