System.register('antitracking/steps/page-logger', [], function (_export) {
  'use strict';

  var _default;

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

  return {
    setters: [],
    execute: function () {
      _default = (function () {
        function _default(tpEvents, blockLog) {
          _classCallCheck(this, _default);

          this.tpEvents = tpEvents;
          this.blockLog = blockLog;
        }

        _createClass(_default, [{
          key: 'checkIsMainDocument',
          value: function checkIsMainDocument(state) {
            var requestContext = state.requestContext;
            if (state.requestContext.isFullPage()) {
              this.tpEvents.onFullPage(state.urlParts, requestContext.getOuterWindowID(), requestContext.isChannelPrivate());
              // if (CliqzAttrack.isTrackerTxtEnabled()) {
              //   TrackerTXT.get(url_parts).update();
              // }
              this.blockLog.incrementLoadedPages();
              return false;
            }
            return true;
          }
        }, {
          key: 'attachStatCounter',
          value: function attachStatCounter(state) {
            var _this = this;

            var urlParts = state.urlParts;
            var request = this.tpEvents.get(state.url, urlParts, state.sourceUrl, state.sourceUrlParts, state.requestContext.getOriginWindowID());
            state.reqLog = request;
            var incrementStat = function incrementStat(statName, c) {
              _this.tpEvents.incrementStat(request, statName, c || 1);
            };
            state.incrementStat = incrementStat;

            return true;
          }
        }, {
          key: 'logRequestMetadata',
          value: function logRequestMetadata(state) {
            var urlParts = state.urlParts;
            var incrementStat = state.incrementStat;

            // add metadata for this request
            incrementStat('c');
            if (urlParts.query.length > 0) {
              incrementStat('has_qs');
            }
            if (urlParts.parameters.length > 0) {
              incrementStat('has_ps');
            }
            if (urlParts.fragment.length > 0) {
              incrementStat('has_fragment');
            }
            if (state.method === 'POST') {
              incrementStat('has_post');
            }
            var displayContentType = function displayContentType(contentType) {
              return !contentType ? 'unknown' : '' + contentType;
            };
            incrementStat('type_' + displayContentType(state.requestContext.getContentPolicyType()));

            // log protocol (secure or not)
            var isHTTP = function isHTTP(protocol) {
              return protocol === "http" || protocol === "https";
            };
            var scheme = isHTTP(urlParts.protocol) ? urlParts.protocol : "other";
            incrementStat('scheme_' + scheme);

            // find frame depth
            incrementStat('window_depth_' + state.requestContext.getWindowDepth());

            return true;
          }
        }]);

        return _default;
      })();

      _export('default', _default);
    }
  };
});