System.register("core/background", ["core/cliqz", "./utils", "./console", "./language", "./config", "platform/process-script-manager", "./history-manager", "./prefs", "./base/background", "platform/browser", "platform/load-logo-db", "./platform", "core/resource-manager"], function (_export) {
  "use strict";

  var events, Promise, utils, console, language, config, ProcessScriptManager, HistoryManager, prefs, background, Window, mapWindows, loadLogoDb, isMobile, resourceManager, lastRequestId, callbacks;
  return {
    setters: [function (_coreCliqz) {
      events = _coreCliqz.events;
      Promise = _coreCliqz.Promise;
    }, function (_utils) {
      utils = _utils["default"];
    }, function (_console) {
      console = _console["default"];
    }, function (_language) {
      language = _language["default"];
    }, function (_config) {
      config = _config["default"];
    }, function (_platformProcessScriptManager) {
      ProcessScriptManager = _platformProcessScriptManager["default"];
    }, function (_historyManager) {
      HistoryManager = _historyManager["default"];
    }, function (_prefs) {
      prefs = _prefs["default"];
    }, function (_baseBackground) {
      background = _baseBackground["default"];
    }, function (_platformBrowser) {
      Window = _platformBrowser.Window;
      mapWindows = _platformBrowser.mapWindows;
    }, function (_platformLoadLogoDb) {
      loadLogoDb = _platformLoadLogoDb["default"];
    }, function (_platform) {
      isMobile = _platform.isMobile;
    }, function (_coreResourceManager) {
      resourceManager = _coreResourceManager["default"];
    }],
    execute: function () {
      lastRequestId = 0;
      callbacks = {};

      _export("default", background({

        init: function init(settings) {
          if (!isMobile) {
            this.checkSession();
            language.init();
            HistoryManager.init();
          }
          utils.CliqzLanguage = language;
          this.dispatchMessage = this.dispatchMessage.bind(this);

          utils.bindObjectFunctions(this.actions, this);
          loadLogoDb().then(utils.setLogoDb);

          this.mm = new ProcessScriptManager(this.dispatchMessage);
          this.mm.init();

          this.report = utils.setTimeout(this.reportStartupTime.bind(this), 1000 * 60);

          resourceManager.init();
        },

        unload: function unload() {
          utils.clearTimeout(this.report);
          if (!isMobile) {
            language.unload();
            HistoryManager.unload();
          }
          this.mm.unload();
          resourceManager.unload();
        },

        reportStartupTime: function reportStartupTime() {
          var status = this.actions.status();
          utils.telemetry({
            type: 'startup',
            modules: status.modules
          });
        },

        checkSession: function checkSession() {
          if (!prefs.has('session')) {
            var session = [utils.rand(18), utils.rand(6, '0123456789'), '|', utils.getDay(), '|', config.settings.channel || 'NONE'].join('');
            utils.setSupportInfo();
            prefs.set('session', session);
            prefs.set('install_date', session.split('|')[1]);
            prefs.set('new_session', true);
          } else {
            prefs.set('new_session', false);
          }
        },

        dispatchMessage: function dispatchMessage(msg) {
          if (typeof msg.data.requestId === "number") {
            if (msg.data.requestId in callbacks) {
              this.handleResponse(msg);
            }
          } else {
            this.handleRequest(msg);
          }
        },

        handleRequest: function handleRequest(msg) {
          var _this = this;

          var _msg$data$payload = msg.data.payload;
          var action = _msg$data$payload.action;
          var module = _msg$data$payload.module;
          var args = _msg$data$payload.args;
          var requestId = _msg$data$payload.requestId;
          var windowId = msg.data.windowId;
          utils.importModule(module + "/background").then(function (module) {
            var background = module["default"];
            return background.actions[action].apply(null, args);
          }).then(function (response) {
            _this.mm.broadcast("window-" + windowId, {
              response: response,
              action: action,
              module: module,
              requestId: requestId
            });
          })["catch"](console.error.bind(null, "Process Script", modules + "/" + action));
        },

        handleResponse: function handleResponse(msg) {
          callbacks[msg.data.requestId].apply(null, [msg.data.payload]);
        },

        getWindowStatusFromModules: function getWindowStatusFromModules(win) {
          return config.modules.map(function (moduleName) {
            var module = win.CLIQZ.Core.windowModules[moduleName];
            return module && module.status ? module.status() : {};
          });
        },

        events: {
          'prefchange': function onPrefChange() {}
        },

        actions: {
          recordMouseDown: function recordMouseDown() {
            for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
              args[_key] = arguments[_key];
            }

            events.pub.apply(events, ['core:mouse-down'].concat(args));
          },
          restart: function restart() {
            return utils.extensionRestart();
          },
          status: function status() {
            if (!utils.Extension) {
              return {};
            }
            var availableModules = utils.Extension.app.availableModules;
            var modules = config.modules.reduce(function (hash, moduleName) {
              var module = availableModules[moduleName];
              var windowWrappers = mapWindows(function (window) {
                return new Window(window);
              });
              var windows = windowWrappers.reduce(function (hash, win) {
                var windowModule = module.windows[win.id] || {};
                hash[win.id] = {
                  loadingTime: windowModule.loadingTime
                };
                return hash;
              }, Object.create(null));

              hash[moduleName] = {
                name: module.name,
                isEnabled: module.isEnabled,
                loadingTime: module.loadingTime,
                windows: windows
              };
              return hash;
            }, Object.create(null));

            return {
              modules: modules
            };
          },
          broadcastMessage: function broadcastMessage(url, message) {
            this.mm.broadcast("cliqz:core", {
              action: "postMessage",
              url: url,
              args: [JSON.stringify(message)]
            });
          },
          getWindowStatus: function getWindowStatus(win) {
            return Promise.all(this.getWindowStatusFromModules(win)).then(function (allStatus) {
              var result = {};

              allStatus.forEach(function (status, moduleIdx) {
                result[config.modules[moduleIdx]] = status || null;
              });

              return result;
            });
          },
          sendTelemetry: function sendTelemetry(msg) {
            utils.telemetry(msg);
            return Promise.resolve();
          },
          queryCliqz: function queryCliqz(query) {
            var urlBar = utils.getWindow().document.getElementById("urlbar");
            urlBar.focus();
            urlBar.mInputField.focus();
            urlBar.mInputField.setUserInput(query);
          },

          closePopup: function closePopup() {
            var popup = utils.getWindow().CLIQZ.Core.popup;

            popup.hidePopup();
          },

          setUrlbar: function setUrlbar(value) {
            return this.actions.queryCliqz(value);
          },
          recordLang: function recordLang(url, lang) {
            if (lang) {
              language.addLocale(url, lang);
            }
            return Promise.resolve();
          },
          recordMeta: function recordMeta(url, meta) {
            events.pub("core:url-meta", url, meta);
          },
          getFeedbackPage: function getFeedbackPage() {
            return utils.FEEDBACK_URL;
          },
          enableModule: function enableModule(moduleName) {
            return utils.Extension.app.enableModule(moduleName);
          },
          disableModule: function disableModule(moduleName) {
            utils.Extension.app.disableModule(moduleName);
          },
          resizeWindow: function resizeWindow(width, height) {
            utils.getWindow().resizeTo(width, height);
          },
          queryHTML: function queryHTML(url, selector, attribute) {
            var requestId = lastRequestId++,
                documents = [];

            this.mm.broadcast("cliqz:core", {
              action: "queryHTML",
              url: url,
              args: [selector, attribute],
              requestId: requestId
            });

            return new Promise(function (resolve, reject) {
              callbacks[requestId] = function (attributeValues) {
                delete callbacks[requestId];
                resolve(attributeValues);
              };

              utils.setTimeout(function () {
                delete callbacks[requestId];
                reject();
              }, 1000);
            });
          },

          getHTML: function getHTML(url) {
            var timeout = arguments.length <= 1 || arguments[1] === undefined ? 1000 : arguments[1];

            var requestId = lastRequestId++,
                documents = [];

            this.mm.broadcast("cliqz:core", {
              action: "getHTML",
              url: url,
              args: [],
              requestId: requestId
            });

            callbacks[requestId] = function (doc) {
              documents.push(doc);
            };

            return new Promise(function (resolve) {
              utils.setTimeout(function () {
                delete callbacks[requestId];
                resolve(documents);
              }, timeout);
            });
          },

          getCookie: function getCookie(url) {
            var requestId = lastRequestId++,
                documents = [];

            this.mm.broadcast("cliqz:core", {
              action: "getCookie",
              url: url,
              args: [],
              requestId: requestId
            });

            return new Promise(function (resolve, reject) {
              callbacks[requestId] = function (attributeValues) {
                delete callbacks[requestId];
                resolve(attributeValues);
              };

              utils.setTimeout(function () {
                delete callbacks[requestId];
                reject();
              }, 1000);
            });
          }
        }
      }));
    }
  };
});