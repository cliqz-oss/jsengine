System.register('adblocker/filters-loader', ['core/resource-loader', 'core/language', 'core/platform'], function (_export) {

  // Disk persisting
  'use strict';

  var ResourceLoader, Resource, UpdateCallbackHandler, Language, platformName, RESOURCES_PATH, ONE_SECOND, ONE_MINUTE, ONE_HOUR, BASE_URL, LANGS, EOL, FILTER_BOWER_PREFIX, FiltersList, _default;

  var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

  function stripProtocol(url) {
    var result = url;
    ['http://', 'https://'].forEach(function (prefix) {
      if (result.startsWith(prefix)) {
        result = result.substring(prefix.length);
      }
    });

    return result;
  }

  function getBowerUrl(assetName) {
    var bowerName = FILTER_BOWER_PREFIX + assetName.replace(/\//g, '_').replace(/\./g, '-');
    return 'chrome://cliqz/content/adblocker/mobile/' + assetName;
  }

  return {
    setters: [function (_coreResourceLoader) {
      ResourceLoader = _coreResourceLoader['default'];
      Resource = _coreResourceLoader.Resource;
      UpdateCallbackHandler = _coreResourceLoader.UpdateCallbackHandler;
    }, function (_coreLanguage) {
      Language = _coreLanguage['default'];
    }, function (_corePlatform) {
      platformName = _corePlatform.platformName;
    }],
    execute: function () {
      RESOURCES_PATH = ['adblocker'];

      // Common durations
      ONE_SECOND = 1000;
      ONE_MINUTE = 60 * ONE_SECOND;
      ONE_HOUR = 60 * ONE_MINUTE;

      // URLs to fetch block lists
      BASE_URL = 'https://s3.amazonaws.com/cdn.cliqz.com/adblocking/mobile-test/';
      LANGS = Language.state();
      EOL = '\n';
      FILTER_BOWER_PREFIX = "adb_";

      FiltersList = (function () {
        function FiltersList(checksum, asset, remoteURL) {
          _classCallCheck(this, FiltersList);

          this.checksum = checksum;
          this.baseRemoteURL = remoteURL;

          var assetName = stripProtocol(asset);

          this.resource = new Resource(RESOURCES_PATH.concat(assetName.split('/')), {
            remoteURL: this.remoteURL(),
            chromeURL: getBowerUrl(assetName),
            dataType: 'plainText'
          });
        }

        /* Class responsible for loading, persisting and updating filters lists.
         */

        _createClass(FiltersList, [{
          key: 'remoteURL',
          value: function remoteURL() {
            return this.baseRemoteURL + '?t=' + parseInt(Date.now() / 60 / 60 / 1000, 10);
          }
        }, {
          key: 'load',
          value: function load() {
            return this.resource.load().then(this.updateList.bind(this));
          }
        }, {
          key: 'update',
          value: function update() {
            return this.resource.updateFromRemote().then(this.updateList.bind(this));
          }
        }, {
          key: 'needsToUpdate',
          value: function needsToUpdate(checksum) {
            return checksum !== this.checksum;
          }
        }, {
          key: 'stop',
          value: function stop() {}
        }, {
          key: 'updateFromChecksum',
          value: function updateFromChecksum(checksum) {
            this.resource.remoteURL = this.remoteURL();
            this.checksum = checksum;
            return this.update();
          }
        }, {
          key: 'updateList',
          value: function updateList(data) {
            var filters = data.split(EOL);
            if (filters.length > 0) {
              return filters;
            }
            return undefined;
          }
        }]);

        return FiltersList;
      })();

      _default = (function (_UpdateCallbackHandler) {
        _inherits(_default, _UpdateCallbackHandler);

        function _default() {
          _classCallCheck(this, _default);

          _get(Object.getPrototypeOf(_default.prototype), 'constructor', this).call(this);

          // Resource managing the allowed lists for the adblocker
          this.allowedListsLoader = new ResourceLoader(RESOURCES_PATH.concat(platformName, 'checksums'), {
            cron: 24 * ONE_HOUR,
            updateInterval: 15 * ONE_MINUTE,
            dataType: 'json',
            remoteURL: this.remoteURL()
          });
          this.allowedListsLoader.onUpdate(this.updateChecksums.bind(this));

          // Lists of filters currently loaded
          this.lists = new Map();
        }

        _createClass(_default, [{
          key: 'remoteURL',
          value: function remoteURL() {
            return 'https://s3.amazonaws.com/cdn.cliqz.com/adblocking/mobile-test/allowed-lists.json?t=' + parseInt(Date.now() / 60 / 60 / 1000, 10);
          }
        }, {
          key: 'stop',
          value: function stop() {
            this.allowedListsLoader.stop();
          }
        }, {
          key: 'load',
          value: function load() {
            return this.allowedListsLoader.load().then(this.updateChecksums.bind(this));
          }
        }, {
          key: 'update',
          value: function update() {
            return this.allowedListsLoader.updateFromRemote();
          }

          // Private API

        }, {
          key: 'updateChecksums',
          value: function updateChecksums(allowedLists) {
            // Update URL with current timestamp to play well with caching
            this.allowedListsLoader.resource.remoteURL = this.remoteURL();

            var filtersLists = [];

            Object.keys(allowedLists).forEach(function (list) {
              Object.keys(allowedLists[list]).forEach(function (asset) {
                var checksum = allowedLists[list][asset].checksum;
                var lang = null;

                if (list === 'country_lists') {
                  lang = allowedLists[list][asset].language;
                }

                var assetName = stripProtocol(asset);
                var filterRemoteURL = BASE_URL + assetName;

                if (lang === null || LANGS.indexOf(lang) > -1) {
                  filtersLists.push({
                    checksum: checksum,
                    asset: asset,
                    remoteURL: filterRemoteURL,
                    key: list
                  });
                }
              });
            });

            return this.updateLists(filtersLists);
          }
        }, {
          key: 'updateLists',
          value: function updateLists(filtersLists) {
            var _this = this;

            var updatedLists = [];

            filtersLists.forEach(function (newList) {
              var checksum = newList.checksum;
              var asset = newList.asset;
              var remoteURL = newList.remoteURL;
              var key = newList.key;

              var isFiltersList = key !== 'js_resources';

              if (!_this.lists.has(asset)) {
                (function () {
                  // Create a new list
                  var list = new FiltersList(checksum, asset, remoteURL);
                  _this.lists.set(asset, list);

                  // Load the list async
                  updatedLists.push(list.load().then(function (filters) {
                    return {
                      asset: asset,
                      filters: filters,
                      isFiltersList: isFiltersList,
                      checksum: list.checksum
                    };
                  }));
                })();
              } else {
                (function () {
                  // Retrieve existing list
                  var list = _this.lists.get(asset);

                  // Update the list only if needed (checksum is different)
                  if (list.needsToUpdate(checksum)) {
                    updatedLists.push(list.updateFromChecksum(checksum).then(function (filters) {
                      // Ignore any empty list
                      if (filters) {
                        return {
                          asset: asset,
                          filters: filters,
                          isFiltersList: isFiltersList,
                          checksum: list.checksum
                        };
                      }
                      return undefined;
                    }));
                  }
                })();
              }
            });

            // Wait for all lists to be fetched, filters the empty ones and
            // trigger callback (will typically trigger a FiltersEngine update)
            return Promise.all(updatedLists).then(function (filters) {
              return filters.filter(function (f) {
                return f !== undefined;
              });
            }).then(function (filters) {
              return _this.triggerCallbacks(filters);
            });
          }
        }]);

        return _default;
      })(UpdateCallbackHandler);

      _export('default', _default);
    }
  };
});