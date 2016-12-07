System.register('antitracking/steps/block-rules', ['core/resource-loader'], function (_export) {
  'use strict';

  var ResourceLoader, URL_BLOCK_RULES, _default;

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

  return {
    setters: [function (_coreResourceLoader) {
      ResourceLoader = _coreResourceLoader['default'];
    }],
    execute: function () {
      URL_BLOCK_RULES = 'https://cdn.cliqz.com/anti-tracking/whitelist/anti-tracking-block-rules.json';

      _default = (function () {
        function _default(blockRulesUrl) {
          _classCallCheck(this, _default);

          this.blockRulesUrl = blockRulesUrl || URL_BLOCK_RULES;
          this.qsBlockRule = [];
          this._blockRulesLoader = new ResourceLoader(['antitracking', 'anti-tracking-block-rules.json'], {
            remoteURL: this.blockRulesUrl,
            cron: 24 * 60 * 60 * 1000
          });
        }

        _createClass(_default, [{
          key: 'init',
          value: function init() {
            var _this = this;

            var updateRules = function updateRules(rules) {
              _this.qsBlockRule = rules || [];
            };
            this._blockRulesLoader.load().then(updateRules);
            this._blockRulesLoader.onUpdate(updateRules);
          }
        }, {
          key: 'unload',
          value: function unload() {
            this._blockRulesLoader.stop();
          }
        }, {
          key: 'shouldBlock',
          value: function shouldBlock(host, sourceHost) {
            for (var i = 0; i < this.qsBlockRule.length; i++) {
              var sRule = this.qsBlockRule[i][0],
                  uRule = this.qsBlockRule[i][1];
              if (sourceHost.endsWith(sRule) && host.endsWith(uRule)) {
                return true;
              }
            }
            return false;
          }
        }, {
          key: 'applyBlockRules',
          value: function applyBlockRules(state, response) {
            if (this.shouldBlock(state.urlParts.hostname, state.sourceUrlParts.hostname)) {
              state.incrementStat('req_rule_aborted');
              response.cancel = true;
              return false;
            }
            return true;
          }
        }]);

        return _default;
      })();

      _export('default', _default);
    }
  };
});