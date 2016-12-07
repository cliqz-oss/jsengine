System.register('adblocker/filters-parsing', ['adblocker/utils'], function (_export) {

  // Uniq ID generator
  'use strict';

  var log, uidGen, SEPARATOR, AdCosmetics, AdFilter, SPACE;

  var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  _export('serializeFilter', serializeFilter);

  _export('deserializeFilter', deserializeFilter);

  _export('parseFilter', parseFilter);

  _export('default', parseList);

  _export('parseJSResource', parseJSResource);

  function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

  function getUID() {
    return uidGen++;
  }

  function serializeFilter(filter) {
    var serialized = Object.assign(Object.create(null), filter);
    try {
      if (filter.optDomains) {
        serialized.optDomains = [].concat(_toConsumableArray(serialized.optDomains.values()));
      }
      if (serialized.optNotDomains) {
        serialized.optNotDomains = [].concat(_toConsumableArray(serialized.optNotDomains.values()));
      }
      if (serialized.regex) {
        serialized.regex = serialized.regex.toString();
      }
    } catch (e) {
      log('EXCEPTION SERIALIZING ' + e + ' ' + e.stack);
    }
    return serialized;
  }

  function deserializeFilter(serialized) {
    var filter = serialized;
    try {
      if (filter.optDomains instanceof Array) {
        filter.optDomains = new Set(filter.optDomains);
      }
      if (filter.optNotDomains instanceof Array) {
        filter.optNotDomains = new Set(filter.optNotDomains);
      }
      if (filter.regex) {
        var m = filter.regex.match(/\/(.*)\/(.*)?/);
        filter.regex = new RegExp(m[1], m[2] || '');
      }
      // Assign a new id to the filter
      filter.id = getUID();
    } catch (e) {
      log('EXCEPTION DESERIALIZE ' + e + ' ' + e.stack);
    }
    return filter;
  }

  function isRegex(filter, start, end) {
    var starIndex = filter.indexOf('*', start);
    var separatorIndex = filter.indexOf('^', start);
    return starIndex !== -1 && starIndex < end || separatorIndex !== -1 && separatorIndex < end;
  }

  // TODO:
  // 1. Options not supported yet:
  //  - popup
  //  - popunder
  //  - generichide
  //  - genericblock
  // 2. Lot of hostname anchors are of the form hostname[...]*[...]
  //    we could split it into prefix + plain pattern
  // 3. Replace some of the attributes by a bitmask

  function parseFilter(line) {
    // Ignore comments
    if (line.length === 1 || line.charAt(0) === '!' || line.charAt(0) === '#' && SPACE.test(line.charAt(1)) || line.startsWith('[Adblock')) {
      return { supported: false, isComment: true };
    }

    // Ignore Adguard cosmetics
    // `$$`
    if (line.includes('$$')) {
      return { supported: false };
    }

    // Check if filter is cosmetics
    var sharpIndex = line.indexOf('#');
    if (sharpIndex > -1) {
      var afterSharpIndex = sharpIndex + 1;

      // Ignore Adguard cosmetics
      // `#$#` `#@$#`
      // `#%#` `#@%#`
      if (line.startsWith( /* #@$# */'@$#', afterSharpIndex) || line.startsWith( /* #@%# */'@%#', afterSharpIndex) || line.startsWith( /* #%# */'%#', afterSharpIndex) || line.startsWith( /* #$# */'$#', afterSharpIndex)) {
        return { supported: false };
      } else if (line.startsWith( /* ## */'#', afterSharpIndex) || line.startsWith( /* #@# */'@#', afterSharpIndex)) {
        // Parse supported cosmetic filter
        // `##` `#@#`
        return new AdCosmetics(line, sharpIndex);
      }
    }

    // Everything else is a network filter
    return new AdFilter(line);
  }

  function parseList(list) {
    try {
      var _ret = (function () {
        var networkFilters = [];
        var cosmeticFilters = [];

        list.forEach(function (line) {
          if (line) {
            var filter = parseFilter(line.trim());
            if (filter.supported && !filter.isComment) {
              log('compiled ' + line + ' into ' + JSON.stringify(filter));
              if (filter.isNetworkFilter) {
                networkFilters.push(filter);
              } else {
                cosmeticFilters.push(filter);
              }
            }
          }
        });

        return {
          v: {
            networkFilters: networkFilters,
            cosmeticFilters: cosmeticFilters
          }
        };
      })();

      if (typeof _ret === 'object') return _ret.v;
    } catch (ex) {
      log('ERROR WHILE PARSING ' + typeof list + ' ' + ex);
      return null;
    }
  }

  function parseJSResource(lines) {
    var state = 'end';
    var tmpContent = '';
    var type = null;
    var name = '';
    var parsed = new Map();
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = lines[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var line = _step.value;

        line = line.trim();
        if (line.startsWith('#')) {
          state = 'comment';
        } else if (!line.trim()) {
          state = 'end';
        } else if (state !== 'content' && !type && line.split(' ').length === 2) {
          state = 'title';
        } else {
          state = 'content';
        }
        switch (state) {
          case 'end':
            if (tmpContent) {
              if (!parsed.get(type)) {
                parsed.set(type, new Map());
              }
              parsed.get(type).set(name, tmpContent);
              tmpContent = '';
              type = null;
            }
            break;
          case 'comment':
            break;
          case 'title':
            var _line$split = line.split(' ');

            var _line$split2 = _slicedToArray(_line$split, 2);

            name = _line$split2[0];
            type = _line$split2[1];

            break;
          case 'content':
            tmpContent += line + '\n';
            break;
          default:
        }
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

    if (tmpContent) {
      if (!parsed.get(type)) {
        parsed.set(type, new Map());
      }
      parsed.get(type).set(name, tmpContent);
    }
    return parsed;
  }

  return {
    setters: [function (_adblockerUtils) {
      log = _adblockerUtils.log;
    }],
    execute: function () {
      uidGen = 0;
      SEPARATOR = /[/^*]/;

      AdCosmetics = function AdCosmetics(line, sharpIndex) {
        _classCallCheck(this, AdCosmetics);

        this.id = getUID();

        this.rawLine = line;
        this.supported = true;
        this.unhide = false;
        this.isCosmeticFilter = true;
        this.scriptInject = false;
        this.scriptReplaced = false;
        this.scriptBlock = false;

        this.hostnames = [];
        this.selector = null;

        var afterSharpIndex = sharpIndex + 1;
        var suffixStartIndex = afterSharpIndex + 1;

        // hostname1,hostname2#@#.selector
        //                    ^^ ^
        //                    || |
        //                    || suffixStartIndex
        //                    |afterSharpIndex
        //                    sharpIndex

        // Check if unhide
        if (line[afterSharpIndex] === '@') {
          this.unhide = true;
          suffixStartIndex++;
        }

        // Parse hostnames
        if (sharpIndex > 0) {
          this.hostnames = line.substring(0, sharpIndex).split(',');
        }

        // Parse selector
        this.selector = line.substring(suffixStartIndex);

        // Deal with script:inject and script:contains
        if (this.selector.startsWith('script:')) {
          // this.selector
          //      script:inject(.......)
          //                    ^      ^
          //   script:contains(/......./)
          //                    ^      ^
          //    script:contains(selector)
          //           ^        ^       ^^
          //           |        |       ||
          //           |        |       |this.selector.length
          //           |        |       scriptSelectorIndexEnd
          //           |        scriptSelectorIndexStart
          //           scriptMethodIndex
          var scriptMethodIndex = 'script:'.length;
          var scriptSelectorIndexStart = scriptMethodIndex;
          var scriptSelectorIndexEnd = this.selector.length - 1;

          if (this.selector.startsWith('inject(', scriptMethodIndex)) {
            this.scriptInject = true;
            scriptSelectorIndexStart += 'inject('.length;
          } else if (this.selector.startsWith('contains(', scriptMethodIndex)) {
            this.scriptBlock = true;
            scriptSelectorIndexStart += 'contains('.length;

            // If it's a regex
            if (this.selector[scriptSelectorIndexStart] === '/' && this.selector[scriptSelectorIndexEnd - 1] === '/') {
              scriptSelectorIndexStart++;
              scriptSelectorIndexEnd--;
            }
          }

          this.selector = this.selector.substring(scriptSelectorIndexStart, scriptSelectorIndexEnd);
        }

        // Exceptions
        if (this.selector === null || this.selector.length === 0 || this.selector.endsWith('}') || this.selector.includes('##') || this.unhide && this.hostnames.length === 0) {
          this.supported = false;
        }
      };

      AdFilter = (function () {
        function AdFilter(line) {
          _classCallCheck(this, AdFilter);

          // Assign an id to the filter
          this.id = getUID();

          this.rawLine = line;
          this.filterStr = null;
          this.supported = true;
          this.isException = false;
          this.hostname = null;
          this.isNetworkFilter = true;
          this.isComment = false;

          this.regex = null;

          // Options
          // null  == not specified
          // true  == value true
          // false == negation (~)
          this.optDomains = null;
          this.optNotDomains = null;

          this.isImportant = false;
          this.matchCase = false;

          this.thirdParty = null;
          this.firstParty = null;
          this.redirect = null;

          // Options on origin policy
          this.fromAny = true;
          this.fromImage = null;
          this.fromMedia = null;
          this.fromObject = null;
          this.fromObjectSubrequest = null;
          this.fromOther = null;
          this.fromPing = null;
          this.fromScript = null;
          this.fromStylesheet = null;
          this.fromSubdocument = null;
          this.fromWebsocket = null;
          this.fromXmlHttpRequest = null;

          // Kind of pattern
          this.isHostname = false;
          this.isPlain = false;
          this.isRegex = false;
          this.isLeftAnchor = false;
          this.isRightAnchor = false;
          this.isHostnameAnchor = false;

          var filterIndexStart = 0;
          var filterIndexEnd = line.length;

          // @@filter == Exception
          this.isException = line.startsWith('@@');
          if (this.isException) {
            filterIndexStart += 2;
          }

          // filter$options == Options
          // ^     ^
          // |     |
          // |     optionsIndex
          // filterIndexStart
          var optionsIndex = line.indexOf('$', filterIndexStart);
          if (optionsIndex !== -1) {
            // Parse options and set flags
            filterIndexEnd = optionsIndex;
            this.parseOptions(line.substring(optionsIndex + 1));
          }

          if (this.supported) {
            // Identify kind of pattern

            // Deal with hostname pattern
            if (line.startsWith('127.0.0.1')) {
              this.hostname = line.substring(line.lastIndexOf(' '));
              this.filterStr = '';
              this.isHostname = true;
              this.isPlain = true;
              this.isRegex = false;
              this.isHostnameAnchor = true;
            } else {
              if (line.charAt(filterIndexEnd - 1) === '|') {
                this.isRightAnchor = true;
                filterIndexEnd--;
              }

              if (line.startsWith('||', filterIndexStart)) {
                this.isHostnameAnchor = true;
                filterIndexStart += 2;
              } else if (line.charAt(filterIndexStart) === '|') {
                this.isLeftAnchor = true;
                filterIndexStart++;
              }

              // If pattern ends with "*", strip it as it often can be
              // transformed into a "plain pattern" this way.
              // TODO: add a test
              if (line.charAt(filterIndexEnd - 1) === '*' && filterIndexEnd - filterIndexStart > 1) {
                filterIndexEnd--;
              }

              // Is regex?
              this.isRegex = isRegex(line, filterIndexStart, filterIndexEnd);
              this.isPlain = !this.isRegex;

              // Extract hostname to match it more easily
              // NOTE: This is the most common case of filters
              if (this.isPlain && this.isHostnameAnchor) {
                // Look for next /
                var slashIndex = line.indexOf('/', filterIndexStart);
                if (slashIndex !== -1) {
                  this.hostname = line.substring(filterIndexStart, slashIndex);
                  filterIndexStart = slashIndex;
                } else {
                  this.hostname = line.substring(filterIndexStart, filterIndexEnd);
                  this.filterStr = '';
                }
              } else if (this.isRegex && this.isHostnameAnchor) {
                // Split at the first '/', '*' or '^' character to get the hostname
                // and then the pattern.
                var firstSeparator = line.search(SEPARATOR);

                if (firstSeparator !== -1) {
                  this.hostname = line.substring(filterIndexStart, firstSeparator);
                  filterIndexStart = firstSeparator;
                  this.isRegex = isRegex(line, filterIndexStart, filterIndexEnd);
                  this.isPlain = !this.isRegex;

                  if (filterIndexEnd - filterIndexStart === 1 && line.charAt(filterIndexStart) === '^') {
                    this.filterStr = '';
                    this.isPlain = true;
                    this.isRegex = false;
                  }
                }
              }
            }

            if (this.filterStr === null) {
              this.filterStr = line.substring(filterIndexStart, filterIndexEnd);
            }

            // Compile Regex
            if (this.isRegex) {
              this.regex = this.compileRegex(this.filterStr);
              // this.rawRegex = this.regex.toString();
            } else {
                // if (!this.matchCase) {
                // NOTE: No filter seems to be using the `match-case` option,
                // hence, it's more efficient to just convert everything to
                // lower case before matching.
                if (this.filterStr) {
                  this.filterStr = this.filterStr.toLowerCase();
                }
                if (this.hostname) {
                  this.hostname = this.hostname.toLowerCase();
                }
              }
          }
        }

        _createClass(AdFilter, [{
          key: 'compileRegex',
          value: function compileRegex(filterStr) {
            var filter = filterStr;

            // Escape special regex characters: |.$+?{}()[]\
            filter = filter.replace(/([|.$+?{}()[\]\\])/g, '\\$1');

            // * can match anything
            filter = filter.replace(/\*/g, '.*');
            // ^ can match any separator or the end of the pattern
            filter = filter.replace(/\^/g, '(?:[^\\w\\d_.%-]|$)');

            // Should match end of url
            if (this.isRightAnchor) {
              filter = filter + '$';
            }

            if (this.isHostnameAnchor || this.isLeftAnchor) {
              filter = '^' + filter;
            }

            try {
              if (this.matchCase) {
                return new RegExp(filter);
              }
              return new RegExp(filter, 'i');
            } catch (ex) {
              log('failed to compile regex ' + filter + ' with error ' + ex);
              // Ignore this filter
              this.supported = false;
              return null;
            }
          }
        }, {
          key: 'parseOptions',
          value: function parseOptions(rawOptions) {
            var _this = this;

            rawOptions.split(',').forEach(function (rawOption) {
              var negation = false;
              var option = rawOption;

              // Check for negation: ~option
              if (option.startsWith('~')) {
                negation = true;
                option = option.substring(1);
              } else {
                negation = false;
              }

              // Check for options: option=value1|value2
              var optionValues = [];
              if (option.includes('=')) {
                var optionAndValues = option.split('=', 2);
                option = optionAndValues[0];
                optionValues = optionAndValues[1].split('|');
              }

              switch (option) {
                case 'domain':
                  _this.optDomains = new Set();
                  _this.optNotDomains = new Set();

                  optionValues.forEach(function (value) {
                    if (value) {
                      if (value.startsWith('~')) {
                        _this.optNotDomains.add(value.substring(1));
                      } else {
                        _this.optDomains.add(value);
                      }
                    }
                  });

                  if (_this.optDomains.size === 0) {
                    _this.optDomains = null;
                  }
                  if (_this.optNotDomains.size === 0) {
                    _this.optNotDomains = null;
                  }

                  break;
                case 'image':
                  _this.fromImage = !negation;
                  break;
                case 'media':
                  _this.fromMedia = !negation;
                  break;
                case 'object':
                  _this.fromObject = !negation;
                  break;
                case 'object-subrequest':
                  _this.fromObjectSubrequest = !negation;
                  break;
                case 'other':
                  _this.fromOther = !negation;
                  break;
                case 'ping':
                  _this.fromPing = !negation;
                  break;
                case 'script':
                  _this.fromScript = !negation;
                  break;
                case 'stylesheet':
                  _this.fromStylesheet = !negation;
                  break;
                case 'subdocument':
                  _this.fromSubdocument = !negation;
                  break;
                case 'xmlhttprequest':
                  _this.fromXmlHttpRequest = !negation;
                  break;
                case 'important':
                  // Note: `negation` should always be `false` here.
                  _this.isImportant = true;
                  break;
                case 'match-case':
                  // Note: `negation` should always be `false` here.
                  _this.matchCase = true;
                  break;
                case 'third-party':
                  _this.thirdParty = !negation;
                  break;
                case 'first-party':
                  _this.firstParty = !negation;
                  break;
                case 'websocket':
                  _this.fromWebsocket = !negation;
                  break;
                case 'collapse':
                  break;
                case 'redirect':
                  // Negation of redirection doesn't make sense
                  _this.supported = !negation;
                  // Ignore this filter if no redirection resource is specified
                  if (optionValues.length === 0) {
                    _this.supported = false;
                  } else {
                    _this.redirect = optionValues[0];
                  }
                  break;
                // Disable this filter if any other option is encountered
                default:
                  // Disable this filter if we don't support all the options
                  _this.supported = false;
                  log('NOT SUPPORTED OPTION ' + option);
              }
            });

            // Check if any of the fromX flag is set
            this.fromAny = this.fromImage === null && this.fromMedia === null && this.fromObject === null && this.fromObjectSubrequest === null && this.fromOther === null && this.fromPing === null && this.fromScript === null && this.fromStylesheet === null && this.fromSubdocument === null && this.fromWebsocket === null && this.fromXmlHttpRequest === null;
          }
        }]);

        return AdFilter;
      })();

      SPACE = /\s/;
    }
  };
});