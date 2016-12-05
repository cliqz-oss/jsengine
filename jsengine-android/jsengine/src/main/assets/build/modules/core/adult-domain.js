System.register('core/adult-domain', ['platform/bloom-filter-utils', './console'], function (_export) {
  'use strict';

  var BloomFilterUtils, console, ADULT_DOMAINS_BF_FILE_URI, AdultDomain;

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

  return {
    setters: [function (_platformBloomFilterUtils) {
      BloomFilterUtils = _platformBloomFilterUtils.BloomFilterUtils;
    }, function (_console) {
      console = _console['default'];
    }],
    execute: function () {
      ADULT_DOMAINS_BF_FILE_URI = 'chrome://cliqz/content/core/adult-domains.bin';

      AdultDomain = (function () {
        function AdultDomain() {
          _classCallCheck(this, AdultDomain);

          try {
            this.filter = BloomFilterUtils.loadFromInput(ADULT_DOMAINS_BF_FILE_URI, 'uri')[0];
          } catch (e) {
            console.log('Adult Domain List failed loading');
          }
        }

        _createClass(AdultDomain, [{
          key: 'isAdult',
          value: function isAdult(domain) {
            if (!this.filter) return false;
            return this.filter.test(domain);
          }
        }]);

        return AdultDomain;
      })();

      _export('AdultDomain', AdultDomain);
    }
  };
});