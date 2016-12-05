System.register('adblocker/window', ['core/cliqz', 'adblocker/adblocker'], function (_export) {
  'use strict';

  var utils, CliqzADB, adbEnabled, adbABTestEnabled, ADB_PREF_VALUES, ADB_PREF_OPTIMIZED, ADB_PREF, CliqzUtils, _default;

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

  return {
    setters: [function (_coreCliqz) {
      utils = _coreCliqz.utils;
    }, function (_adblockerAdblocker) {
      CliqzADB = _adblockerAdblocker['default'];
      adbEnabled = _adblockerAdblocker.adbEnabled;
      adbABTestEnabled = _adblockerAdblocker.adbABTestEnabled;
      ADB_PREF_VALUES = _adblockerAdblocker.ADB_PREF_VALUES;
      ADB_PREF_OPTIMIZED = _adblockerAdblocker.ADB_PREF_OPTIMIZED;
      ADB_PREF = _adblockerAdblocker.ADB_PREF;
    }],
    execute: function () {
      CliqzUtils = utils;

      _default = (function () {
        function _default(settings) {
          _classCallCheck(this, _default);

          this.window = settings.window;
        }

        _createClass(_default, [{
          key: 'init',
          value: function init() {
            if (adbEnabled()) {
              CliqzADB.initWindow(this.window);
              this.window.adbinit = true;
            }
          }
        }, {
          key: 'unload',
          value: function unload() {
            if (adbEnabled()) {
              CliqzADB.unloadWindow(this.window);
              this.window.adbinit = false;
            }
          }
        }, {
          key: 'status',
          value: function status() {
            if (!adbABTestEnabled()) {
              return;
            }

            var currentURL = this.window.gBrowser.currentURI.spec;
            var adbDisabled = !adbEnabled();

            var isCorrectUrl = utils.isUrl(currentURL);
            var disabledForUrl = false;
            var disabledForDomain = false;
            var disabledEverywhere = false;

            // Check if adblocker is disabled on this page
            if (isCorrectUrl) {
              disabledForDomain = CliqzADB.adBlocker.isDomainInBlacklist(currentURL);
              disabledForUrl = CliqzADB.adBlocker.isUrlInBlacklist(currentURL);
            }

            var state = Object.keys(ADB_PREF_VALUES).map(function (name) {
              return {
                name: name.toLowerCase(),
                selected: utils.getPref(ADB_PREF, ADB_PREF_VALUES.Disabled) == ADB_PREF_VALUES[name]
              };
            });

            var report = CliqzADB.adbStats.report(currentURL);
            var enabled = CliqzUtils.getPref(ADB_PREF, false) !== ADB_PREF_VALUES.Disabled;

            if (isCorrectUrl) {
              disabledForDomain = CliqzADB.adBlocker.isDomainInBlacklist(currentURL);
              disabledForUrl = CliqzADB.adBlocker.isUrlInBlacklist(currentURL);
            }
            disabledEverywhere = !enabled && !disabledForUrl && !disabledForDomain;

            return {
              visible: true,
              enabled: enabled && !disabledForDomain && !disabledForUrl,
              optimized: CliqzUtils.getPref(ADB_PREF_OPTIMIZED, false) == true,
              disabledForUrl: disabledForUrl,
              disabledForDomain: disabledForDomain,
              disabledEverywhere: disabledEverywhere,
              totalCount: report.totalCount,
              advertisersList: report.advertisersList,
              state: !enabled ? 'off' : disabledForUrl || disabledForDomain ? 'off' : 'active',
              off_state: disabledForUrl ? 'off_website' : disabledForDomain ? 'off_domain' : disabledEverywhere ? 'off_all' : 'off_website'
            };
          }
        }]);

        return _default;
      })();

      _export('default', _default);
    }
  };
});