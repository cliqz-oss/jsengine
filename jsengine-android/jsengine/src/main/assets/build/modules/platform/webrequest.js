System.register("platform/webrequest", ["core/cliqz"], function (_export) {

  // webrequests is in global webRequest object
  "use strict";

  var utils;
  return {
    setters: [function (_coreCliqz) {
      utils = _coreCliqz.utils;
    }],
    execute: function () {
      _export("default", webRequest);
    }
  };
});