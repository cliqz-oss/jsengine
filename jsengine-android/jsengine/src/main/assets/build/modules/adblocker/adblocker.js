System.register('adblocker/adblocker', ['core/cliqz', 'core/webrequest', 'antitracking/url', 'antitracking/domain', 'platform/browser', 'antitracking/persistent-state', 'antitracking/fixed-size-cache', 'antitracking/webrequest-context', 'adblocker/utils', 'adblocker/filters-engine', 'adblocker/filters-loader', 'adblocker/adb-stats', 'core/resource-loader'], function (_export) {

  // import CliqzHumanWeb from 'human-web/human-web';
  'use strict';

  var utils, events, WebRequest, URLInfo, getGeneralDomain, browser, LazyPersistentObject, LRUCache, HttpRequestContext, log, FilterEngine, serializeFiltersEngine, deserializeFiltersEngine, FiltersLoader, AdbStats, Resource, CliqzUtils, SERIALIZED_ENGINE_PATH, ADB_VER, ADB_PREF, ADB_PREF_OPTIMIZED, ADB_ABTEST_PREF, ADB_PREF_VALUES, ADB_DEFAULT_VALUE, AdBlocker, CliqzADB;

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  _export('autoBlockAds', autoBlockAds);

  _export('adbABTestEnabled', adbABTestEnabled);

  /* Wraps filter-based adblocking in a class. It has to handle both
   * the management of lists (fetching, updating) using a FiltersLoader
   * and the matching using a FilterEngine.
   */

  _export('adbEnabled', adbEnabled);

  function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

  function autoBlockAds() {
    return true;
  }

  function adbABTestEnabled() {
    return CliqzUtils.getPref(ADB_ABTEST_PREF, false);
  }

  function adbEnabled() {
    // TODO: Deal with 'optimized' mode.
    // 0 = Disabled
    // 1 = Enabled
    return adbABTestEnabled() && CliqzUtils.getPref(ADB_PREF, ADB_PREF_VALUES.Disabled) !== 0;
  }

  return {
    setters: [function (_coreCliqz) {
      utils = _coreCliqz.utils;
      events = _coreCliqz.events;
    }, function (_coreWebrequest) {
      WebRequest = _coreWebrequest['default'];
    }, function (_antitrackingUrl) {
      URLInfo = _antitrackingUrl.URLInfo;
    }, function (_antitrackingDomain) {
      getGeneralDomain = _antitrackingDomain.getGeneralDomain;
    }, function (_platformBrowser) {
      browser = _platformBrowser;
    }, function (_antitrackingPersistentState) {
      LazyPersistentObject = _antitrackingPersistentState.LazyPersistentObject;
    }, function (_antitrackingFixedSizeCache) {
      LRUCache = _antitrackingFixedSizeCache['default'];
    }, function (_antitrackingWebrequestContext) {
      HttpRequestContext = _antitrackingWebrequestContext['default'];
    }, function (_adblockerUtils) {
      log = _adblockerUtils.log;
    }, function (_adblockerFiltersEngine) {
      FilterEngine = _adblockerFiltersEngine['default'];
      serializeFiltersEngine = _adblockerFiltersEngine.serializeFiltersEngine;
      deserializeFiltersEngine = _adblockerFiltersEngine.deserializeFiltersEngine;
    }, function (_adblockerFiltersLoader) {
      FiltersLoader = _adblockerFiltersLoader['default'];
    }, function (_adblockerAdbStats) {
      AdbStats = _adblockerAdbStats['default'];
    }, function (_coreResourceLoader) {
      Resource = _coreResourceLoader.Resource;
    }],
    execute: function () {
      CliqzUtils = utils;

      // Disk persisting
      SERIALIZED_ENGINE_PATH = ['antitracking', 'adblocking', 'engine.json'];

      // adb version
      ADB_VER = 0.01;

      _export('ADB_VER', ADB_VER);

      // Preferences
      ADB_PREF = 'cliqz-adb';

      _export('ADB_PREF', ADB_PREF);

      ADB_PREF_OPTIMIZED = 'cliqz-adb-optimized';

      _export('ADB_PREF_OPTIMIZED', ADB_PREF_OPTIMIZED);

      ADB_ABTEST_PREF = 'cliqz-adb-abtest';

      _export('ADB_ABTEST_PREF', ADB_ABTEST_PREF);

      ADB_PREF_VALUES = {
        Enabled: 1,
        Disabled: 0
      };

      _export('ADB_PREF_VALUES', ADB_PREF_VALUES);

      ADB_DEFAULT_VALUE = ADB_PREF_VALUES.Disabled;

      _export('ADB_DEFAULT_VALUE', ADB_DEFAULT_VALUE);

      AdBlocker = (function () {
        function AdBlocker() {
          var _this = this;

          _classCallCheck(this, AdBlocker);

          this.logs = [];
          this.engine = new FilterEngine();

          // Plug filters lists manager with engine to update it
          // whenever a new version of the rules is available.
          this.listsManager = new FiltersLoader();
          this.listsManager.onUpdate(function (updates) {
            // -------------------- //
            // Update fitlers lists //
            // -------------------- //
            var filtersLists = updates.filter(function (update) {
              var asset = update.asset;
              var checksum = update.checksum;
              var isFiltersList = update.isFiltersList;

              if (isFiltersList && !_this.engine.hasList(asset, checksum)) {
                _this.log('Filters list ' + asset + ' (' + checksum + ') will be updated');
                return true;
              }
              return false;
            });

            if (filtersLists.length > 0) {
              var startFiltersUpdate = Date.now();
              _this.engine.onUpdateFilters(filtersLists);
              _this.log('Engine updated with ' + filtersLists.length + ' lists' + (' (' + (Date.now() - startFiltersUpdate) + ' ms)'));
            }

            // ---------------------- //
            // Update resources lists //
            // ---------------------- //
            var resourcesLists = updates.filter(function (update) {
              var isFiltersList = update.isFiltersList;
              var asset = update.asset;
              var checksum = update.checksum;

              if (!isFiltersList && _this.engine.resourceChecksum !== checksum) {
                _this.log('Resources list ' + asset + ' (' + checksum + ') will be updated');
                return true;
              }
              return false;
            });

            if (resourcesLists.length > 0) {
              var startResourcesUpdate = Date.now();
              _this.engine.onUpdateResource(resourcesLists);
              _this.log('Engine updated with ' + resourcesLists.length + ' resources' + (' (' + (Date.now() - startResourcesUpdate) + ' ms)'));
            }

            // Flush the cache since the engine is now different
            _this.initCache();

            // Serialize new version of the engine on disk if needed
            if (_this.engine.updated) {
              (function () {
                var t0 = Date.now();
                new Resource(SERIALIZED_ENGINE_PATH).persist(JSON.stringify(serializeFiltersEngine(_this.engine))).then(function () {
                  var totalTime = Date.now() - t0;
                  _this.log('Serialized filters engine on disk (' + totalTime + ' ms)');
                  _this.engine.updated = false;
                });
              })();
            } else {
              _this.log('Engine has not been updated, do not serialize');
            }
          });

          // Blacklists to disable adblocking on certain domains/urls
          this.blacklist = new Set();
          this.blacklistPersist = new LazyPersistentObject('adb-blacklist');

          // Is the adblocker initialized
          this.initialized = false;
        }

        _createClass(AdBlocker, [{
          key: 'log',
          value: function log(msg) {
            this.logs.push(msg);
            CliqzUtils.log(msg, 'adblocker');
          }
        }, {
          key: 'initCache',
          value: function initCache() {
            // To make sure we don't break any filter behavior, each key in the LRU
            // cache is made up of { source general domain } + { url }.
            // This is because some filters will behave differently based on the
            // domain of the source.

            // Cache queries to FilterEngine
            this.cache = new LRUCache(this.engine.match.bind(this.engine), // Compute result
            1000, // Maximum number of entries
            function (request) {
              return request.sourceGD + request.url;
            } // Select key
            );
          }
        }, {
          key: 'init',
          value: function init() {
            var _this2 = this;

            this.initCache();

            // Load serialized engine from disk, then init filters manager
            new Resource(SERIALIZED_ENGINE_PATH).load().then(function (serializedEngine) {
              if (serializedEngine !== undefined) {
                try {
                  var t0 = Date.now();
                  deserializeFiltersEngine(_this2.engine, serializedEngine);
                  var totalTime = Date.now() - t0;
                  _this2.log('Loaded filters engine from disk (' + totalTime + ' ms)');
                } catch (e) {
                  // In case there is a mismatch between the version of the code
                  // and the serialization format of the engine on disk, we might
                  // not be able to load the engine from disk. Then we just start
                  // fresh!
                  _this2.engine = new FilterEngine();
                  _this2.log('Exception while loading engine from disk ' + e + ' ' + e.stack);
                }
              } else {
                _this2.log('No filter engine was serialized on disk');
              }

              // Load files from disk, then check if we should update
              _this2.listsManager.load().then(function () {
                // Update check should be performed after a short while
                CliqzUtils.log('Check for updates', 'adblocker');
                setTimeout(function () {
                  return _this2.listsManager.update();
                }, 30 * 1000);
              });
            });

            this.blacklistPersist.load().then(function (value) {
              // Set value
              if (value.urls !== undefined) {
                _this2.blacklist = new Set(value.urls);
              }
            });
            this.initialized = true;
          }
        }, {
          key: 'unload',
          value: function unload() {
            this.listsManager.stop();
          }
        }, {
          key: 'persistBlacklist',
          value: function persistBlacklist() {
            this.blacklistPersist.setValue({ urls: [].concat(_toConsumableArray(this.blacklist.values())) });
          }
        }, {
          key: 'addToBlacklist',
          value: function addToBlacklist(url) {
            this.blacklist.add(url);
            this.persistBlacklist();
          }
        }, {
          key: 'removeFromBlacklist',
          value: function removeFromBlacklist(url) {
            this.blacklist['delete'](url);
            this.persistBlacklist();
          }
        }, {
          key: 'isInBlacklist',
          value: function isInBlacklist(request) {
            return this.blacklist.has(request.sourceURL) || this.blacklist.has(request.sourceGD);
          }
        }, {
          key: 'isDomainInBlacklist',
          value: function isDomainInBlacklist(url) {
            // Should all this domain stuff be extracted into a function?
            // Why is CliqzUtils.detDetailsFromUrl not used?
            if (!utils.isUrl(url)) {
              return false;
            }
            var urlParts = URLInfo.get(url);
            var hostname = urlParts.hostname || url;
            if (hostname.startsWith('www.')) {
              hostname = hostname.substring(4);
            }

            return this.blacklist.has(hostname);
          }
        }, {
          key: 'isUrlInBlacklist',
          value: function isUrlInBlacklist(url) {
            return this.blacklist.has(url);
          }
        }, {
          key: 'logActionHW',
          value: function logActionHW(url, action, domain) {
            var type = 'url';
            if (domain) {
              type = 'domain';
            }
            if (!CliqzHumanWeb.state.v[url].adblocker_blacklist) {
              CliqzHumanWeb.state.v[url].adblocker_blacklist = {};
            }
            CliqzHumanWeb.state.v[url].adblocker_blacklist[action] = type;
          }
        }, {
          key: 'toggleUrl',
          value: function toggleUrl(url, domain) {
            var processedURL = url;
            if (domain) {
              // Should all this domain stuff be extracted into a function?
              // Why is CliqzUtils.getDetailsFromUrl not used?
              if (utils.isUrl(processedURL)) {
                processedURL = URLInfo.get(url).hostname;
              }
              if (processedURL.startsWith('www.')) {
                processedURL = processedURL.substring(4);
              }
            }

            var existHW = CliqzHumanWeb && CliqzHumanWeb.state.v[url];
            if (this.blacklist.has(processedURL)) {
              this.blacklist['delete'](processedURL);
              // TODO: It's better to have an API from humanweb to indicate if a url is private
              if (existHW) {
                this.logActionHW(url, 'remove', domain);
              }
            } else {
              this.blacklist.add(processedURL);
              if (existHW) {
                this.logActionHW(url, 'add', domain);
              }
            }

            this.persistBlacklist();
          }

          /* @param {webrequest-context} httpContext - Context of the request
           */
        }, {
          key: 'match',
          value: function match(httpContext) {
            // Check if the adblocker is initialized
            if (!this.initialized) {
              return false;
            }

            if (httpContext.isFullPage()) {
              // allow loading document
              return false;
            }
            // Process endpoint URL
            var url = httpContext.url.toLowerCase();
            var urlParts = URLInfo.get(url);
            var hostname = urlParts.hostname;
            if (hostname.startsWith('www.')) {
              hostname = hostname.substring(4);
            }
            var hostGD = getGeneralDomain(hostname);

            // Process source url
            var sourceURL = httpContext.getSourceURL().toLowerCase();
            var sourceParts = URLInfo.get(sourceURL);

            // It can happen when source is not a valid URL, then we simply
            // leave `sourceHostname` and `sourceGD` as undefined to allow
            // some filter matching on the request URL itself.
            var sourceHostname = sourceParts.hostname;
            var sourceGD = undefined;
            if (sourceHostname !== undefined) {
              if (sourceHostname.startsWith('www.')) {
                sourceHostname = sourceHostname.substring(4);
              }
              sourceGD = getGeneralDomain(sourceHostname);
            }

            // Wrap informations needed to match the request
            var request = {
              // Request
              url: url,
              cpt: httpContext.getContentPolicyType(),
              // Source
              sourceURL: sourceURL,
              sourceHostname: sourceHostname,
              sourceGD: sourceGD,
              // Endpoint
              hostname: hostname,
              hostGD: hostGD
            };

            var t0 = Date.now();
            var isAd = this.isInBlacklist(request) ? { match: false } : this.cache.get(request);
            var totalTime = Date.now() - t0;

            log('BLOCK AD ' + JSON.stringify({
              timeAdFilter: totalTime,
              isAdFilter: isAd,
              context: {
                url: httpContext.url,
                source: httpContext.getSourceURL(),
                cpt: httpContext.getContentPolicyType(),
                method: httpContext.method
              }
            }));

            return isAd;
          }
        }]);

        return AdBlocker;
      })();

      CliqzADB = {
        adblockInitialized: false,
        adbMem: {},
        adbStats: new AdbStats(),
        mutationLogger: null,
        adbDebug: false,
        MIN_BROWSER_VERSION: 35,
        timers: [],

        init: function init() {
          // Set `cliqz-adb` default to 'Disabled'
          if (CliqzUtils.getPref(ADB_PREF, undefined) === undefined) {
            CliqzUtils.setPref(ADB_PREF, ADB_PREF_VALUES.Disabled);
          }

          CliqzADB.adBlocker = new AdBlocker();

          var initAdBlocker = function initAdBlocker() {
            CliqzADB.adBlocker.init();
            CliqzADB.adblockInitialized = true;
            CliqzADB.initPacemaker();
            WebRequest.onBeforeRequest.addListener(CliqzADB.httpopenObserver.observe, undefined, ['blocking']);
          };

          if (adbEnabled()) {
            initAdBlocker();
          } else {
            this.onPrefChangeEvent = events.subscribe('prefchange', function (pref) {
              if ((pref === ADB_PREF || pref === ADB_ABTEST_PREF) && !CliqzADB.adblockInitialized && adbEnabled()) {
                // FIXME
                initAdBlocker();
              }
            });
          }
        },

        unload: function unload() {
          CliqzADB.adBlocker.unload();
          CliqzADB.adBlocker = null;
          CliqzADB.adblockInitialized = false;
          if (this.onPrefChangeEvent) {
            this.onPrefChangeEvent.unsubscribe();
          }
          CliqzADB.unloadPacemaker();
          browser.forEachWindow(CliqzADB.unloadWindow);
          WebRequest.onBeforeRequest.removeListener(CliqzADB.httpopenObserver.observe);
        },

        initWindow: function initWindow() /* window */{},

        unloadWindow: function unloadWindow() /* window */{},

        initPacemaker: function initPacemaker() {
          var t1 = utils.setInterval(function () {
            CliqzADB.adbStats.clearStats();
          }, 10 * 60 * 1000);
          CliqzADB.timers.push(t1);

          var t2 = utils.setInterval(function () {
            if (!CliqzADB.cacheADB) {
              return;
            }
            Object.keys(CliqzADB.cacheADB).forEach(function (t) {
              if (!browser.isWindowActive(t)) {
                delete CliqzADB.cacheADB[t];
              }
            });
          }, 10 * 60 * 1000);
          CliqzADB.timers.push(t2);
        },

        unloadPacemaker: function unloadPacemaker() {
          CliqzADB.timers.forEach(utils.clearTimeout);
        },

        httpopenObserver: {
          observe: function observe(requestDetails) {
            var requestContext = new HttpRequestContext(requestDetails);
            var url = requestContext.url;

            if (requestContext.isFullPage()) {
              CliqzADB.adbStats.addNewPage(url);
            }

            if (!adbEnabled() || !url) {
              return {};
            }

            var sourceUrl = requestContext.getSourceURL();

            if (!sourceUrl || sourceUrl.startsWith('about:')) {
              return {};
            }

            if (adbEnabled()) {
              var result = CliqzADB.adBlocker.match(requestContext);
              if (result.redirect) {
                return { redirectUrl: result.redirect };
              } else if (result.match) {
                CliqzADB.adbStats.addBlockedUrl(sourceUrl, url);
                return { cancel: true };
              }
            }

            return {};
          }
        },
        getBrowserMajorVersion: function getBrowserMajorVersion() {
          try {
            var appInfo = Components.classes['@mozilla.org/xre/app-info;1'].getService(Components.interfaces.nsIXULAppInfo);
            return parseInt(appInfo.version.split('.')[0], 10);
          } catch (e) {
            return 100;
          }
        },
        isTabURL: function isTabURL(url) {
          try {
            var wm = Components.classes['@mozilla.org/appshell/window-mediator;1'].getService(Components.interfaces.nsIWindowMediator);
            var browserEnumerator = wm.getEnumerator('navigator:browser');

            while (browserEnumerator.hasMoreElements()) {
              var browserWin = browserEnumerator.getNext();
              var tabbrowser = browserWin.gBrowser;

              var numTabs = tabbrowser.browsers.length;
              for (var index = 0; index < numTabs; index++) {
                var currentBrowser = tabbrowser.getBrowserAtIndex(index);
                if (currentBrowser) {
                  var tabURL = currentBrowser.currentURI.spec;
                  if (url === tabURL || url === tabURL.split('#')[0]) {
                    return true;
                  }
                }
              }
            }
            return false;
          } catch (e) {
            return false;
          }
        }
      };

      _export('default', CliqzADB);
    }
  };
});