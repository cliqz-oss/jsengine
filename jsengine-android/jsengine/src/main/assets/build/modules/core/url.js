System.register('core/url', [], function (_export) {
  /*
  strip protocol from url
  */
  'use strict';

  _export('urlStripProtocol', urlStripProtocol);

  function urlStripProtocol(url) {
    var resultUrl = url;
    var toRemove = ['https://', 'http://', 'www2.', 'www.', 'mobile.', 'mobil.', 'm.'];
    toRemove.forEach(function (part) {
      if (resultUrl.toLowerCase().startsWith(part)) {
        resultUrl = resultUrl.substring(part.length);
      }
    });
    // remove trailing slash as well to have all urls in the same format
    if (resultUrl[resultUrl.length - 1] === '/') {
      resultUrl = resultUrl.slice(0, -1);
    }
    return resultUrl;
  }

  return {
    setters: [],
    execute: function () {}
  };
});