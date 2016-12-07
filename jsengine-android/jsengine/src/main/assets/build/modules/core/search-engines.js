System.register("core/search-engines", ["platform/search-engines"], function (_export) {
  "use strict";

  return {
    setters: [function (_platformSearchEngines) {
      for (var _key in _platformSearchEngines) {
        if (_key !== "default") _export(_key, _platformSearchEngines[_key]);
      }
    }],
    execute: function () {}
  };
});