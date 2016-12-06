System.register("core/console", ["platform/console", "core/prefs"], function (_export) {
  "use strict";

  var console, prefs, isLoggingEnabled, log, error;
  return {
    setters: [function (_platformConsole) {
      console = _platformConsole["default"];
    }, function (_corePrefs) {
      prefs = _corePrefs["default"];
    }],
    execute: function () {
      isLoggingEnabled = prefs.get('showConsoleLogs', false);
      log = undefined;
      error = undefined;

      if (isLoggingEnabled) {
        log = console.log.bind(console, 'CLIQZ');
        error = console.error.bind(console, 'CLIQZ error');
      } else {
        log = function () {};
        error = function () {};
      }

      _export("default", {
        log: log,
        error: error
      });
    }
  };
});