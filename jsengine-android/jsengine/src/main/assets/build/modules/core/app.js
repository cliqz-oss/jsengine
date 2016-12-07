System.register('core/app', ['system', './config', './console', './events', './prefs', '../platform/browser'], function (_export) {
  'use strict';

  var System, config, console, subscribe, prefs, Window, mapWindows, forEachWindow, _default, Module;

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

  function shouldEnableModule(name) {
    var pref = 'modules.' + name + '.enabled';
    return !prefs.has(pref) || prefs.get(pref) === true;
  }

  return {
    setters: [function (_system) {
      System = _system['default'];
    }, function (_config) {
      config = _config['default'];
    }, function (_console) {
      console = _console['default'];
    }, function (_events) {
      subscribe = _events.subscribe;
    }, function (_prefs) {
      prefs = _prefs['default'];
    }, function (_platformBrowser) {
      Window = _platformBrowser.Window;
      mapWindows = _platformBrowser.mapWindows;
      forEachWindow = _platformBrowser.forEachWindow;
    }],
    execute: function () {
      _default = (function () {
        function _default() {
          _classCallCheck(this, _default);

          this.availableModules = config.modules.reduce(function (hash, moduleName) {
            hash[moduleName] = new Module(moduleName);
            return hash;
          }, Object.create(null));
        }

        _createClass(_default, [{
          key: 'modules',
          value: function modules() {
            var _this = this;

            return Object.keys(this.availableModules).map(function (moduleName) {
              return _this.availableModules[moduleName];
            });
          }
        }, {
          key: 'enabledModules',
          value: function enabledModules() {
            return this.modules().filter(function (module) {
              return module.isEnabled;
            });
          }
        }, {
          key: 'setDefaultPrefs',
          value: function setDefaultPrefs() {
            if ('default_prefs' in config) {
              Object.keys(config.default_prefs).forEach(function (pref) {
                if (!prefs.has(pref)) {
                  console.log('App', 'set up preference', '"' + pref + '"');
                  prefs.set(pref, config.default_prefs[pref]);
                }
              });
            }
          }
        }, {
          key: 'load',
          value: function load() {
            console.log('App', 'Set up default parameters for new modules');
            this.setDefaultPrefs();
            console.log('App', 'Loading modules started');
            var backgroundPromises = this.modules().map(function (module) {
              if (shouldEnableModule(module.name)) {
                try {
                  return module.enable()['catch'](function (e) {
                    return console.error('App', 'Error on loading module:', module.name, e);
                  });
                } catch (e) {
                  console.error('App module:', '"' + module.name + '"', ' -- something went wrong', e);
                  return Promise.resolve();
                }
              } else {
                // TODO: should not be here
                return System['import'](module.name + '/background');
              }
            });

            this.prefchangeEventListener = subscribe('prefchange', this.onPrefChange, this);

            return Promise.all(backgroundPromises).then(function () {
              console.log('App', 'Loading modules -- all background loaded');
            })['catch'](function (e) {
              console.error('App', 'Loading modules failed', e);
            });
          }
        }, {
          key: 'unload',
          value: function unload() {
            var _ref = arguments.length <= 0 || arguments[0] === undefined ? { quick: false } : arguments[0];

            var quick = _ref.quick;

            this.prefchangeEventListener.unsubscribe();

            console.log('App', 'unload background modules');
            this.enabledModules().reverse().forEach(function (module) {
              try {
                console.log('App', 'unload background module: ', module.name);
                module.disable({ quick: quick });
              } catch (e) {
                console.error('Error unloading module: ' + module.name, e);
              }
            });
            console.log('App', 'unload background modules finished');
          }
        }, {
          key: 'loadWindow',
          value: function loadWindow(window) {
            var CLIQZ = {
              System: System,
              Core: {
                windowModules: {}
              } };

            // TODO: remove CLIQZ from window
            // TODO: remove and all clients
            Object.defineProperty(window, 'CLIQZ', {
              configurable: true,
              value: CLIQZ
            });

            var windowModulePromises = this.enabledModules().map(function (module) {
              console.log('App window', 'loading module', '"' + module.name + '"', 'started');
              return module.loadWindow(window)['catch'](function (e) {
                console.error('App window', 'Error loading module: ' + module.name, e);
              });
            });

            return Promise.all(windowModulePromises).then(function () {
              console.log('App', 'Window loaded');
            });
          }
        }, {
          key: 'unloadWindow',
          value: function unloadWindow(window) {
            console.log('App window', 'unload window modules');
            this.enabledModules().reverse().forEach(function (module) {
              try {
                module.unloadWindow(window);
              } catch (e) {
                console.error('App window', 'error on unload module ' + module.name, e);
              }
            });
            /* eslint-disable */
            delete window.CLIQZ;
            /* eslint-enable */
          }
        }, {
          key: 'onPrefChange',
          value: function onPrefChange(pref) {
            if (!pref.startsWith('modules.')) {
              return;
            }

            var prefParts = pref.split('.');
            if (prefParts.pop() !== 'enabled') {
              return;
            }

            var isEnabled = prefs.get(pref) === true;
            var moduleName = prefParts.pop();
            var module = this.availableModules[moduleName];

            if (!module) {
              // pref for non-existing module - just ignore
              return;
            }

            if (isEnabled === true && !module.isEnabled) {
              this.enableModule(module.name);
            } else if (isEnabled === false && module.isEnabled) {
              this.disableModule(module.name);
            } else {
              // prefchange tends to fire with no change - just ignore
            }
          }

          // use in runtime not startup
        }, {
          key: 'enableModule',
          value: function enableModule(moduleName) {
            var module = this.availableModules[moduleName];

            if (module.isEnabled) {
              return Promise.resolve();
            }

            return module.enable().then(function () {
              return Promise.all(mapWindows(module.loadWindow.bind(module))).then(function () {
                prefs.set('modules.' + moduleName + '.enabled', true);
              });
            });
          }

          // use in runtime not startup
        }, {
          key: 'disableModule',
          value: function disableModule(moduleName) {
            var module = this.availableModules[moduleName];

            if (!module.isEnabled) {
              return Promise.resolve();
            }

            forEachWindow(module.unloadWindow.bind(module));
            module.disable();
            prefs.set('modules.' + moduleName + '.enabled', false);
          }
        }]);

        return _default;
      })();

      _export('default', _default);

      Module = (function () {
        function Module(name) {
          _classCallCheck(this, Module);

          this.name = name;
          this.isEnabled = false;
          this.loadingTime = null;
          this.windows = Object.create(null);
        }

        _createClass(Module, [{
          key: 'enable',
          value: function enable() {
            var _this2 = this;

            console.log('Module', this.name, 'start loading');
            var loadingStartedAt = Date.now();
            if (this.isEnabled) {
              throw new Error('Module already enabled');
            }
            return System['import'](this.name + '/background').then(function (_ref2) {
              var background = _ref2['default'];
              return background.init(config.settings);
            }).then(function () {
              _this2.isEnabled = true;
              _this2.loadingTime = Date.now() - loadingStartedAt;
              console.log('Module: ', _this2.name, ' -- Background loaded');
            });
          }
        }, {
          key: 'disable',
          value: function disable() {
            var _ref3 = arguments.length <= 0 || arguments[0] === undefined ? { quick: false } : arguments[0];

            var quick = _ref3.quick;

            console.log('Module', this.name, 'start unloading');
            var background = System.get(this.name + '/background')['default'];

            if (quick) {
              // background does not need to have beforeBrowserShutdown defined
              var quickShutdown = background.beforeBrowserShutdown || function beforeBrowserShutdown() {};
              quickShutdown.call(background);
            } else {
              background.unload();
              this.isEnabled = false;
              this.loadingTime = null;
            }
            console.log('Module', this.name, 'unloading finished');
          }

          /**
           * return window module
           */
        }, {
          key: 'loadWindow',
          value: function loadWindow(window) {
            var _this3 = this;

            console.log('Module window:', '"' + this.name + '"', 'loading');
            var loadingStartedAt = Date.now();
            return System['import'](this.name + '/window').then(function (_ref4) {
              var WindowModule = _ref4['default'];
              return new WindowModule({
                settings: config.settings,
                window: window
              });
            }).then(function (module) {
              return Promise.resolve(module.init()).then(function () {
                return module;
              });
            }).then(function (windowModule) {
              var win = new Window(window);
              _this3.windows[win.id] = {
                loadingTime: Date.now() - loadingStartedAt
              };
              console.log('Module window:', '"' + _this3.name + '"', 'loading finished');
              window.CLIQZ.Core.windowModules[_this3.name] = windowModule;
            });
          }
        }, {
          key: 'unloadWindow',
          value: function unloadWindow(window) {
            var win = new Window(window);
            console.log('Module window', '"' + this.name + '"', 'unloading');
            window.CLIQZ.Core.windowModules[this.name].unload();
            delete window.CLIQZ.Core.windowModules[this.name];
            delete this.windows[win.id];
            console.log('Module window', '"' + this.name + '"', 'unloading finished');
          }
        }, {
          key: 'status',
          value: function status() {
            return {
              isEnabled: this.isEnabled
            };
          }
        }]);

        return Module;
      })();
    }
  };
});