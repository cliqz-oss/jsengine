System.register('antitracking/steps/cookie-context', ['antitracking/domain', 'antitracking/url', 'core/cliqz', 'antitracking/utils', 'antitracking/pacemaker'], function (_export) {

  // moved from cookie-checker
  'use strict';

  var getGeneralDomain, URLInfo, utils, cleanTimestampCache, pacemaker, _default;

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

  function currentGD() {
    var currwin = utils.getWindow();
    var gd = null;
    if (currwin && currwin.gBrowser) {
      var url = currwin.gBrowser.selectedBrowser.currentURI.spec;
      gd = getGeneralDomain(URLInfo.get(url).hostname);
    }
    return gd;
  }

  return {
    setters: [function (_antitrackingDomain) {
      getGeneralDomain = _antitrackingDomain.getGeneralDomain;
    }, function (_antitrackingUrl) {
      URLInfo = _antitrackingUrl.URLInfo;
    }, function (_coreCliqz) {
      utils = _coreCliqz.utils;
    }, function (_antitrackingUtils) {
      cleanTimestampCache = _antitrackingUtils.cleanTimestampCache;
    }, function (_antitrackingPacemaker) {
      pacemaker = _antitrackingPacemaker['default'];
    }],
    execute: function () {
      _default = (function () {
        function _default() {
          _classCallCheck(this, _default);

          this.visitCache = {};
          this.contextFromEvent = null;
          this.timeAfterLink = 5 * 1000;
          this.timeCleaningCache = 180 * 1000;
          this.timeActive = 20 * 1000;
        }

        _createClass(_default, [{
          key: 'init',
          value: function init() {
            this._pmclean = pacemaker.register((function clean_caches(currTime) {
              // visit cache
              cleanTimestampCache(this.visitCache, this.timeCleaningCache, currTime);
            }).bind(this), 2 * 60 * 1000);
          }
        }, {
          key: 'unload',
          value: function unload() {
            pacemaker.deregister(this._pmclean);
          }
        }, {
          key: 'checkVisitCache',
          value: function checkVisitCache(state) {
            // check if the response has been received yet
            var stage = state.responseStatus !== undefined ? 'set_cookie' : 'cookie';
            var tabId = state.tabId;
            state.hostGD = getGeneralDomain(state.urlParts.hostname);
            state.sourceGD = getGeneralDomain(state.sourceUrlParts.hostname);
            var diff = Date.now() - (this.visitCache[tabId + ':' + state.hostGD] || 0);
            if (diff < this.timeActive && this.visitCache[tabId + ':' + state.sourceGD]) {
              state.incrementStat(stage + '_allow_visitcache');
              return false;
            }
            return true;
          }
        }, {
          key: 'checkContextFromEvent',
          value: function checkContextFromEvent(state) {
            if (this.contextFromEvent) {
              var stage = state.responseStatus !== undefined ? 'set_cookie' : 'cookie';
              var time = Date.now();
              var url = state.url;
              var tabId = state.tabId;
              var hostGD = state.hostGD || getGeneralDomain(state.urlParts.hostname);

              var diff = time - (this.contextFromEvent.ts || 0);
              if (diff < this.timeAfterLink) {

                if (hostGD === this.contextFromEvent.cGD) {
                  this.visitCache[tabId + ':' + hostGD] = time;
                  state.incrementStat(stage + '_allow_userinit_same_context_gd');
                  return false;
                }
                var pu = url.split(/[?&;]/)[0];
                if (this.contextFromEvent.html.indexOf(pu) != -1) {
                  // the url is in pu
                  if (url_parts && url_parts.hostname && url_parts.hostname != '') {
                    this.visitCache[tabId + ':' + hostGD] = time;
                    state.incrementStat(stage + '_allow_userinit_same_gd_link');
                    return false;
                  }
                }
              }
            }
            return true;
          }
        }, {
          key: 'setContextFromEvent',
          value: function setContextFromEvent(ev, contextHTML) {
            try {
              if (contextHTML) {
                // don't log the event if it's not 3rd party
                var cGD = getGeneralDomain(URLInfo.get(ev.target.baseURI).hostname);
                var pageGD = currentGD();
                if (!pageGD || cGD === pageGD) {
                  return;
                }
                this.contextFromEvent = {
                  html: contextHTML,
                  ts: Date.now(),
                  cGD: cGD,
                  pageGD: pageGD
                };
              }
            } catch (ee) {
              this.contextFromEvent = null;
            }
          }
        }]);

        return _default;
      })();

      _export('default', _default);
    }
  };
});