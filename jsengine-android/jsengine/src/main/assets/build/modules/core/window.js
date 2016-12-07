System.register("core/window", ["core/utils", "core/events", "core/ab-tests", "core/history-manager", "core/platform"], function (_export) {
  "use strict";

  var utils, events, ABTests, HistoryManager, isMobile, _default;

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  return {
    setters: [function (_coreUtils) {
      utils = _coreUtils["default"];
    }, function (_coreEvents) {
      events = _coreEvents["default"];
    }, function (_coreAbTests) {
      ABTests = _coreAbTests["default"];
    }, function (_coreHistoryManager) {
      HistoryManager = _coreHistoryManager["default"];
    }, function (_corePlatform) {
      isMobile = _corePlatform.isMobile;
    }],
    execute: function () {
      _default = (function () {
        function _default(settings) {
          _classCallCheck(this, _default);

          this.window = settings.window;
          this.actions = {
            addClassToWindow: this.addClassToWindow.bind(this),
            removeClassFromWindow: this.removeClassFromWindow.bind(this)
          };
        }

        _createClass(_default, [{
          key: "init",
          value: function init() {
            // expose globals
            this.window.CliqzUtils = utils;
            this.window.CliqzEvents = events;
            this.window.CliqzHistoryManager = HistoryManager;

            // Do not wait for AB to load
            if (!isMobile) {
              ABTests.check();
            }
          }
        }, {
          key: "unload",
          value: function unload() {
            delete this.window.CliqzUtils;
            delete this.window.CliqzEvents;
            delete this.window.CliqzHistoryManager;
          }
        }, {
          key: "addClassToWindow",
          value: function addClassToWindow() {
            var args = [].slice.call(arguments);
            var mainWindow = this.window.document.getElementById('main-window');
            args.forEach(function (aClass) {
              mainWindow.classList.add(aClass);
            });
          }
        }, {
          key: "removeClassFromWindow",
          value: function removeClassFromWindow() {
            var args = [].slice.call(arguments);
            var mainWindow = this.window.document.getElementById('main-window');
            args.forEach(function (aClass) {
              mainWindow.classList.remove(aClass);
            });
          }
        }]);

        return _default;
      })();

      _export("default", _default);
    }
  };
});