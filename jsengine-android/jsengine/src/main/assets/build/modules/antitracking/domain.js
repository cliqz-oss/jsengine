System.register('antitracking/domain', ['platform/public-suffix-list'], function (_export) {
  // Functions for manipulating domain names

  'use strict';

  var psl;

  _export('getGeneralDomain', getGeneralDomain);

  _export('sameGeneralDomain', sameGeneralDomain);

  _export('isIpv4Address', isIpv4Address);

  function getGeneralDomain(domain) {
    try {
      return psl.getGeneralDomain(domain);
    } catch (e) {
      // invalid hostname
      return '';
    }
  }

  function sameGeneralDomain(dom1, dom2) {
    // getGeneralDomain may throw an exception if domain is invalid
    try {
      return dom1 === dom2 || psl.getGeneralDomain(dom1) === psl.getGeneralDomain(dom2);
    } catch (e) {
      return false;
    }
  }

  function isIpv4Address(domain) {
    var digits = domain.split('.');
    return digits.length === 4 && digits.map(Number).every(function (d) {
      return d >= 0 && d < 256;
    });
  }

  return {
    setters: [function (_platformPublicSuffixList) {
      psl = _platformPublicSuffixList;
    }],
    execute: function () {
      ;
    }
  };
});