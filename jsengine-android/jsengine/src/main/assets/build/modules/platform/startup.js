System.register("platform/startup", ["core/app", "core/console"], function (_export) {
  /* global System */
  "use strict";

  var App, console, app;

  _export("startup", startup);

  _export("shutdown", shutdown);

  function startup() {
    console.log("startup");
    app = new App();
    return app.load();
  }

  function shutdown() {
    console.log("shutdown!");
    if (app) {
      app.unload();
    }
  }

  return {
    setters: [function (_coreApp) {
      App = _coreApp["default"];
    }, function (_coreConsole) {
      console = _coreConsole["default"];
    }],
    execute: function () {
      ;
    }
  };
});