System.register('antitracking/window', ['antitracking/background', 'antitracking/attrack', 'core/cliqz', 'antitracking/url'], function (_export) {
  'use strict';

  var background, CliqzAttrack, utils, events, URLInfo, CliqzUtils, CliqzEvents, _default;

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

  function onLocationChange(ev) {
    if (this.interval) {
      CliqzUtils.clearInterval(this.interval);
    }

    var counter = 8;

    this.updateBadge();

    this.interval = CliqzUtils.setInterval((function () {
      this.updateBadge();

      counter -= 1;
      if (counter <= 0) {
        CliqzUtils.clearInterval(this.interval);
      }
    }).bind(this), 2000);
  }

  function onPrefChange(pref) {
    if (pref == CliqzAttrack.ENABLE_PREF && CliqzAttrack.isEnabled() != this.enabled) {
      if (CliqzAttrack.isEnabled()) {
        CliqzAttrack.initWindow(this.window);
      }
      this.enabled = CliqzAttrack.isEnabled();
    }
  }return {
    setters: [function (_antitrackingBackground) {
      background = _antitrackingBackground['default'];
    }, function (_antitrackingAttrack) {
      CliqzAttrack = _antitrackingAttrack['default'];
    }, function (_coreCliqz) {
      utils = _coreCliqz.utils;
      events = _coreCliqz.events;
    }, function (_antitrackingUrl) {
      URLInfo = _antitrackingUrl.URLInfo;
    }],
    execute: function () {
      CliqzUtils = utils;
      CliqzEvents = events;
      ;

      _default = (function () {
        function _default(config) {
          _classCallCheck(this, _default);

          this.window = config.window;

          this.popup = background.popup;

          this.onLocationChange = onLocationChange.bind(this);
          this.onPrefChange = onPrefChange.bind(this);
          this.enabled = false;
        }

        _createClass(_default, [{
          key: 'init',
          value: function init() {
            CliqzEvents.sub("core.location_change", this.onLocationChange);
            if (this.popup) {
              // Better to wait for first window to set the state of the button
              // otherways button may not be initialized yet
              this.popup.updateState(utils.getWindow(), CliqzAttrack.isEnabled());
            }
            this.onPrefChange(CliqzAttrack.ENABLE_PREF);
            CliqzEvents.sub("prefchange", this.onPrefChange);
          }
        }, {
          key: 'unload',
          value: function unload() {
            CliqzEvents.un_sub("core.location_change", this.onLocationChange);
            CliqzUtils.clearInterval(this.interval);
            CliqzEvents.un_sub("prefchange", this.onPrefChange);
          }
        }, {
          key: 'updateBadge',
          value: function updateBadge() {
            if (this.window !== CliqzUtils.getWindow()) {
              return;
            }

            var info = CliqzAttrack.getCurrentTabBlockingInfo(),
                count;

            try {
              count = info.cookies.blocked + info.requests.unsafe;
            } catch (e) {
              count = 0;
            }

            // do not display number if site is whitelisted
            if (CliqzAttrack.isSourceWhitelisted(info.hostname)) {
              count = 0;
            }

            if (this.popup) {
              this.popup.setBadge(this.window, count);
            } else {
              utils.callWindowAction(this.window, 'control-center', 'setBadge', [count]);
            }
          }
        }, {
          key: 'status',
          value: function status() {
            var info = CliqzAttrack.getCurrentTabBlockingInfo(this.window.gBrowser),
                ps = info.ps,
                hostname = URLInfo.get(this.window.gBrowser.currentURI.spec).hostname,
                isWhitelisted = CliqzAttrack.isSourceWhitelisted(hostname),
                enabled = utils.getPref('modules.antitracking.enabled', true) && !isWhitelisted;

            return {
              visible: true,
              strict: utils.getPref('attrackForceBlock', false),
              hostname: hostname,
              cookiesCount: info.cookies.blocked,
              requestsCount: info.requests.unsafe,
              totalCount: info.cookies.blocked + info.requests.unsafe,
              enabled: enabled,
              isWhitelisted: isWhitelisted || enabled,
              reload: info.reload || false,
              trackersList: info,
              ps: ps,
              state: enabled ? 'active' : isWhitelisted ? 'inactive' : 'critical'
            };
          }
        }]);

        return _default;
      })();

      _export('default', _default);

      ;
    }
  };
});