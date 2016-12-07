System.register("core/dom-parser", ["platform/dom-parser"], function (_export) {
  "use strict";

  return {
    setters: [function (_platformDomParser) {
      for (var _key in _platformDomParser) {
        if (_key !== "default") _export(_key, _platformDomParser[_key]);
      }
    }],
    execute: function () {}
  };
});