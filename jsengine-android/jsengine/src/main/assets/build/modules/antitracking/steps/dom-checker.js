System.register('antitracking/steps/dom-checker', ['antitracking/pacemaker', 'core/background', 'antitracking/url'], function (_export) {
  'use strict';

  var pacemaker, core, dURIC, DOM_CHECK_PERIOD, _default;

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

  function isTabURL(url) {
    var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);
    var browserEnumerator = wm.getEnumerator("navigator:browser");

    while (browserEnumerator.hasMoreElements()) {
      var browserWin = browserEnumerator.getNext();
      var tabbrowser = browserWin.gBrowser;

      var numTabs = tabbrowser.browsers.length;
      for (var index = 0; index < numTabs; index++) {
        var currentBrowser = tabbrowser.getBrowserAtIndex(index);
        if (currentBrowser) {
          var tabURL = currentBrowser.currentURI.spec;
          if (url == tabURL || url == tabURL.split('#')[0]) {
            return true;
          }
        }
      }
    }
    return false;
  }

  // from CliqzAttrack.getCookieValues
  function getCookieValues(c, url) {
    if (c == null) {
      return {};
    }
    var v = 0,
        cookies = {};
    if (c.match(/^\s*\$Version=(?:"1"|1);\s*(.*)/)) {
      c = RegExp.$1;
      v = 1;
    }
    if (v === 0) {
      c.split(/[,;]/).map(function (cookie) {
        var parts = cookie.split(/=/);
        if (parts.length > 1) parts[1] = parts.slice(1).join('=');
        var name = dURIC(parts[0].trimLeft()),
            value = parts.length > 1 ? dURIC(parts[1].trimRight()) : null;
        cookies[name] = value;
      });
    } else {
      c.match(/(?:^|\s+)([!#$%&'*+\-.0-9A-Z^`a-z|~]+)=([!#$%&'*+\-.0-9A-Z^`a-z|~]*|"(?:[\x20-\x7E\x80\xFF]|\\[\x00-\x7F])*")(?=\s*[,;]|$)/g).map(function ($0, $1) {
        var name = $0,
            value = $1.charAt(0) === '"' ? $1.substr(1, -1).replace(/\\(.)/g, "$1") : $1;
        cookies[name] = value;
      });
    }
    // return cookies;
    var cookieVal = {};
    for (var key in cookies) {
      if (url.indexOf(cookies[key]) == -1) {
        // cookies save as part of the url is allowed
        cookieVal[cookies[key]] = true;
      }
    }
    return cookieVal;
  }

  return {
    setters: [function (_antitrackingPacemaker) {
      pacemaker = _antitrackingPacemaker['default'];
    }, function (_coreBackground) {
      core = _coreBackground['default'];
    }, function (_antitrackingUrl) {
      dURIC = _antitrackingUrl.dURIC;
    }],
    execute: function () {
      DOM_CHECK_PERIOD = 1000;

      _default = (function () {
        function _default() {
          _classCallCheck(this, _default);

          this.loadedTabs = {};
          this.linksRecorded = {}; // cache when we recorded links for each url
          this.linksFromDom = {};
          this.cookiesFromDom = {};
        }

        _createClass(_default, [{
          key: 'init',
          value: function init() {
            this._pmTask = pacemaker.register((function cleanCaches(currTime) {
              var cacheObj = this.linksRecorded;
              var timeout = 1000;
              var keys = Object.keys(cacheObj);
              keys.forEach(function (k) {
                if (currTime - cacheObj[k] || 0 > timeout) {
                  delete cacheObj[k];
                }
              });
            }).bind(this), 2 * 60 * 1000);
          }
        }, {
          key: 'unload',
          value: function unload() {
            pacemaker.deregister(this._pmTask);
          }
        }, {
          key: 'checkDomLinks',
          value: function checkDomLinks(state) {
            this.recordLinksForURL(state.sourceUrl);

            // check if this url appears in the source's links
            var reflinks = this.linksFromDom[state.sourceUrl] || {};
            if (state.incrementStat && state.url in reflinks) {
              state.incrementStat('url_in_reflinks');
            }
            return true;
          }
        }, {
          key: 'parseCookies',
          value: function parseCookies(state) {
            var sourceUrl = state.sourceUrl;
            var cookievalue = {};
            // parse cookies from DOM
            if (this.cookiesFromDom[sourceUrl]) {
              cookievalue = getCookieValues(this.cookiesFromDom[sourceUrl], state.url);
            }
            // merge with cookies in the header of this request
            try {
              for (var c in getCookieValues(state.requestContext.getRequestHeader('Cookie'), state.url)) {
                cookievalue[c] = true;
              }
            } catch (e) {}
            state.cookieValues = cookievalue;

            return true;
          }
        }, {
          key: 'recordLinksForURL',
          value: function recordLinksForURL(url) {
            var self = this;
            if (this.loadedTabs[url]) {
              return;
            }
            var now = Date.now();
            var lastQuery = this.linksRecorded[url] || 0;
            if (now - lastQuery < DOM_CHECK_PERIOD) {
              return;
            }
            this.linksRecorded[url] = now;
            return Promise.all([core.actions.getCookie(url).then(function (cookie) {
              return self.cookiesFromDom[url] = cookie;
            }), Promise.all([core.actions.queryHTML(url, 'a[href]', 'href'), core.actions.queryHTML(url, 'link[href]', 'href'), core.actions.queryHTML(url, 'script[src]', 'src').then(function (hrefs) {
              return hrefs.filter(function (href) {
                return href.indexOf('http') === 0;
              });
            })]).then(function (reflinks) {
              var hrefSet = reflinks.reduce(function (hrefSet, hrefs) {
                hrefs.forEach(function (href) {
                  return hrefSet[href] = true;
                });
                return hrefSet;
              }, {});

              self.linksFromDom[url] = hrefSet;
            })]);
          }
        }, {
          key: 'onTabLocationChange',
          value: function onTabLocationChange(evnt) {
            var _this = this;

            var url = evnt.url;

            this.linksFromDom[url] = {};

            if (evnt.isLoadingDocument) {
              // when a new page is loaded, try to extract internal links and cookies
              var doc = evnt.document;
              this.loadedTabs[url] = false;

              if (doc) {
                if (doc.body) {
                  this.recordLinksForURL(url);
                }
                doc.addEventListener('DOMContentLoaded', function (ev) {
                  _this.loadedTabs[url] = true;
                  _this.recordLinksForURL(url);
                });
                this.clearDomLinks();
              }
            }
          }
        }, {
          key: 'clearDomLinks',
          value: function clearDomLinks() {
            for (var url in this.linksFromDom) {
              if (!isTabURL(url)) {
                delete this.linksFromDom[url];
                delete this.cookiesFromDom[url];
                delete this.loadedTabs[url];
              }
            }
          }
        }]);

        return _default;
      })();

      _export('default', _default);
    }
  };
});