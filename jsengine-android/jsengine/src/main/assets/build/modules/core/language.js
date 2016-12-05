System.register('core/language', ['platform/language'], function (_export) {
  'use strict';

  var Language;
  return {
    setters: [function (_platformLanguage) {
      Language = _platformLanguage['default'];
    }],
    execute: function () {
      _export('default', Language);
    }
  };
});