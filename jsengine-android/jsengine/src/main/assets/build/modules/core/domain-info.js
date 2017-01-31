System.register('core/domain-info', ['core/resource-loader', 'core/resource-manager'], function (_export) {
  'use strict';

  var ResourceLoader, resourceManager, domainInfo;

  function parseDomainOwners(companyList) {
    var revList = {};

    var _loop = function (company) {
      companyList[company].forEach(function (d) {
        revList[d] = company;
      });
    };

    for (var company in companyList) {
      _loop(company);
    }
    domainInfo.domainOwners = revList;
  }

  return {
    setters: [function (_coreResourceLoader) {
      ResourceLoader = _coreResourceLoader['default'];
    }, function (_coreResourceManager) {
      resourceManager = _coreResourceManager['default'];
    }],
    execute: function () {
      domainInfo = {
        domainOwners: {}
      };
      resourceManager.addResourceLoader(new ResourceLoader(['antitracking', 'tracker_owners.json'], {
        remoteURL: 'https://cdn.cliqz.com/anti-tracking/tracker_owners_list.json',
        cron: 24 * 60 * 60 * 1000
      }), parseDomainOwners);

      _export('default', domainInfo);
    }
  };
});