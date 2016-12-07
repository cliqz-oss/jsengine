System.register("platform/startup", ["core/app", "core/console"], function (_export) {
  /* global System */
  "use strict";

  var App, console;
  return {
    setters: [function (_coreApp) {
      App = _coreApp["default"];
    }, function (_coreConsole) {
      console = _coreConsole["default"];
    }],
    execute: function () {
      _export("default", function () {
        console.log("startup");
        var app = new App();
        return app.load();
      });

      ;
    }
  };
});