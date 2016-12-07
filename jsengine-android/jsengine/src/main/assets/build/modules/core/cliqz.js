System.register("core/cliqz", ["core/utils", "core/events", "platform/history-manager"], function (_export) {
  "use strict";

  var CliqzUtils, CliqzEvents, utils, events, Promise;
  return {
    setters: [function (_coreUtils) {
      CliqzUtils = _coreUtils["default"];
    }, function (_coreEvents) {
      CliqzEvents = _coreEvents["default"];
    }, function (_platformHistoryManager) {
      _export("historyManager", _platformHistoryManager["default"]);
    }],
    execute: function () {
      utils = CliqzUtils;

      _export("utils", utils);

      events = CliqzEvents;

      _export("events", events);

      Promise = CliqzUtils.Promise;

      _export("Promise", Promise);
    }
  };
});