System.register("adblocker/filters-matching", [], function (_export) {
  "use strict";

  var TLDs, CPT;

  var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; })();

  /* Checks that hostnamePattern matches at the end of the hostname.
   * Partial matches are allowed, but hostname should be a valid
   * subdomain of hostnamePattern.
   */

  _export("matchNetworkFilter", matchNetworkFilter);

  _export("matchCosmeticFilter", matchCosmeticFilter);

  function checkContentPolicy(filter, cpt) {
    // Check content policy type only if at least one content policy has
    // been specified in the options.
    if (!filter.fromAny) {
      var options = [[filter.fromSubdocument, CPT.TYPE_SUBDOCUMENT], [filter.fromImage, CPT.TYPE_IMAGE], [filter.fromMedia, CPT.TYPE_MEDIA], [filter.fromObject, CPT.TYPE_OBJECT], [filter.fromObjectSubrequest, CPT.TYPE_OBJECT_SUBREQUEST], [filter.fromOther, CPT.TYPE_OTHER], [filter.fromPing, CPT.TYPE_PING], [filter.fromScript, CPT.TYPE_SCRIPT], [filter.fromStylesheet, CPT.TYPE_STYLESHEET], [filter.fromWebsocket, CPT.TYPE_WEBSOCKET], [filter.fromXmlHttpRequest, CPT.TYPE_XMLHTTPREQUEST]];

      // If content policy type `option` is specified in filter filter,
      // then the policy type of the request must match.
      // - If more than one policy type is valid, we must find at least one
      // - If we found a blacklisted policy type we can return `false`
      var foundValidCP = null;
      for (var i = 0; i < options.length; i += 1) {
        var _options$i = _slicedToArray(options[i], 2);

        var option = _options$i[0];
        var policyType = _options$i[1];

        // Found a fromX matching the origin policy of the request
        if (option === true) {
          if (cpt === policyType) {
            foundValidCP = true;
            break;
          } else {
            foundValidCP = false;
          }
        }

        // This rule can't be used with filter policy type
        if (option === false && cpt === policyType) {
          return false;
        }
      }

      // Couldn't find any policy origin matching the request
      if (foundValidCP === false) {
        return false;
      }
    }

    return true;
  }

  function checkOptions(filter, request) {
    // Source
    var sHost = request.sourceHostname;
    var sHostGD = request.sourceGD;

    // Url endpoint
    var hostGD = request.hostGD;

    // Check option $third-party
    // source domain and requested domain must be different
    if ((filter.firstParty === false || filter.thirdParty === true) && sHostGD === hostGD) {
      return false;
    }

    // $~third-party
    // source domain and requested domain must be the same
    if ((filter.firstParty === true || filter.thirdParty === false) && sHostGD !== hostGD) {
      return false;
    }

    // URL must be among these domains to match
    if (filter.optDomains.size > 0 && !(filter.optDomains.has(sHostGD) || filter.optDomains.has(sHost))) {
      return false;
    }

    // URL must not be among these domains to match
    if (filter.optNotDomains.size > 0 && (filter.optNotDomains.has(sHostGD) || filter.optNotDomains.has(sHost))) {
      return false;
    }

    if (!checkContentPolicy(filter, request.cpt)) {
      return false;
    }

    return true;
  }

  function checkPattern(filter, request) {
    var url = request.url;
    var host = request.hostname;

    // Try to match url with pattern
    if (filter.isHostnameAnchor) {
      var matchIndex = host.indexOf(filter.hostname);
      // Either start at beginning of hostname or be preceded by a '.'
      if (matchIndex > 0 && host[matchIndex - 1] === '.' || matchIndex === 0) {
        // Extract only the part after the hostname
        var urlPattern = url.substring(url.indexOf(filter.hostname) + filter.hostname.length);
        if (filter.isRegex) {
          // If it's a regex, it should match the pattern after hostname
          return filter.regex.test(urlPattern);
        } else if (filter.isRightAnchor) {
          // If it's a right anchor, then the filterStr should match exactly
          return urlPattern === filter.filterStr;
        }

        return urlPattern.startsWith(filter.filterStr);
      }
    } else {
      if (filter.isRegex) {
        return filter.regex.test(url);
      } else if (filter.isLeftAnchor && filter.isRightAnchor) {
        return url === filter.filterStr;
      } else if (filter.isLeftAnchor) {
        return url.startsWith(filter.filterStr);
      } else if (filter.isRightAnchor) {
        return url.endsWith(filter.filterStr);
      }

      return url.includes(filter.filterStr);
    }

    return false;
  }

  function matchNetworkFilter(filter, request) {
    if (!checkOptions(filter, request)) {
      return false;
    }

    return checkPattern(filter, request);
  }

  function checkHostnamesPartialMatch(hostname, hostnamePattern) {
    if (hostname.endsWith(hostnamePattern)) {
      var patternIndex = hostname.indexOf(hostnamePattern);
      if (patternIndex === 0 || patternIndex !== -1 && hostname.charAt(patternIndex - 1) === '.') {
        return true;
      }
    }

    return false;
  }

  /* Checks if `hostname` matches `hostnamePattern`, which can appear as
   * a domain selector in a cosmetic filter: hostnamePattern##selector
   *
   * It takes care of the concept of entities introduced by uBlock: google.*
   * https://github.com/gorhill/uBlock/wiki/Static-filter-syntax#entity-based-cosmetic-filters
   */
  function matchHostname(hostname, hostnamePattern) {
    var globIndex = hostnamePattern.indexOf('.*');
    if (globIndex === hostnamePattern.length - 2) {
      // Match entity:
      var entity = hostnamePattern.substring(0, globIndex);

      // Ignore TLDs suffix
      var parts = hostname.split('.').reverse();
      var i = 0;
      while (i < parts.length && TLDs[parts[i]]) {
        i += 1;
      }

      // Check if we have a match
      if (i < parts.length) {
        return checkHostnamesPartialMatch(parts.splice(i).reverse().join('.'), entity);
      }

      return false;
    }

    return checkHostnamesPartialMatch(hostname, hostnamePattern);
  }

  function matchHostnames(hostname, hostnames) {
    // If there is no constraint, then this is a match
    if (hostnames.length === 0) {
      return true;
    }

    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = hostnames[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var hn = _step.value;

        if (matchHostname(hostname, hn)) {
          return true;
        }
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator["return"]) {
          _iterator["return"]();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }

    return false;
  }

  function matchCosmeticFilter(filter, hostname) {
    var result = false;

    if (filter.hostnames.length > 0 && hostname) {
      result = matchHostnames(hostname, filter.hostnames);
    } else {
      result = true;
    }

    return result;
  }

  return {
    setters: [],
    execute: function () {
      TLDs = { "gw": "cc", "gu": "cc", "gt": "cc", "gs": "cc", "gr": "cc", "gq": "cc", "gp": "cc", "dance": "na", "tienda": "na", "gy": "cc", "gg": "cc", "gf": "cc", "ge": "cc", "gd": "cc", "gb": "cc", "ga": "cc", "edu": "na", "gn": "cc", "gm": "cc", "gl": "cc", "公司": "na", "gi": "cc", "gh": "cc", "tz": "cc", "zone": "na", "tv": "cc", "tw": "cc", "tt": "cc", "immobilien": "na", "tr": "cc", "tp": "cc", "tn": "cc", "to": "cc", "tl": "cc", "bike": "na", "tj": "cc", "tk": "cc", "th": "cc", "tf": "cc", "tg": "cc", "td": "cc", "tc": "cc", "coop": "na", "онлайн": "na", "cool": "na", "ro": "cc", "vu": "cc", "democrat": "na", "guitars": "na", "qpon": "na", "срб": "cc", "zm": "cc", "tel": "na", "futbol": "na", "za": "cc", "بازار": "na", "рф": "cc", "zw": "cc", "blue": "na", "mu": "cc", "ไทย": "cc", "asia": "na", "marketing": "na", "测试": "na", "international": "na", "net": "na", "新加坡": "cc", "okinawa": "na", "பரிட்சை": "na", "טעסט": "na", "삼성": "na", "sexy": "na", "institute": "na", "台灣": "cc", "pics": "na", "公益": "na", "机构": "na", "social": "na", "domains": "na", "香港": "cc", "集团": "na", "limo": "na", "мон": "cc", "tools": "na", "nagoya": "na", "properties": "na", "camera": "na", "today": "na", "club": "na", "company": "na", "glass": "na", "berlin": "na", "me": "cc", "md": "cc", "mg": "cc", "mf": "cc", "ma": "cc", "mc": "cc", "tokyo": "na", "mm": "cc", "ml": "cc", "mo": "cc", "mn": "cc", "mh": "cc", "mk": "cc", "cat": "na", "reviews": "na", "mt": "cc", "mw": "cc", "mv": "cc", "mq": "cc", "mp": "cc", "ms": "cc", "mr": "cc", "cab": "na", "my": "cc", "mx": "cc", "mz": "cc", "இலங்கை": "cc", "wang": "na", "estate": "na", "clothing": "na", "monash": "na", "guru": "na", "technology": "na", "travel": "na", "テスト": "na", "pink": "na", "fr": "cc", "테스트": "na", "farm": "na", "lighting": "na", "fi": "cc", "fj": "cc", "fk": "cc", "fm": "cc", "fo": "cc", "sz": "cc", "kaufen": "na", "sx": "cc", "ss": "cc", "sr": "cc", "sv": "cc", "su": "cc", "st": "cc", "sk": "cc", "sj": "cc", "si": "cc", "sh": "cc", "so": "cc", "sn": "cc", "sm": "cc", "sl": "cc", "sc": "cc", "sb": "cc", "rentals": "na", "sg": "cc", "se": "cc", "sd": "cc", "组织机构": "na", "shoes": "na", "中國": "cc", "industries": "na", "lb": "cc", "lc": "cc", "la": "cc", "lk": "cc", "li": "cc", "lv": "cc", "lt": "cc", "lu": "cc", "lr": "cc", "ls": "cc", "holiday": "na", "ly": "cc", "coffee": "na", "ceo": "na", "在线": "na", "ye": "cc", "إختبار": "na", "ninja": "na", "yt": "cc", "name": "na", "moda": "na", "eh": "cc", "بھارت": "cc", "ee": "cc", "house": "na", "eg": "cc", "ec": "cc", "vote": "na", "eu": "cc", "et": "cc", "es": "cc", "er": "cc", "ru": "cc", "rw": "cc", "ભારત": "cc", "rs": "cc", "boutique": "na", "re": "cc", "سورية": "cc", "gov": "na", "орг": "na", "red": "na", "foundation": "na", "pub": "na", "vacations": "na", "org": "na", "training": "na", "recipes": "na", "испытание": "na", "中文网": "na", "support": "na", "onl": "na", "中信": "na", "voto": "na", "florist": "na", "ලංකා": "cc", "қаз": "cc", "management": "na", "مصر": "cc", "آزمایشی": "na", "kiwi": "na", "academy": "na", "sy": "cc", "cards": "na", "संगठन": "na", "pro": "na", "kred": "na", "sa": "cc", "mil": "na", "我爱你": "na", "agency": "na", "みんな": "na", "equipment": "na", "mango": "na", "luxury": "na", "villas": "na", "政务": "na", "singles": "na", "systems": "na", "plumbing": "na", "δοκιμή": "na", "تونس": "cc", "پاکستان": "cc", "gallery": "na", "kg": "cc", "ke": "cc", "বাংলা": "cc", "ki": "cc", "kh": "cc", "kn": "cc", "km": "cc", "kr": "cc", "kp": "cc", "kw": "cc", "link": "na", "ky": "cc", "voting": "na", "cruises": "na", "عمان": "cc", "cheap": "na", "solutions": "na", "測試": "na", "neustar": "na", "partners": "na", "இந்தியா": "cc", "menu": "na", "arpa": "na", "flights": "na", "rich": "na", "do": "cc", "dm": "cc", "dj": "cc", "dk": "cc", "photography": "na", "de": "cc", "watch": "na", "dz": "cc", "supplies": "na", "report": "na", "tips": "na", "გე": "cc", "bar": "na", "qa": "cc", "shiksha": "na", "укр": "cc", "vision": "na", "wiki": "na", "قطر": "cc", "한국": "cc", "computer": "na", "best": "na", "voyage": "na", "expert": "na", "diamonds": "na", "email": "na", "wf": "cc", "jobs": "na", "bargains": "na", "移动": "na", "jp": "cc", "jm": "cc", "jo": "cc", "ws": "cc", "je": "cc", "kitchen": "na", "ਭਾਰਤ": "cc", "ایران": "cc", "ua": "cc", "buzz": "na", "com": "na", "uno": "na", "ck": "cc", "ci": "cc", "ch": "cc", "co": "cc", "cn": "cc", "cm": "cc", "cl": "cc", "cc": "cc", "ca": "cc", "cg": "cc", "cf": "cc", "community": "na", "cd": "cc", "cz": "cc", "cy": "cc", "cx": "cc", "cr": "cc", "cw": "cc", "cv": "cc", "cu": "cc", "pr": "cc", "ps": "cc", "pw": "cc", "pt": "cc", "holdings": "na", "wien": "na", "py": "cc", "ai": "cc", "pa": "cc", "pf": "cc", "pg": "cc", "pe": "cc", "pk": "cc", "ph": "cc", "pn": "cc", "pl": "cc", "pm": "cc", "台湾": "cc", "aero": "na", "catering": "na", "photos": "na", "परीक्षा": "na", "graphics": "na", "فلسطين": "cc", "ভারত": "cc", "ventures": "na", "va": "cc", "vc": "cc", "ve": "cc", "vg": "cc", "iq": "cc", "vi": "cc", "is": "cc", "ir": "cc", "it": "cc", "vn": "cc", "im": "cc", "il": "cc", "io": "cc", "in": "cc", "ie": "cc", "id": "cc", "tattoo": "na", "education": "na", "parts": "na", "events": "na", "భారత్": "cc", "cleaning": "na", "kim": "na", "contractors": "na", "mobi": "na", "center": "na", "photo": "na", "nf": "cc", "مليسيا": "cc", "wed": "na", "supply": "na", "网络": "na", "сайт": "na", "careers": "na", "build": "na", "الاردن": "cc", "bid": "na", "biz": "na", "السعودية": "cc", "gift": "na", "дети": "na", "works": "na", "游戏": "na", "tm": "cc", "exposed": "na", "productions": "na", "koeln": "na", "dating": "na", "christmas": "na", "bd": "cc", "be": "cc", "bf": "cc", "bg": "cc", "ba": "cc", "bb": "cc", "bl": "cc", "bm": "cc", "bn": "cc", "bo": "cc", "bh": "cc", "bi": "cc", "bj": "cc", "bt": "cc", "bv": "cc", "bw": "cc", "bq": "cc", "br": "cc", "bs": "cc", "post": "na", "by": "cc", "bz": "cc", "om": "cc", "ruhr": "na", "امارات": "cc", "repair": "na", "xyz": "na", "شبكة": "na", "viajes": "na", "museum": "na", "fish": "na", "الجزائر": "cc", "hr": "cc", "ht": "cc", "hu": "cc", "hk": "cc", "construction": "na", "hn": "cc", "solar": "na", "hm": "cc", "info": "na", "சிங்கப்பூர்": "cc", "uy": "cc", "uz": "cc", "us": "cc", "um": "cc", "uk": "cc", "ug": "cc", "builders": "na", "ac": "cc", "camp": "na", "ae": "cc", "ad": "cc", "ag": "cc", "af": "cc", "int": "na", "am": "cc", "al": "cc", "ao": "cc", "an": "cc", "aq": "cc", "as": "cc", "ar": "cc", "au": "cc", "at": "cc", "aw": "cc", "ax": "cc", "az": "cc", "ni": "cc", "codes": "na", "nl": "cc", "no": "cc", "na": "cc", "nc": "cc", "ne": "cc", "actor": "na", "ng": "cc", "भारत": "cc", "nz": "cc", "سودان": "cc", "np": "cc", "nr": "cc", "nu": "cc", "xxx": "na", "世界": "na", "kz": "cc", "enterprises": "na", "land": "na", "المغرب": "cc", "中国": "cc", "directory": "na" };

      _export("TLDs", TLDs);

      // Some content policy types used in filters
      CPT = {
        TYPE_OTHER: 1,
        TYPE_SCRIPT: 2,
        TYPE_IMAGE: 3,
        TYPE_STYLESHEET: 4,
        TYPE_OBJECT: 5,
        TYPE_SUBDOCUMENT: 7,
        TYPE_PING: 10,
        TYPE_XMLHTTPREQUEST: 11,
        TYPE_OBJECT_SUBREQUEST: 12,
        TYPE_MEDIA: 15,
        TYPE_WEBSOCKET: 16
      };
    }
  };
});