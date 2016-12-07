System.register('antitracking/attrack', ['antitracking/pacemaker', 'antitracking/persistent-state', 'antitracking/temp-set', 'antitracking/tp_events', 'antitracking/md5', 'antitracking/url', 'antitracking/domain', 'antitracking/hash', 'antitracking/tracker-txt', 'antitracking/bloom-filter', 'antitracking/time', 'antitracking/qs-whitelists', 'antitracking/block-log', 'core/cliqz', 'core/resource-loader', 'antitracking/utils', 'platform/browser', 'core/webrequest', 'antitracking/telemetry', 'core/console', 'antitracking/steps/context', 'antitracking/steps/page-logger', 'antitracking/steps/token-examiner', 'antitracking/steps/token-telemetry', 'antitracking/steps/dom-checker', 'antitracking/steps/token-checker', 'antitracking/steps/block-rules', 'antitracking/steps/cookie-context', 'antitracking/steps/tracker-proxy'], function (_export) {
  /*
   * This module prevents user from 3rd party tracking
   */

  // lots of code still relies on this global
  'use strict';

  var pacemaker, persist, TempSet, PageEventTracker, md5, URLInfo, shuffle, getGeneralDomain, HashProb, TrackerTXT, getDefaultTrackerTxtRule, AttrackBloomFilter, datetime, QSWhitelist, BlockLog, utils, events, ResourceLoader, compressionAvailable, compressJSONToBase64, generatePayload, browser, WebRequest, _telemetry, console, determineContext, skipInternalProtocols, checkSameGeneralDomain, PageLogger, TokenExaminer, TokenTelemetry, DomChecker, TokenChecker, BlockRules, CookieContext, TrackerProxy, CliqzUtils, CliqzAttrack;

  function queryHTML() {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    return utils.callAction('core', 'queryHTML', args);
  }

  function getCookie() {
    for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      args[_key2] = arguments[_key2];
    }

    return utils.callAction('core', 'getCookie', args);
  }

  return {
    setters: [function (_antitrackingPacemaker) {
      pacemaker = _antitrackingPacemaker['default'];
    }, function (_antitrackingPersistentState) {
      persist = _antitrackingPersistentState;
    }, function (_antitrackingTempSet) {
      TempSet = _antitrackingTempSet['default'];
    }, function (_antitrackingTp_events) {
      PageEventTracker = _antitrackingTp_events['default'];
    }, function (_antitrackingMd5) {
      md5 = _antitrackingMd5['default'];
    }, function (_antitrackingUrl) {
      URLInfo = _antitrackingUrl.URLInfo;
      shuffle = _antitrackingUrl.shuffle;
    }, function (_antitrackingDomain) {
      getGeneralDomain = _antitrackingDomain.getGeneralDomain;
    }, function (_antitrackingHash) {
      HashProb = _antitrackingHash.HashProb;
    }, function (_antitrackingTrackerTxt) {
      TrackerTXT = _antitrackingTrackerTxt.TrackerTXT;
      getDefaultTrackerTxtRule = _antitrackingTrackerTxt.getDefaultTrackerTxtRule;
    }, function (_antitrackingBloomFilter) {
      AttrackBloomFilter = _antitrackingBloomFilter.AttrackBloomFilter;
    }, function (_antitrackingTime) {
      datetime = _antitrackingTime;
    }, function (_antitrackingQsWhitelists) {
      QSWhitelist = _antitrackingQsWhitelists['default'];
    }, function (_antitrackingBlockLog) {
      BlockLog = _antitrackingBlockLog['default'];
    }, function (_coreCliqz) {
      utils = _coreCliqz.utils;
      events = _coreCliqz.events;
    }, function (_coreResourceLoader) {
      ResourceLoader = _coreResourceLoader['default'];
    }, function (_antitrackingUtils) {
      compressionAvailable = _antitrackingUtils.compressionAvailable;
      compressJSONToBase64 = _antitrackingUtils.compressJSONToBase64;
      generatePayload = _antitrackingUtils.generatePayload;
    }, function (_platformBrowser) {
      browser = _platformBrowser;
    }, function (_coreWebrequest) {
      WebRequest = _coreWebrequest['default'];
    }, function (_antitrackingTelemetry) {
      _telemetry = _antitrackingTelemetry['default'];
    }, function (_coreConsole) {
      console = _coreConsole['default'];
    }, function (_antitrackingStepsContext) {
      determineContext = _antitrackingStepsContext.determineContext;
      skipInternalProtocols = _antitrackingStepsContext.skipInternalProtocols;
      checkSameGeneralDomain = _antitrackingStepsContext.checkSameGeneralDomain;
    }, function (_antitrackingStepsPageLogger) {
      PageLogger = _antitrackingStepsPageLogger['default'];
    }, function (_antitrackingStepsTokenExaminer) {
      TokenExaminer = _antitrackingStepsTokenExaminer['default'];
    }, function (_antitrackingStepsTokenTelemetry) {
      TokenTelemetry = _antitrackingStepsTokenTelemetry['default'];
    }, function (_antitrackingStepsDomChecker) {
      DomChecker = _antitrackingStepsDomChecker['default'];
    }, function (_antitrackingStepsTokenChecker) {
      TokenChecker = _antitrackingStepsTokenChecker['default'];
    }, function (_antitrackingStepsBlockRules) {
      BlockRules = _antitrackingStepsBlockRules['default'];
    }, function (_antitrackingStepsCookieContext) {
      CookieContext = _antitrackingStepsCookieContext['default'];
    }, function (_antitrackingStepsTrackerProxy) {
      TrackerProxy = _antitrackingStepsTrackerProxy['default'];
    }],
    execute: function () {
      CliqzUtils = utils;
      CliqzAttrack = {
        VERSION: '0.97',
        MIN_BROWSER_VERSION: 35,
        LOG_KEY: 'attrack',
        VERSIONCHECK_URL: 'https://cdn.cliqz.com/anti-tracking/whitelist/versioncheck.json',
        URL_ALERT_RULES: 'chrome://cliqz/content/anti-tracking-rules.json',
        URL_BLOCK_RULES: 'https://cdn.cliqz.com/anti-tracking/whitelist/anti-tracking-block-rules.json',
        ENABLE_PREF: 'modules.antitracking.enabled',
        debug: false,
        msgType: 'attrack',
        whitelist: null,
        similarAddon: false,
        tokenDomainCountThreshold: 2,
        safeKeyExpire: 7,
        localBlockExpire: 24,
        shortTokenLength: 8,
        safekeyValuesThreshold: 4,
        placeHolder: '',
        tp_events: null,
        recentlyModified: new TempSet(),
        cliqzHeader: 'CLIQZ-AntiTracking',
        obfuscate: function obfuscate(s, method) {
          // used when action != 'block'
          // default is a placeholder
          switch (method) {
            case 'empty':
              return '';
            case 'replace':
              return shuffle(s);
            case 'same':
              return s;
            case 'placeholder':
              return CliqzAttrack.placeHolder;
            default:
              return CliqzAttrack.placeHolder;
          }
        },
        visitCache: {},
        getBrowserMajorVersion: function getBrowserMajorVersion() {
          try {
            var appInfo = Components.classes["@mozilla.org/xre/app-info;1"].getService(Components.interfaces.nsIXULAppInfo);
            return parseInt(appInfo.version.split('.')[0]);
          } catch (e) {
            // fallback for when no version API
            return 100;
          }
        },
        getPrivateValues: function getPrivateValues(window) {
          // creates a list of return values of functions may leak private info
          var p = {};
          // var navigator = CliqzUtils.getWindow().navigator;
          var navigator = window.navigator;
          // plugins
          for (var i = 0; i < navigator.plugins.length; i++) {
            var name = navigator.plugins[i].name;
            if (name.length >= 8) {
              p[name] = true;
            }
          }
          CliqzAttrack.privateValues = p;
        },
        executePipeline: function executePipeline(pipeline, initialState, logKey) {
          var state = initialState;
          var response = {};
          var i = 0;
          for (; i < pipeline.length; i++) {
            try {
              var cont = pipeline[i](state, response);
              if (!cont) {
                break;
              }
            } catch (e) {
              console.error(logKey, state.url, 'Step exception', e);
              break;
            }
          }
          if (CliqzAttrack.debug) {
            console.log(logKey, state.url, 'Break at', (pipeline[i] || { name: "end" }).name);
          }
          // annotate who made this response
          if (Object.keys(response).length > 0) {
            response.source = logKey;
          }
          return response;
        },
        httpopenObserver: function httpopenObserver(requestDetails) {
          return CliqzAttrack.executePipeline(CliqzAttrack.onOpenPipeline, requestDetails, 'ATTRACK.OPEN');
        },
        httpResponseObserver: function httpResponseObserver(requestDetails) {
          return CliqzAttrack.executePipeline(CliqzAttrack.responsePipeline, requestDetails, 'ATTRACK.RESP');
        },
        httpmodObserver: function httpmodObserver(requestDetails) {
          return CliqzAttrack.executePipeline(CliqzAttrack.onModifyPipeline, requestDetails, 'ATTRACK.MOD');
        },
        onTabLocationChange: function onTabLocationChange(evnt) {
          if (CliqzAttrack.pipelineSteps.domChecker) {
            CliqzAttrack.pipelineSteps.domChecker.onTabLocationChange(evnt);
          }
        },
        getDefaultRule: function getDefaultRule() {
          if (CliqzAttrack.isForceBlockEnabled()) {
            return 'block';
          } else {
            return getDefaultTrackerTxtRule();
          }
        },
        isEnabled: function isEnabled() {
          return CliqzUtils.getPref(CliqzAttrack.ENABLE_PREF, false);
        },
        isCookieEnabled: function isCookieEnabled(source_hostname) {
          if (source_hostname != undefined && CliqzAttrack.isSourceWhitelisted(source_hostname)) {
            return false;
          }
          return CliqzUtils.getPref('attrackBlockCookieTracking', true);
        },
        isQSEnabled: function isQSEnabled() {
          return CliqzUtils.getPref('attrackRemoveQueryStringTracking', true);
        },
        isFingerprintingEnabled: function isFingerprintingEnabled() {
          return CliqzUtils.getPref('attrackCanvasFingerprintTracking', false);
        },
        isReferrerEnabled: function isReferrerEnabled() {
          return CliqzUtils.getPref('attrackRefererTracking', false);
        },
        isTrackerTxtEnabled: function isTrackerTxtEnabled() {
          return CliqzUtils.getPref('trackerTxt', false);
        },
        isBloomFilterEnabled: function isBloomFilterEnabled() {
          return CliqzUtils.getPref('attrackBloomFilter', false);
        },
        isForceBlockEnabled: function isForceBlockEnabled() {
          return CliqzUtils.getPref('attrackForceBlock', false);
        },
        initPacemaker: function initPacemaker() {
          var two_mins = 2 * 60 * 1000;

          // create a constraint which returns true when the time changes at the specified fidelity
          function timeChangeConstraint(name, fidelity) {
            if (fidelity == "day") fidelity = 8;else if (fidelity == "hour") fidelity = 10;
            return function (task) {
              var timestamp = datetime.getTime().slice(0, fidelity),
                  lastHour = persist.getValue(name + "lastRun") || timestamp;
              persist.setValue(name + "lastRun", timestamp);
              return timestamp != lastHour;
            };
          }

          pacemaker.register(CliqzAttrack.updateConfig, 3 * 60 * 60 * 1000);

          // if the hour has changed
          pacemaker.register(CliqzAttrack.hourChanged, two_mins, timeChangeConstraint("hourChanged", "hour"));

          pacemaker.register(function tp_event_commit() {
            CliqzAttrack.tp_events.commit();
            CliqzAttrack.tp_events.push();
          }, two_mins);
        },
        telemetry: function telemetry(_ref) {
          var message = _ref.message;
          var _ref$raw = _ref.raw;
          var raw = _ref$raw === undefined ? false : _ref$raw;
          var _ref$compress = _ref.compress;
          var compress = _ref$compress === undefined ? false : _ref$compress;
          var _ref$ts = _ref.ts;
          var ts = _ref$ts === undefined ? undefined : _ref$ts;

          if (!message.type) {
            message.type = _telemetry.msgType;
          }
          if (raw !== true) {
            message.payload = CliqzAttrack.generateAttrackPayload(message.payload, ts);
          }
          if (compress === true && compressionAvailable()) {
            message.compressed = true;
            message.payload = compressJSONToBase64(message.payload);
          }
          _telemetry.telemetry(message);
        },
        /** Global module initialisation.
         */
        init: function init() {
          // disable for older browsers
          if (CliqzAttrack.getBrowserMajorVersion() < CliqzAttrack.MIN_BROWSER_VERSION) {
            return;
          }

          // Replace getWindow functions with window object used in init.
          if (CliqzAttrack.debug) CliqzUtils.log("Init function called:", CliqzAttrack.LOG_KEY);

          if (!CliqzAttrack.hashProb) {
            CliqzAttrack.hashProb = new HashProb();
          }

          // load all caches:
          // Large dynamic caches are loaded via the persist module, which will lazily propegate changes back
          // to the browser's sqlite database.
          // Large static caches (e.g. token whitelist) are loaded from sqlite
          // Smaller caches (e.g. update timestamps) are kept in prefs

          CliqzAttrack.qs_whitelist = CliqzAttrack.isBloomFilterEnabled() ? new AttrackBloomFilter() : new QSWhitelist();
          var initPromises = [];
          initPromises.push(CliqzAttrack.qs_whitelist.init());
          CliqzAttrack.blockLog = new BlockLog(CliqzAttrack.qs_whitelist, CliqzAttrack.telemetry);
          CliqzAttrack.blockLog.init();

          // force clean requestKeyValue
          events.sub("attrack:safekeys_updated", function (version, forceClean) {
            if (forceClean && CliqzAttrack.pipelineSteps.tokenExaminer) {
              CliqzAttrack.pipelineSteps.tokenExaminer.clearCache();
            }
          });

          // load tracker companies data
          this._trackerLoader = new ResourceLoader(['antitracking', 'tracker_owners.json'], {
            remoteURL: 'https://cdn.cliqz.com/anti-tracking/tracker_owners_list.json',
            cron: 24 * 60 * 60 * 1000
          });
          this._trackerLoader.load().then(CliqzAttrack._parseTrackerCompanies);
          this._trackerLoader.onUpdate(CliqzAttrack._parseTrackerCompanies);

          // load cookie whitelist
          this._cookieWhitelistLoader = new ResourceLoader(['antitracking', 'cookie_whitelist.json'], {
            remoteURL: 'https://cdn.cliqz.com/anti-tracking/whitelist/cookie_whitelist.json',
            cron: 24 * 60 * 60 * 1000
          });
          var updateCookieWhitelist = function updateCookieWhitelist(data) {
            CliqzAttrack.whitelist = data;
          };
          this._cookieWhitelistLoader.load().then(updateCookieWhitelist);
          this._cookieWhitelistLoader.onUpdate(updateCookieWhitelist);

          CliqzAttrack.checkInstalledAddons();

          CliqzAttrack.initPacemaker();
          pacemaker.start();

          WebRequest.onBeforeRequest.addListener(CliqzAttrack.httpopenObserver, undefined, ['blocking', 'requestHeaders']);
          WebRequest.onBeforeSendHeaders.addListener(CliqzAttrack.httpmodObserver, undefined, ['blocking', 'requestHeaders']);
          WebRequest.onHeadersReceived.addListener(CliqzAttrack.httpResponseObserver, undefined, ['responseHeaders']);

          try {
            CliqzAttrack.disabled_sites = new Set(JSON.parse(CliqzUtils.getPref(CliqzAttrack.DISABLED_SITES_PREF, "[]")));
          } catch (e) {
            CliqzAttrack.disabled_sites = new Set();
          }

          // note: if a 0 value were to be saved, the default would be preferred. This is ok because these options
          // cannot have 0 values.
          CliqzAttrack.safekeyValuesThreshold = parseInt(persist.getValue('safekeyValuesThreshold')) || 4;
          CliqzAttrack.shortTokenLength = parseInt(persist.getValue('shortTokenLength')) || 8;

          CliqzAttrack.placeHolder = persist.getValue('placeHolder', CliqzAttrack.placeHolder);
          CliqzAttrack.cliqzHeader = persist.getValue('cliqzHeader', CliqzAttrack.cliqzHeader);

          CliqzAttrack.tp_events = new PageEventTracker(function (payloadData) {
            // take telemetry data to be pushed and add module metadata
            var enabled = {
              'qs': CliqzAttrack.isQSEnabled(),
              'cookie': CliqzAttrack.isCookieEnabled(),
              'bloomFilter': CliqzAttrack.isBloomFilterEnabled(),
              'trackTxt': CliqzAttrack.isTrackerTxtEnabled(),
              'forceBlock': CliqzAttrack.isForceBlockEnabled()
            };
            var updateInTime = CliqzAttrack.qs_whitelist.isUpToDate();
            payloadData.forEach(function (pageload) {
              var payl = {
                'data': [pageload],
                'ver': CliqzAttrack.VERSION,
                'conf': enabled,
                'addons': CliqzAttrack.similarAddon,
                'updateInTime': updateInTime
              };
              CliqzAttrack.telemetry({
                message: { 'type': _telemetry.msgType, 'action': 'attrack.tp_events', 'payload': payl },
                raw: true
              });
            });
          });

          CliqzAttrack.initPipeline();

          return Promise.all(initPromises);
        },
        initPipeline: function initPipeline() {
          CliqzAttrack.unloadPipeline();

          // initialise classes which are used as steps in listeners
          var steps = {
            pageLogger: new PageLogger(CliqzAttrack.tp_events, CliqzAttrack.blockLog),
            tokenExaminer: new TokenExaminer(CliqzAttrack.qs_whitelist, CliqzAttrack.shortTokenLength, CliqzAttrack.safekeyValuesThreshold, CliqzAttrack.safeKeyExpire),
            tokenTelemetry: new TokenTelemetry(CliqzAttrack.telemetry),
            domChecker: new DomChecker(),
            tokenChecker: new TokenChecker(CliqzAttrack.qs_whitelist, CliqzAttrack.blockLog, CliqzAttrack.tokenDomainCountThreshold, CliqzAttrack.shortTokenLength, {}, CliqzAttrack.hashProb),
            blockRules: new BlockRules(),
            cookieContext: new CookieContext(),
            trackerProxy: new TrackerProxy()
          };
          CliqzAttrack.pipelineSteps = steps;

          // initialise step objects
          Object.keys(steps).forEach(function (key) {
            var step = steps[key];
            if (step.init) {
              step.init();
            }
          });

          // create pipeline for on open request
          CliqzAttrack.onOpenPipeline = [CliqzAttrack.qs_whitelist.isReady.bind(CliqzAttrack.qs_whitelist), determineContext, steps.pageLogger.checkIsMainDocument.bind(steps.pageLogger), skipInternalProtocols, checkSameGeneralDomain, CliqzAttrack.cancelRecentlyModified.bind(CliqzAttrack), steps.tokenExaminer.examineTokens.bind(steps.tokenExaminer), steps.tokenTelemetry.extractKeyTokens.bind(steps.tokenTelemetry), steps.pageLogger.attachStatCounter.bind(steps.pageLogger), steps.pageLogger.logRequestMetadata.bind(steps.pageLogger), steps.domChecker.checkDomLinks.bind(steps.domChecker), steps.domChecker.parseCookies.bind(steps.domChecker), steps.tokenChecker.findBadTokens.bind(steps.tokenChecker), steps.trackerProxy.checkShouldProxy.bind(steps.trackerProxy), function checkHasBadTokens(state) {
            return state.badTokens.length > 0;
          }, steps.blockRules.applyBlockRules.bind(steps.blockRules), CliqzAttrack.isQSEnabled.bind(CliqzAttrack), function checkSourceWhitelisted(state) {
            if (CliqzAttrack.isSourceWhitelisted(state.sourceUrlParts.hostname)) {
              state.incrementStat('source_whitelisted');
              return false;
            }
            return true;
          }, function checkShouldBlock(state) {
            return state.badTokens.length > 0 && CliqzAttrack.qs_whitelist.isUpToDate();
          }, CliqzAttrack.applyBlock.bind(CliqzAttrack)];

          // create pipeline for on modify request
          CliqzAttrack.onModifyPipeline = [determineContext, function checkIsMainDocument(state) {
            return !state.requestContext.isFullPage();
          }, skipInternalProtocols, checkSameGeneralDomain, steps.pageLogger.attachStatCounter.bind(steps.pageLogger), function catchMissedOpenListener(state, response) {
            if (state.reqLog && state.reqLog.c === 0) {
              (function () {
                // take output from httpopenObserver and copy into our response object
                var openResponse = CliqzAttrack.httpopenObserver(state) || {};
                Object.keys(openResponse).forEach(function (k) {
                  response[k] = openResponse[k];
                });
              })();
            }
            return true;
          }, function overrideUserAgent(state, response) {
            if (utils.getPref('attrackOverrideUserAgent', false) === true) {
              var domainHash = md5(getGeneralDomain(state.urlParts.hostname)).substring(0, 16);
              if (CliqzAttrack.qs_whitelist.isTrackerDomain(domainHash)) {
                response.requestHeaders = response.requestHeaders || [];
                response.requestHeaders.push({ name: 'User-Agent', value: 'CLIQZ' });
                state.incrementStat('override_user_agent');
              }
            }
            return true;
          }, function checkHasCookie(state) {
            state.cookieData = state.requestContext.getCookieData();
            if (state.cookieData && state.cookieData.length > 5) {
              state.incrementStat('cookie_set');
              return true;
            } else {
              return false;
            }
          }, CliqzAttrack.checkIsCookieWhitelisted.bind(CliqzAttrack), steps.cookieContext.checkVisitCache.bind(steps.cookieContext), steps.cookieContext.checkContextFromEvent.bind(steps.cookieContext), function shouldBlockCookie(state) {
            var shouldBlock = CliqzAttrack.isCookieEnabled(state.sourceUrlParts.hostname);
            if (!shouldBlock) {
              state.incrementStat('bad_cookie_sent');
            }
            return shouldBlock;
          }, function blockCookie(state, response) {
            state.incrementStat('cookie_blocked');
            state.incrementStat('cookie_block_tp1');
            response.requestHeaders = response.requestHeaders || [];
            response.requestHeaders.push({ name: 'Cookie', value: '' });
            response.requestHeaders.push({ name: CliqzAttrack.cliqzHeader, value: ' ' });
            return true;
          }];

          // create pipeline for on response received
          CliqzAttrack.responsePipeline = [CliqzAttrack.qs_whitelist.isReady.bind(CliqzAttrack.qs_whitelist), determineContext, function checkMainDocumentRedirects(state) {
            if (state.requestContext.isFullPage()) {
              if ([300, 301, 302, 303, 307].indexOf(state.requestContext.channel.responseStatus) >= 0) {
                // redirect, update location for tab
                // if no redirect location set, stage the tab id so we don't get false data
                var redirect_url = state.requestContext.getResponseHeader("Location");
                var redirect_url_parts = URLInfo.get(redirect_url);
                // if redirect is relative, use source domain
                if (!redirect_url_parts.hostname) {
                  redirect_url_parts.hostname = state.urlParts.hostname;
                  redirect_url_parts.path = redirect_url;
                }
                CliqzAttrack.tp_events.onRedirect(redirect_url_parts, state.requestContext.getOuterWindowID(), state.requestContext.isChannelPrivate());
              }
              return false;
            }
            return true;
          }, skipInternalProtocols, function skipBadSource(state) {
            return state.sourceUrl !== '' && state.sourceUrl.indexOf('about:') === -1;
          }, checkSameGeneralDomain, steps.pageLogger.attachStatCounter.bind(steps.pageLogger), function logResponseStats(state) {
            if (state.incrementStat) {
              state.incrementStat('resp_ob');
              state.incrementStat('content_length', parseInt(state.requestContext.getResponseHeader('Content-Length')) || 0);
              state.incrementStat('status_' + state.requestContext.channel.responseStatus);
              state.incrementStat(state.requestContext.isCached ? 'cached' : 'not_cached');
            }
            return true;
          }, function checkSetCookie(state) {
            // if there is a set-cookie header, continue
            var setCookie = state.requestContext.getResponseHeader("Set-Cookie");
            if (setCookie) {
              state.incrementStat('set_cookie_set');
              return true;
            }
            return false;
          }, function shouldBlockCookie(state) {
            return CliqzAttrack.isCookieEnabled(state.sourceUrlParts.hostname);
          }, CliqzAttrack.checkIsCookieWhitelisted.bind(CliqzAttrack), steps.cookieContext.checkVisitCache.bind(steps.cookieContext), steps.cookieContext.checkContextFromEvent.bind(steps.cookieContext), function blockSetCookie(state, response) {
            response.responseHeaders = [{ name: 'Set-Cookie', value: '' }];
            state.incrementStat('set_cookie_blocked');
            return true;
          }];
        },
        unloadPipeline: function unloadPipeline() {
          Object.keys(CliqzAttrack.pipelineSteps || {}).forEach(function (key) {
            var step = CliqzAttrack.pipelineSteps[key];
            if (step.unload) {
              step.unload();
            }
          });
          CliqzAttrack.pipelineSteps = {};
        },
        /** Per-window module initialisation
         */
        initWindow: function initWindow(window) {
          if (CliqzAttrack.getBrowserMajorVersion() < CliqzAttrack.MIN_BROWSER_VERSION) {
            return;
          }
          CliqzAttrack.getPrivateValues(window);
        },
        unload: function unload() {
          // don't need to unload if disabled
          if (CliqzAttrack.getBrowserMajorVersion() < CliqzAttrack.MIN_BROWSER_VERSION) {
            return;
          }
          //Check is active usage, was sent

          // force send tab telemetry data
          CliqzAttrack.tp_events.commit(true, true);
          CliqzAttrack.tp_events.push(true);

          CliqzAttrack.blockLog.destroy();
          CliqzAttrack.qs_whitelist.destroy();

          WebRequest.onBeforeRequest.removeListener(CliqzAttrack.httpopenObserver);
          WebRequest.onBeforeSendHeaders.removeListener(CliqzAttrack.httpmodObserver);
          WebRequest.onHeadersReceived.removeListener(CliqzAttrack.httpResponseObserver);

          pacemaker.stop();

          this._trackerLoader.stop();
          this._cookieWhitelistLoader.stop();

          CliqzAttrack.unloadPipeline();

          events.clean_channel("attrack:safekeys_updated");
        },
        checkInstalledAddons: function checkInstalledAddons() {
          System['import']('platform/antitracking/addon-check').then(function (addons) {
            CliqzAttrack.similarAddon = addons.checkInstalledAddons();
          })['catch'](function (e) {
            utils.log("Error loading addon checker", "attrack");
          });
        },
        generateAttrackPayload: function generateAttrackPayload(data, ts) {
          var extraAttrs = CliqzAttrack.qs_whitelist.getVersion();
          extraAttrs.ver = CliqzAttrack.VERSION;
          ts = ts || datetime.getHourTimestamp();
          return generatePayload(data, ts, false, extraAttrs);
        },
        hourChanged: function hourChanged() {
          // trigger other hourly events
          events.pub("attrack:hour_changed");
        },
        updateConfig: function updateConfig() {
          var today = datetime.getTime().substring(0, 10);
          utils.httpGet(CliqzAttrack.VERSIONCHECK_URL + "?" + today, function (req) {
            // on load
            var versioncheck = JSON.parse(req.response);
            var requiresReload = parseInt(versioncheck.shortTokenLength) !== CliqzAttrack.shortTokenLength || parseInt(versioncheck.safekeyValuesThreshold) !== CliqzAttrack.safekeyValuesThreshold;

            // config in versioncheck
            if (versioncheck.placeHolder) {
              persist.setValue('placeHolder', versioncheck.placeHolder);
              CliqzAttrack.placeHolder = versioncheck.placeHolder;
            }

            if (versioncheck.shortTokenLength) {
              persist.setValue('shortTokenLength', versioncheck.shortTokenLength);
              CliqzAttrack.shortTokenLength = parseInt(versioncheck.shortTokenLength) || CliqzAttrack.shortTokenLength;
            }

            if (versioncheck.safekeyValuesThreshold) {
              persist.setValue('safekeyValuesThreshold', versioncheck.safekeyValuesThreshold);
              CliqzAttrack.safekeyValuesThreshold = parseInt(versioncheck.safekeyValuesThreshold) || CliqzAttrack.safekeyValuesThreshold;
            }

            if (versioncheck.cliqzHeader) {
              persist.setValue('cliqzHeader', versioncheck.cliqzHeader);
              CliqzAttrack.cliqzHeader = versioncheck.cliqzHeader;
            }

            // refresh pipeline if config changed
            if (requiresReload) {
              CliqzAttrack.initPipeline();
            }
            // fire events for list update
            events.pub("attrack:updated_config", versioncheck);
          }, utils.log, 10000);
        },
        isInWhitelist: function isInWhitelist(domain) {
          if (!CliqzAttrack.whitelist) return false;
          var keys = CliqzAttrack.whitelist;
          for (var i = 0; i < keys.length; i++) {
            var ind = domain.indexOf(keys[i]);
            if (ind >= 0) {
              if (ind + keys[i].length == domain.length) return true;
            }
          }
          return false;
        },
        cancelRecentlyModified: function cancelRecentlyModified(state, response) {
          var sourceTab = state.requestContext.getOriginWindowID();
          var url = state.url;
          if (CliqzAttrack.recentlyModified.contains(sourceTab + url)) {
            CliqzAttrack.recentlyModified['delete'](sourceTab + url);
            response.cancel = true;
            return false;
          }
          return true;
        },
        applyBlock: function applyBlock(state, response) {
          var badTokens = state.badTokens;
          var rule = CliqzAttrack.getDefaultRule(),
              _trackerTxt = TrackerTXT.get(state.sourceUrlParts);
          if (!CliqzAttrack.isForceBlockEnabled() && CliqzAttrack.isTrackerTxtEnabled()) {
            if (_trackerTxt.last_update === null) {
              // The first update is not ready yet for this first party, allow it
              state.incrementStat('tracker.txt_not_ready' + rule);
              return;
            }
            rule = _trackerTxt.getRule(state.urlParts.hostname);
          }
          if (CliqzAttrack.debug) {
            console.log('ATTRACK', rule, 'URL:', state.urlParts.hostname, state.urlParts.path, 'TOKENS:', badTokens);
          }
          if (rule == 'block') {
            state.incrementStat('token_blocked_' + rule);
            response.cancel = true;
            return false;
          } else {
            var tmp_url = state.requestContext.url;
            for (var i = 0; i < badTokens.length; i++) {
              if (tmp_url.indexOf(badTokens[i]) < 0) {
                badTokens[i] = encodeURIComponent(badTokens[i]);
              }
              tmp_url = tmp_url.replace(badTokens[i], CliqzAttrack.obfuscate(badTokens[i], rule));
            }

            // In case unsafe tokens were in the hostname, the URI is not valid
            // anymore and we can cancel the request.
            if (!tmp_url.startsWith(state.urlParts.protocol + '://' + state.urlParts.hostname)) {
              response.cancel = true;
              return false;
            }

            state.incrementStat('token_blocked_' + rule);

            // TODO: do this nicer
            if (CliqzAttrack.pipelineSteps.trackerProxy && CliqzAttrack.pipelineSteps.trackerProxy.shouldProxy(tmp_url)) {
              state.incrementStat('proxy');
            }
            CliqzAttrack.recentlyModified.add(state.requestContext.getOriginWindowID() + state.url, 30000);
            CliqzAttrack.recentlyModified.add(state.requestContext.getOriginWindowID() + tmp_url, 30000);

            response.redirectUrl = tmp_url;
            response.requestHeaders = response.requestHeaders || [];
            response.requestHeaders.push({ name: CliqzAttrack.cliqzHeader, value: ' ' });
            return true;
          }
        },
        checkIsCookieWhitelisted: function checkIsCookieWhitelisted(state) {
          if (CliqzAttrack.isInWhitelist(state.urlParts.hostname)) {
            var stage = state.responseStatus !== undefined ? 'set_cookie' : 'cookie';
            state.incrementStat(stage + '_allow_whitelisted');
            return false;
          }
          return true;
        },
        /** Get info about trackers and blocking done in a specified tab.
         *
         *  Returns an object describing anti-tracking actions for this page, with keys as follows:
         *    cookies: 'allowed' and 'blocked' counts.
         *    requests: 'safe' and 'unsafe' counts. 'Unsafe' means that unsafe data was seen in a request to a tracker.
         *    trackers: more detailed information about each tracker. Object with keys being tracker domain and values
         *        more detailed blocking data.
         */
        getTabBlockingInfo: function getTabBlockingInfo(tabId, url) {
          var result = {
            tab: tabId,
            hostname: '',
            path: '',
            cookies: { allowed: 0, blocked: 0 },
            requests: { safe: 0, unsafe: 0 },
            trackers: {},
            companies: {},
            ps: null
          };

          // ignore special tabs
          if (url && (url.indexOf('about') == 0 || url.indexOf('chrome') == 0)) {
            result.error = 'Special tab';
            return result;
          }

          if (!(tabId in CliqzAttrack.tp_events._active)) {
            // no tp event, but 'active' tab = must reload for data
            // otherwise -> system tab
            if (browser.isWindowActive(tabId)) {
              result.reload = true;
            }
            result.error = 'No Data';
            return result;
          }

          var tabData = CliqzAttrack.tp_events._active[tabId],
              plain_data = tabData.asPlainObject(),
              trackers = Object.keys(tabData.tps).filter(function (domain) {
            return CliqzAttrack.qs_whitelist.isTrackerDomain(md5(getGeneralDomain(domain)).substring(0, 16)) || plain_data.tps[domain].adblock_block > 0;
          }),
              firstPartyCompany = CliqzAttrack.tracker_companies[getGeneralDomain(tabData.hostname)];
          result.hostname = tabData.hostname;
          result.path = tabData.path;

          trackers.forEach(function (dom) {
            result.trackers[dom] = {};
            ['c', 'cookie_set', 'cookie_blocked', 'bad_cookie_sent', 'bad_qs', 'set_cookie_blocked'].forEach(function (k) {
              result.trackers[dom][k] = plain_data.tps[dom][k] || 0;
            });
            // actual block count can be in several different signals, depending on configuration. Aggregate them into one.
            result.trackers[dom].tokens_removed = ['empty', 'replace', 'placeholder', 'block'].reduce(function (cumsum, action) {
              return cumsum + (plain_data.tps[dom]['token_blocked_' + action] || 0);
            }, 0);

            result.cookies.allowed += result.trackers[dom].cookie_set - result.trackers[dom].cookie_blocked;
            result.cookies.blocked += result.trackers[dom].cookie_blocked + result.trackers[dom].set_cookie_blocked;
            result.requests.safe += result.trackers[dom].c - result.trackers[dom].tokens_removed;
            result.requests.unsafe += result.trackers[dom].tokens_removed;

            // add set cookie blocks to cookie blocked count
            result.trackers[dom].cookie_blocked += result.trackers[dom].set_cookie_blocked;

            var tld = getGeneralDomain(dom),
                company = tld;
            // find the company behind this tracker. I
            // If the first party is from a tracker company, then do not add the company so that the actual tlds will be shown in the list
            if (tld in CliqzAttrack.tracker_companies && CliqzAttrack.tracker_companies[tld] !== firstPartyCompany) {
              company = CliqzAttrack.tracker_companies[tld];
            }
            if (!(company in result.companies)) {
              result.companies[company] = [];
            }
            result.companies[company].push(dom);
          });

          return result;
        },
        getCurrentTabBlockingInfo: function getCurrentTabBlockingInfo(_gBrowser) {
          var tabId, urlForTab;
          try {
            var gBrowser = _gBrowser || CliqzUtils.getWindow().gBrowser,
                selectedBrowser = gBrowser.selectedBrowser;
            // on FF < 38 selectBrowser.outerWindowID is undefined, so we get the windowID from _loadContext
            tabId = selectedBrowser.outerWindowID || selectedBrowser._loadContext.DOMWindowID;
            urlForTab = selectedBrowser.currentURI.spec;
          } catch (e) {}
          return CliqzAttrack.getTabBlockingInfo(tabId, urlForTab);
        },
        tracker_companies: {},
        /** Parse tracker owners list {Company: [list, of, domains]}, into lookup table {domain: Company}
         */
        _parseTrackerCompanies: function _parseTrackerCompanies(company_list) {
          var rev_list = {};
          for (var company in company_list) {
            company_list[company].forEach(function (d) {
              rev_list[d] = company;
            });
          }
          CliqzAttrack.tracker_companies = rev_list;
        },
        /** Enables Attrack module with cookie, QS and referrer protection enabled.
         *  if module_only is set to true, will not set preferences for cookie, QS and referrer protection (for selective loading in AB tests)
         */
        enableModule: function enableModule(module_only) {
          if (CliqzAttrack.isEnabled()) {
            return;
          }
          CliqzUtils.setPref(CliqzAttrack.ENABLE_PREF, true);
          if (!module_only) {
            CliqzUtils.setPref('attrackBlockCookieTracking', true);
            CliqzUtils.setPref('attrackRemoveQueryStringTracking', true);
          }
        },
        /** Disables anti-tracking immediately.
         */
        disableModule: function disableModule() {
          CliqzUtils.setPref(CliqzAttrack.ENABLE_PREF, false);
        },
        disabled_sites: new Set(),
        DISABLED_SITES_PREF: "attrackSourceDomainWhitelist",
        saveSourceDomainWhitelist: function saveSourceDomainWhitelist() {
          CliqzUtils.setPref(CliqzAttrack.DISABLED_SITES_PREF, JSON.stringify(Array.from(CliqzAttrack.disabled_sites)));
        },
        isSourceWhitelisted: function isSourceWhitelisted(hostname) {
          return CliqzAttrack.disabled_sites.has(hostname);
        },
        addSourceDomainToWhitelist: function addSourceDomainToWhitelist(domain) {
          CliqzAttrack.disabled_sites.add(domain);
          // also send domain to humanweb
          CliqzAttrack.telemetry({
            message: {
              'type': _telemetry.msgType,
              'action': 'attrack.whitelistDomain',
              'payload': domain
            },
            raw: true
          });
          CliqzAttrack.saveSourceDomainWhitelist();
        },
        removeSourceDomainFromWhitelist: function removeSourceDomainFromWhitelist(domain) {
          CliqzAttrack.disabled_sites['delete'](domain);
          CliqzAttrack.saveSourceDomainWhitelist();
        },
        onUrlbarFocus: function onUrlbarFocus() {
          countReload = true;
        }
      };

      _export('default', CliqzAttrack);
    }
  };
});