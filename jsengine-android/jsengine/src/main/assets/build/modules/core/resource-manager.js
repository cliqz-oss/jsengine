System.register("core/resource-manager", [], function (_export) {
  "use strict";

  var ResourceManager, manager;

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  return {
    setters: [],
    execute: function () {
      ResourceManager = (function () {
        function ResourceManager() {
          _classCallCheck(this, ResourceManager);

          this.loaders = [];
          this.initialised = false;
        }

        _createClass(ResourceManager, [{
          key: "init",
          value: function init() {
            var _this = this;

            var loadPromises = this.loaders.map(function (e) {
              return _this._startLoader(e.loader, e.callback);
            });
            this.initialised = true;
            return loadPromises;
          }
        }, {
          key: "unload",
          value: function unload() {
            this.loaders.forEach(function (e) {
              e.loader.stop();
            });
            this.initialised = false;
          }
        }, {
          key: "addResourceLoader",
          value: function addResourceLoader(resourceLoader, callback) {
            this.loaders.push({
              loader: resourceLoader,
              callback: callback
            });
            if (this.initialised) {
              // extension is already running, we can load this resource straight away
              this._startLoader(resourceLoader, callback);
            }
          }
        }, {
          key: "_startLoader",
          value: function _startLoader(resourceLoader, callback) {
            resourceLoader.onUpdate(callback);
            return resourceLoader.load().then(callback);
          }
        }]);

        return ResourceManager;
      })();

      manager = new ResourceManager();

      _export("default", manager);
    }
  };
});