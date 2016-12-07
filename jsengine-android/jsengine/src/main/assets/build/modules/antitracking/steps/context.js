System.register('antitracking/steps/context', ['antitracking/webrequest-context', 'antitracking/url', 'antitracking/domain'], function (_export) {
  'use strict';

  var HttpRequestContext, parseURL, dURIC, getHeaderMD5, URLInfo, getGeneralDomain, sameGeneralDomain, internalProtocols;

  _export('determineContext', determineContext);

  _export('skipInternalProtocols', skipInternalProtocols);

  _export('checkSameGeneralDomain', checkSameGeneralDomain);

  function determineContext(state) {
    var requestContext = new HttpRequestContext(state);
    var url = requestContext.url;
    // stop if no valid url
    if (!url || url == '') return false;

    var urlParts = URLInfo.get(url);

    state.requestContext = requestContext;
    state.url = url;
    state.urlParts = urlParts;

    var sourceUrl = requestContext.getSourceURL();
    state.sourceUrl = sourceUrl;
    state.sourceUrlParts = URLInfo.get(sourceUrl);

    if (!sourceUrl) return false;

    return true;
  }

  function skipInternalProtocols(state) {
    if (state.sourceUrlParts && internalProtocols.has(state.sourceUrlParts.protocol)) {
      return false;
    }
    if (state.urlParts && internalProtocols.has(state.urlParts.protocol)) {
      return false;
    }
    return true;
  }

  function checkSameGeneralDomain(state) {
    return !sameGeneralDomain(state.urlParts.hostname, state.sourceUrlParts.hostname);
  }

  return {
    setters: [function (_antitrackingWebrequestContext) {
      HttpRequestContext = _antitrackingWebrequestContext['default'];
    }, function (_antitrackingUrl) {
      parseURL = _antitrackingUrl.parseURL;
      dURIC = _antitrackingUrl.dURIC;
      getHeaderMD5 = _antitrackingUrl.getHeaderMD5;
      URLInfo = _antitrackingUrl.URLInfo;
    }, function (_antitrackingDomain) {
      getGeneralDomain = _antitrackingDomain.getGeneralDomain;
      sameGeneralDomain = _antitrackingDomain.sameGeneralDomain;
    }],
    execute: function () {
      internalProtocols = new Set(['chrome', 'resource']);
    }
  };
});