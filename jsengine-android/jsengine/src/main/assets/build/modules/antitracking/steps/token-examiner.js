System.register('antitracking/steps/token-examiner', ['antitracking/pacemaker', 'antitracking/persistent-state', 'antitracking/time', 'antitracking/domain', 'antitracking/md5'], function (_export) {

  // creates local safe keys for keys with multiple observed values
  'use strict';

  var pacemaker, persist, datetime, getGeneralDomain, md5, _default;

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

  return {
    setters: [function (_antitrackingPacemaker) {
      pacemaker = _antitrackingPacemaker['default'];
    }, function (_antitrackingPersistentState) {
      persist = _antitrackingPersistentState;
    }, function (_antitrackingTime) {
      datetime = _antitrackingTime;
    }, function (_antitrackingDomain) {
      getGeneralDomain = _antitrackingDomain.getGeneralDomain;
    }, function (_antitrackingMd5) {
      md5 = _antitrackingMd5['default'];
    }],
    execute: function () {
      _default = (function () {
        function _default(qsWhitelist, shortTokenLength, safekeyValuesThreshold, safeKeyExpire) {
          var _this = this;

          _classCallCheck(this, _default);

          this.qsWhitelist = qsWhitelist;
          this.shortTokenLength = shortTokenLength;
          this.safekeyValuesThreshold = safekeyValuesThreshold;
          this.safeKeyExpire = safeKeyExpire;
          this.requestKeyValue = {};
          this._requestKeyValue = new persist.AutoPersistentObject("requestKeyValue", function (v) {
            return _this.requestKeyValue = v;
          }, 60000);
        }

        _createClass(_default, [{
          key: 'init',
          value: function init() {
            var hourly = 60 * 60 * 1000;
            this._pmPrune = pacemaker.register(this._pruneRequestKeyValue.bind(this), hourly);
            this._pmAnnotate = pacemaker.register((function annotateSafeKeys() {
              this.qsWhitelist.annotateSafeKeys(this.requestKeyValue);
            }).bind(this), 10 * hourly);
          }
        }, {
          key: 'unload',
          value: function unload() {
            pacemaker.deregister(this._pmPrune);
            pacemaker.deregister(this._pmAnnotate);
          }
        }, {
          key: 'clearCache',
          value: function clearCache() {
            this._requestKeyValue.clear();
          }
        }, {
          key: 'examineTokens',
          value: function examineTokens(state) {
            if (!state.requestContext.isChannelPrivate()) {
              this._examineTokens(state.urlParts);
            }
            return true;
          }
        }, {
          key: '_examineTokens',
          value: function _examineTokens(url_parts) {
            var _this2 = this;

            var day = datetime.newUTCDate();
            var today = datetime.dateString(day);
            // save appeared tokens with field name
            // mark field name as "safe" if different values appears
            var s = getGeneralDomain(url_parts.hostname);
            s = md5(s).substr(0, 16);
            url_parts.getKeyValuesMD5().filter(function (kv) {
              return kv.v_len >= _this2.shortTokenLength;
            }).forEach(function (kv) {
              var key = kv.k,
                  tok = kv.v;
              if (_this2.qsWhitelist.isSafeKey(s, key)) return;
              if (_this2.requestKeyValue[s] == null) _this2.requestKeyValue[s] = {};
              if (_this2.requestKeyValue[s][key] == null) _this2.requestKeyValue[s][key] = {};

              _this2.requestKeyValue[s][key][tok] = today;
              // see at least 3 different value until it's safe
              var valueCount = Object.keys(_this2.requestKeyValue[s][key]).length;
              if (valueCount > _this2.safekeyValuesThreshold) {
                _this2.qsWhitelist.addSafeKey(s, key, valueCount);
                // keep the last seen token
                _this2.requestKeyValue[s][key] = { tok: today };
              }
              _this2._requestKeyValue.setDirty();
            });
          }
        }, {
          key: '_pruneRequestKeyValue',
          value: function _pruneRequestKeyValue() {
            var day = datetime.newUTCDate();
            day.setDate(day.getDate() - this.safeKeyExpire);
            var dayCutoff = datetime.dateString(day);
            for (var s in this.requestKeyValue) {
              for (var key in this.requestKeyValue[s]) {
                for (var tok in this.requestKeyValue[s][key]) {
                  if (this.requestKeyValue[s][key][tok] < dayCutoff) {
                    delete this.requestKeyValue[s][key][tok];
                  }
                }
                if (Object.keys(this.requestKeyValue[s][key]).length == 0) {
                  delete this.requestKeyValue[s][key];
                }
              }
              if (Object.keys(this.requestKeyValue[s]).length == 0) {
                delete this.requestKeyValue[s];
              }
            }
            this._requestKeyValue.setDirty();
            this._requestKeyValue.save();
          }
        }]);

        return _default;
      })();

      _export('default', _default);
    }
  };
});