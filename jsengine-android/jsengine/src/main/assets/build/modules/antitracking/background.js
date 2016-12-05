System.register('antitracking/background', ['core/base/background', 'antitracking/popup-button', 'antitracking/attrack', 'antitracking/privacy-score', 'antitracking/md5', 'antitracking/tracker-txt', 'core/cliqz', 'antitracking/telemetry'], function (_export) {

  /**
  * @namespace antitracking
  * @class Background
  */
  'use strict';

  var background, CliqzPopupButton, CliqzAttrack, PrivacyScore, md5, DEFAULT_ACTION_PREF, updateDefaultTrackerTxtRule, utils, events, telemetry;
  return {
    setters: [function (_coreBaseBackground) {
      background = _coreBaseBackground['default'];
    }, function (_antitrackingPopupButton) {
      CliqzPopupButton = _antitrackingPopupButton['default'];
    }, function (_antitrackingAttrack) {
      CliqzAttrack = _antitrackingAttrack['default'];
    }, function (_antitrackingPrivacyScore) {
      PrivacyScore = _antitrackingPrivacyScore.PrivacyScore;
    }, function (_antitrackingMd5) {
      md5 = _antitrackingMd5['default'];
    }, function (_antitrackingTrackerTxt) {
      DEFAULT_ACTION_PREF = _antitrackingTrackerTxt.DEFAULT_ACTION_PREF;
      updateDefaultTrackerTxtRule = _antitrackingTrackerTxt.updateDefaultTrackerTxtRule;
    }, function (_coreCliqz) {
      utils = _coreCliqz.utils;
      events = _coreCliqz.events;
    }, function (_antitrackingTelemetry) {
      telemetry = _antitrackingTelemetry['default'];
    }],
    execute: function () {
      _export('default', background({
        /**
        * @method init
        * @param settings
        */
        init: function init(settings) {
          var _this = this;

          if (CliqzAttrack.getBrowserMajorVersion() < CliqzAttrack.MIN_BROWSER_VERSION) {
            return;
          }

          // fix for users without pref properly set: set to value from build config
          if (!utils.hasPref('attrackRemoveQueryStringTracking')) {
            utils.setPref('attrackRemoveQueryStringTracking', settings.antitrackingButton);
          }

          this.enabled = false;
          this.clickCache = {};

          utils.bindObjectFunctions(this.popupActions, this);

          // inject configured telemetry module
          telemetry.loadFromProvider(settings.telemetryProvider || 'human-web/human-web');

          return CliqzAttrack.init().then(function () {
            if (_this.popup) {
              _this.popup.updateState(utils.getWindow(), true);
            }
          });
        },

        /**
        * @method unload
        */
        unload: function unload() {
          if (CliqzAttrack.getBrowserMajorVersion() < CliqzAttrack.MIN_BROWSER_VERSION) {
            return;
          }

          if (this.popup) {
            this.popup.destroy();
          }

          CliqzAttrack.unload();

          this.enabled = false;
        },

        popupActions: {
          /**
          * @method popupActions.getPopupData
          * @param args
          * @param cb Callback
          */
          getPopupData: function getPopupData(args, cb) {

            var info = CliqzAttrack.getCurrentTabBlockingInfo(),
                ps = info.ps;
            // var ps = PrivacyScore.get(md5(info.hostname).substring(0, 16)  'site');

            // ps.getPrivacyScore();

            cb({
              url: info.hostname,
              cookiesCount: info.cookies.blocked,
              requestsCount: info.requests.unsafe,
              enabled: utils.getPref('modules.antitracking.enabled'),
              isWhitelisted: CliqzAttrack.isSourceWhitelisted(info.hostname),
              reload: info.reload || false,
              trakersList: info,
              ps: ps
            });

            if (this.popup) {
              this.popup.setBadge(utils.getWindow(), info.cookies.blocked + info.requests.unsafe);
            } else {
              utils.callWindowAction(utils.getWindow(), 'control-center', 'setBadge', [info.cookies.blocked + info.requests.unsafe]);
            }
          },
          /**
          * @method popupActions.toggleAttrack
          * @param args
          * @param cb Callback
          */
          toggleAttrack: function toggleAttrack(args, cb) {
            var currentState = utils.getPref('modules.antitracking.enabled');

            if (currentState) {
              CliqzAttrack.disableModule();
            } else {
              CliqzAttrack.enableModule();
            }

            this.popup.updateState(utils.getWindow(), !currentState);

            cb();

            this.popupActions.telemetry({ action: 'click', 'target': currentState ? 'deactivate' : 'activate' });
          },
          /**
          * @method popupActions.closePopup
          */
          closePopup: function closePopup(_, cb) {
            this.popup.tbb.closePopup();
            cb();
          },
          /**
          * @method popupActions.toggleWhiteList
          * @param args
          * @param cb Callback
          */
          toggleWhiteList: function toggleWhiteList(args, cb) {
            var hostname = args.hostname;
            if (CliqzAttrack.isSourceWhitelisted(hostname)) {
              CliqzAttrack.removeSourceDomainFromWhitelist(hostname);
              this.popupActions.telemetry({ action: 'click', target: 'unwhitelist_domain' });
            } else {
              CliqzAttrack.addSourceDomainToWhitelist(hostname);
              this.popupActions.telemetry({ action: 'click', target: 'whitelist_domain' });
            }
            cb();
          },
          /**
          * @method popupActions.updateHeight
          * @param args
          * @param cb Callback
          */
          updateHeight: function updateHeight(args, cb) {
            this.popup.updateView(utils.getWindow(), args[0]);
          },

          _isDuplicate: function _isDuplicate(info) {
            var now = Date.now();
            var key = info.tab + info.hostname + info.path;

            // clean old entries
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
              for (var _iterator = Object.keys(this.clickCache)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var k = _step.value;

                if (now - this.clickCache[k] > 60000) {
                  delete this.clickCache[k];
                }
              }
            } catch (err) {
              _didIteratorError = true;
              _iteratorError = err;
            } finally {
              try {
                if (!_iteratorNormalCompletion && _iterator['return']) {
                  _iterator['return']();
                }
              } finally {
                if (_didIteratorError) {
                  throw _iteratorError;
                }
              }
            }

            if (key in this.clickCache) {
              return true;
            } else {
              this.clickCache[key] = now;
              return false;
            }
          },

          telemetry: function telemetry(msg) {
            if (msg.includeUnsafeCount) {
              delete msg.includeUnsafeCount;
              var info = CliqzAttrack.getCurrentTabBlockingInfo();
              // drop duplicated messages
              if (info.error || this.popupActions._isDuplicate(info)) {
                return;
              }
              msg.unsafe_count = info.cookies.blocked + info.requests.unsafe;
              msg.special = info.error !== undefined;
            }
            msg.type = 'antitracking';
            utils.telemetry(msg);
          }
        },

        events: {
          "prefchange": function onPrefChange(pref) {
            if (pref === DEFAULT_ACTION_PREF) {
              updateDefaultTrackerTxtRule();
            }
          },
          "core:urlbar_focus": CliqzAttrack.onUrlbarFocus,
          "core.tab_location_change": CliqzAttrack.onTabLocationChange,
          "antitracking:whitelist:add": function antitrackingWhitelistAdd(hostname) {
            CliqzAttrack.addSourceDomainToWhitelist(hostname);
            this.popupActions.telemetry({
              action: 'click',
              target: 'whitelist_domain'
            });
          },
          "antitracking:whitelist:remove": function antitrackingWhitelistRemove(hostname) {
            if (CliqzAttrack.isSourceWhitelisted(hostname)) {
              CliqzAttrack.removeSourceDomainFromWhitelist(hostname);
              this.popupActions.telemetry({
                action: 'click',
                target: 'unwhitelist_domain'
              });
            }
          },
          "control-center:antitracking-strict": function controlCenterAntitrackingStrict() {
            utils.setPref('attrackForceBlock', !utils.getPref('attrackForceBlock', false));
          },
          "core:mouse-down": function coreMouseDown() {
            if (CliqzAttrack.pipelineSteps.cookieContext) {
              CliqzAttrack.pipelineSteps.cookieContext.setContextFromEvent.apply(CliqzAttrack.pipelineSteps.cookieContext, arguments);
            }
          }
        }
      }));
    }
  };
});