System.register('core/browser', ['../platform/browser'], function (_export) {
  'use strict';

  return {
    setters: [function (_platformBrowser) {
      for (var _key in _platformBrowser) {
        if (_key !== 'default') _export(_key, _platformBrowser[_key]);
      }
    }],
    execute: function () {}
  };
});