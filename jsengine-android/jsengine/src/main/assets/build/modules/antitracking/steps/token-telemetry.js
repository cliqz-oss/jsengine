System.register('antitracking/steps/token-telemetry', ['antitracking/md5', 'antitracking/time', 'antitracking/persistent-state', 'antitracking/utils', 'antitracking/pacemaker'], function (_export) {

  /**
   * Add padding characters to the left of the given string.
   *
   * @param {string} str  - original string.
   * @param {string} char - char used for padding the string.
   * @param {number} size - desired size of the resulting string (after padding)
  **/
  'use strict';

  var md5, datetime, persist, splitTelemetryData, pacemaker, _default;

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

  function leftpad(str, char, size) {
    // This function only makes sens if `char` is a character.
    if (char.length != 1) {
      throw new Error("`char` argument must only contain one character");
    }

    if (str.length >= size) {
      return str;
    } else {
      return char.repeat(size - str.length) + str;
    }
  }

  /**
   * Remove any trace of source domains, or hashes of source domains
   * from the data to be sent to the backend. This is made to ensure
   * there is no way to backtrack to user's history using data sent to
   * the backend.
   *
   * Replace all the keys of `trackerData` (which are 16-chars prefixes of
   * hash of the source domain) by unique random strings of size 16 (which is
   * expected by backend). We don't have to make them unique among all data,
   * it is enough to ensure unicity on a per-tracker basis.
   *
   * @param {Object} trackerData - associate source domains to key/value pairs.
  **/
  function anonymizeTrackerTokens(trackerData) {
    // Random base id
    var min = 1;
    var max = Number.MAX_SAFE_INTEGER;
    var randId = Math.floor(Math.random() * (max - min + 1)) + min;

    // Anonymize the given tracker data
    var anonymizedTrackerData = {};

    for (var originalKey in trackerData) {
      var newRandomKey = leftpad(randId.toString().substr(0, 16), '0', 16);
      randId = (randId + 1) % max;
      anonymizedTrackerData[newRandomKey] = trackerData[originalKey];
    }

    return anonymizedTrackerData;
  }

  return {
    setters: [function (_antitrackingMd5) {
      md5 = _antitrackingMd5['default'];
    }, function (_antitrackingTime) {
      datetime = _antitrackingTime;
    }, function (_antitrackingPersistentState) {
      persist = _antitrackingPersistentState;
    }, function (_antitrackingUtils) {
      splitTelemetryData = _antitrackingUtils.splitTelemetryData;
    }, function (_antitrackingPacemaker) {
      pacemaker = _antitrackingPacemaker['default'];
    }],
    execute: function () {
      _default = (function () {
        function _default(telemetry) {
          var _this = this;

          _classCallCheck(this, _default);

          this.telemetry = telemetry;
          this.tokens = {};
          this._tokens = new persist.AutoPersistentObject("tokens", function (v) {
            return _this.tokens = v;
          }, 60000);
        }

        _createClass(_default, [{
          key: 'init',
          value: function init() {
            this._pmsend = pacemaker.register(this.sendTokens.bind(this), 5 * 60 * 1000);
          }
        }, {
          key: 'unload',
          value: function unload() {
            this._tokens.save();
            pacemaker.deregister(this._pmsend);
          }
        }, {
          key: 'extractKeyTokens',
          value: function extractKeyTokens(state) {
            // ignore private requests
            if (state.requestContext.isChannelPrivate()) return true;

            var keyTokens = state.urlParts.getKeyValuesMD5();
            if (keyTokens.length > 0) {
              var domain = md5(state.urlParts.hostname).substr(0, 16);
              var firstParty = md5(state.sourceUrlParts.hostname).substr(0, 16);
              this._saveKeyTokens(domain, keyTokens, firstParty);
            }
            return true;
          }
        }, {
          key: '_saveKeyTokens',
          value: function _saveKeyTokens(domain, keyTokens, firstParty) {
            // anything here should already be hash
            if (this.tokens[domain] == null) this.tokens[domain] = { lastSent: datetime.getTime() };
            if (this.tokens[domain][firstParty] == null) this.tokens[domain][firstParty] = { 'c': 0, 'kv': {} };

            this.tokens[domain][firstParty]['c'] = (this.tokens[domain][firstParty]['c'] || 0) + 1;
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
              for (var _iterator = keyTokens[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var kv = _step.value;

                var tok = kv.v,
                    k = kv.k;
                if (this.tokens[domain][firstParty]['kv'][k] == null) this.tokens[domain][firstParty]['kv'][k] = {};
                if (this.tokens[domain][firstParty]['kv'][k][tok] == null) {
                  this.tokens[domain][firstParty]['kv'][k][tok] = {
                    c: 0,
                    k_len: kv.k_len,
                    v_len: kv.v_len
                  };
                }
                this.tokens[domain][firstParty]['kv'][k][tok].c += 1;
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

            this._tokens.setDirty();
          }
        }, {
          key: 'sendTokens',
          value: function sendTokens() {
            var _this2 = this;

            // send tokens every 5 minutes
            var data = {},
                hour = datetime.getTime(),
                limit = Object.keys(this.tokens).length / 12;

            // sort tracker keys by lastSent, i.e. send oldest data first
            var sortedTrackers = Object.keys(this.tokens).sort(function (a, b) {
              return parseInt(_this2.tokens[a].lastSent || 0) - parseInt(_this2.tokens[b].lastSent || 0);
            });

            for (var i in sortedTrackers) {
              var tracker = sortedTrackers[i];

              if (limit > 0 && Object.keys(data).length > limit) {
                break;
              }

              var tokenData = this.tokens[tracker];
              if (!tokenData.lastSent || tokenData.lastSent < hour) {
                delete tokenData.lastSent;
                data[tracker] = anonymizeTrackerTokens(tokenData);
                delete this.tokens[tracker];
              }
            }

            if (Object.keys(data).length > 0) {
              splitTelemetryData(data, 20000).map(function (d) {
                var msg = {
                  'type': _this2.telemetry.msgType,
                  'action': 'attrack.tokens',
                  'payload': d
                };
                _this2.telemetry({
                  message: msg,
                  compress: true
                });
              });
            }
            this._tokens.setDirty();
          }
        }]);

        return _default;
      })();

      _export('default', _default);
    }
  };
});