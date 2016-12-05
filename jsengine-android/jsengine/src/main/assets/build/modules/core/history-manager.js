System.register('core/history-manager', ['platform/history-manager'], function (_export) {
  'use strict';

  var HistoryManager;
  return {
    setters: [function (_platformHistoryManager) {
      HistoryManager = _platformHistoryManager['default'];
    }],
    execute: function () {
      _export('default', HistoryManager);
    }
  };
});