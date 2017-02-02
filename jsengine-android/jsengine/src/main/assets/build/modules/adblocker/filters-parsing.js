System.register('adblocker/filters-parsing', ['adblocker/utils', 'core/platform'], function (_export) {

  // Uniq ID generator
  'use strict';

  var log, platformName, uidGen, COSMETICS_MASK, NETWORK_FILTER_MASK, SEPARATOR, CosmeticFilter, NetworkFilter, SPACE;

  var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  _export('serializeFilter', serializeFilter);

  _export('deserializeFilter', deserializeFilter);

  _export('parseFilter', parseFilter);

  _export('default', parseList);

  _export('parseJSResource', parseJSResource);

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

  function getUID() {
    return uidGen++;
  }

  function getBit(n, offset) {
    return n >> offset & 1;
  }

  function setBit(n, offset) {
    return n | 1 << offset;
  }

  function clearBit(n, offset) {
    return n & ~(1 << offset);
  }

  function isBitSet(n, i) {
    return getBit(n, i) === 1;
  }

  function isBitNotSet(n, i) {
    return getBit(n, i) === 0;
  }

  function serializeFilter(filter) {
    var serialized = Object.assign(Object.create(null), filter);

    // Remove useless attributes
    serialized.id = undefined;
    if (serialized._r !== undefined) {
      serialized._r = undefined;
    }
    if (serialized._nds !== undefined) {
      serialized._nds = undefined;
    }
    if (serialized._ds !== undefined) {
      serialized._ds = undefined;
    }

    return serialized;
  }

  function deserializeFilter(serialized) {
    var filter = undefined;
    if (serialized._m !== undefined) {
      filter = new CosmeticFilter();
    } else {
      filter = new NetworkFilter();
    }

    // Copy remaining keys from serialized to filter
    Object.assign(filter, serialized);

    // Assign a new id to the filter
    filter.id = getUID();

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
        if (platformName === 'mobile') {
          // We don't support cosmetics filters on mobile, so no need
          // to parse them, store them, etc.
          // This will reduce both: loading time, memory footprint, and size of
          // the serialized index on disk.
          return { supported: false };
        }

        return new CosmeticFilter(line, sharpIndex);
      }
    }

    // Everything else is a network filter
    return new NetworkFilter(line);
  }

  function parseList(list) {
    var debug = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

    try {
      var _ret2 = (function () {
        var networkFilters = [];
        var cosmeticFilters = [];

        list.forEach(function (line) {
          if (line) {
            var filter = parseFilter(line.trim());
            if (filter.supported && !filter.isComment) {
              if (filter.isNetworkFilter) {
                // Delete temporary attributes
                if (!debug) {
                  filter.supported = undefined;
                  filter.isNetworkFilter = undefined;
                  filter.isComment = undefined;
                } else {
                  filter.rawLine = line;
                }

                networkFilters.push(filter);
              } else {
                // Delete temporary attributes
                if (!debug) {
                  filter.supported = undefined;
                  filter.isCosmeticFilter = undefined;
                } else {
                  filter.rawLine = line;
                }

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

      if (typeof _ret2 === 'object') return _ret2.v;
    } catch (ex) {
      log('ERROR WHILE PARSING ' + typeof list + ' ' + ex + ' ' + ex.stack);
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
      log = _adblockerUtils['default'];
    }, function (_corePlatform) {
      platformName = _corePlatform.platformName;
    }],
    execute: function () {
      uidGen = 0;
      COSMETICS_MASK = {
        unhide: 0,
        scriptInject: 1,
        scriptReplaced: 2,
        scriptBlock: 3
      };
      NETWORK_FILTER_MASK = {
        thirdParty: 0,
        firstParty: 1,
        fromAny: 2,
        fromImage: 3,
        fromMedia: 4,
        fromObject: 5,
        fromObjectSubrequest: 6,
        fromOther: 7,
        fromPing: 8,
        fromScript: 9,
        fromStylesheet: 10,
        fromSubdocument: 11,
        fromWebsocket: 12,
        fromXmlHttpRequest: 13,
        isImportant: 14,
        matchCase: 15,

        // Kind of pattern
        isHostname: 16,
        isPlain: 17,
        isRegex: 18,
        isLeftAnchor: 19,
        isRightAnchor: 20,
        isHostnameAnchor: 21,
        isException: 22
      };
      SEPARATOR = /[/^*]/;

      CosmeticFilter = (function () {
        function CosmeticFilter(line, sharpIndex) {
          _classCallCheck(this, CosmeticFilter);

          // The following fields are used as internal representation for the
          // filter, but should not be used directly. Please use getters to
          // access public property.
          // this._s  == selector
          // this._h  == hostnames

          // Mask to store attributes
          // Each flag (unhide, scriptInject, etc.) takes only 1 bit
          // at a specific offset defined in COSMETICS_MASK.
          // cf: COSMETICS_MASK for the offset of each property
          this._m = 0;
          this.setMask(COSMETICS_MASK.unhide, false);
          this.setMask(COSMETICS_MASK.scriptInject, false);
          this.setMask(COSMETICS_MASK.scriptReplaced, false);
          this.setMask(COSMETICS_MASK.scriptBlock, false);

          // Parse filter if given as argument
          if (line !== undefined) {
            this.id = getUID();
            this.supported = true;
            this.isCosmeticFilter = true;

            this.parse(line, sharpIndex);
          }
        }

        _createClass(CosmeticFilter, [{
          key: 'queryMask',
          value: function queryMask(offset) {
            return getBit(this._m, offset) === 1;
          }
        }, {
          key: 'setMask',
          value: function setMask(offset, value) {
            if (value) {
              this._m = setBit(this._m, offset);
            } else {
              this._m = clearBit(this._m, offset);
            }
          }
        }, {
          key: 'parse',
          value: function parse(line, sharpIndex) {
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
              this.setMask(COSMETICS_MASK.unhide, true);
              suffixStartIndex += 1;
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
              //    script:contains(selector[, args])
              //           ^        ^               ^^
              //           |        |          |    ||
              //           |        |          |    |this.selector.length
              //           |        |          |    scriptSelectorIndexEnd
              //           |        |          |scriptArguments
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
                  scriptSelectorIndexStart += 1;
                  scriptSelectorIndexEnd -= 1;
                }
              }

              this.selector = this.selector.substring(scriptSelectorIndexStart, scriptSelectorIndexEnd);
            }

            // Exceptions
            if (this.selector === null || this.selector.length === 0 || this.selector.endsWith('}') || this.selector.includes('##') || this.unhide && this.hostnames.length === 0) {
              this.supported = false;
            }
          }
        }, {
          key: 'selector',
          set: function set(value) {
            this._s = value;
          },
          get: function get() {
            return this._s || '';
          }
        }, {
          key: 'hostnames',
          set: function set(value) {
            this._h = value;
          },
          get: function get() {
            return this._h || [];
          }
        }, {
          key: 'unhide',
          set: function set(value) {
            this.setMask(COSMETICS_MASK.unhide, value);
          },
          get: function get() {
            return this.queryMask(COSMETICS_MASK.unhide);
          }
        }, {
          key: 'scriptInject',
          set: function set(value) {
            this.setMask(COSMETICS_MASK.scriptInject, value);
          },
          get: function get() {
            return this.queryMask(COSMETICS_MASK.scriptInject);
          }
        }, {
          key: 'scriptReplaced',
          set: function set(value) {
            this.setMask(COSMETICS_MASK.scriptReplaced, value);
          },
          get: function get() {
            return this.queryMask(COSMETICS_MASK.scriptReplaced);
          }
        }, {
          key: 'scriptBlock',
          set: function set(value) {
            this.setMask(COSMETICS_MASK.scriptBlock, value);
          },
          get: function get() {
            return this.queryMask(COSMETICS_MASK.scriptBlock);
          }
        }]);

        return CosmeticFilter;
      })();

      NetworkFilter = (function () {
        function NetworkFilter(line) {
          _classCallCheck(this, NetworkFilter);

          // The following fields can be added later but are `undefined` by default
          // They should be accessed via the corresponding get/set methods
          // this._f     == filterStr
          // this._r     == regex
          // this._d     == optDomains
          // this._nd    == optNotDomains

          // Represent options as bitmasks
          // check if value is null
          this._m1 = 0;
          // check if value is true/false
          this._m2 = 0;

          this.setMask(NETWORK_FILTER_MASK.fromAny);

          if (line !== undefined) {
            // Assign an id to the filter
            this.id = getUID();

            this.supported = true;
            this.isNetworkFilter = true;
            this.isComment = false;

            this.parse(line);
          }
        }

        _createClass(NetworkFilter, [{
          key: 'parse',
          value: function parse(line) {
            var filterIndexStart = 0;
            var filterIndexEnd = line.length;

            // @@filter == Exception
            this.setMask(NETWORK_FILTER_MASK.isException, line.startsWith('@@'));
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
                this._f = '';
                this.setMask(NETWORK_FILTER_MASK.isHostname);
                this.setMask(NETWORK_FILTER_MASK.isPlain);
                this.setMask(NETWORK_FILTER_MASK.isRegex, 0);
                this.setMask(NETWORK_FILTER_MASK.isHostnameAnchor);
              } else {
                if (line.charAt(filterIndexEnd - 1) === '|') {
                  this.setMask(NETWORK_FILTER_MASK.isRightAnchor);
                  filterIndexEnd -= 1;
                }

                if (line.startsWith('||', filterIndexStart)) {
                  this.setMask(NETWORK_FILTER_MASK.isHostnameAnchor);
                  filterIndexStart += 2;
                } else if (line.charAt(filterIndexStart) === '|') {
                  this.setMask(NETWORK_FILTER_MASK.isLeftAnchor);
                  filterIndexStart += 1;
                }

                // If pattern ends with "*", strip it as it often can be
                // transformed into a "plain pattern" this way.
                // TODO: add a test
                if (line.charAt(filterIndexEnd - 1) === '*' && filterIndexEnd - filterIndexStart > 1) {
                  filterIndexEnd -= 1;
                }

                // Is regex?
                this.setMask(NETWORK_FILTER_MASK.isRegex, isRegex(line, filterIndexStart, filterIndexEnd));
                this.setMask(NETWORK_FILTER_MASK.isPlain, !this.isRegex);

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
                    this._f = '';
                  }
                } else if (this.isRegex && this.isHostnameAnchor) {
                  // Split at the first '/', '*' or '^' character to get the hostname
                  // and then the pattern.
                  var firstSeparator = line.search(SEPARATOR);

                  if (firstSeparator !== -1) {
                    this.hostname = line.substring(filterIndexStart, firstSeparator);
                    filterIndexStart = firstSeparator;
                    this.setMask(NETWORK_FILTER_MASK.isRegex, isRegex(line, filterIndexStart, filterIndexEnd));
                    this.setMask(NETWORK_FILTER_MASK.isPlain, !this.isRegex);

                    if (filterIndexEnd - filterIndexStart === 1 && line.charAt(filterIndexStart) === '^') {
                      this._f = '';
                      this.setMask(NETWORK_FILTER_MASK.isPlain);
                      this.setMask(NETWORK_FILTER_MASK.isRegex, 0);
                    }
                  }
                }
              }

              // Strip www from hostname if present
              if (this.isHostnameAnchor && this.hostname.startsWith('www.')) {
                this.hostname = this.hostname.slice(4);
              }

              if (this._f === undefined) {
                this._f = line.substring(filterIndexStart, filterIndexEnd) || undefined;
              }

              // Compile Regex
              if (this.isRegex) {
                // If this is a regex, the `compileRegex` will be lazily called when first needed
                // using the lazy getter `get regex()` of this class.
              } else {
                  if (this.hostname) {
                    this.hostname = this.hostname.toLowerCase();
                  }
                  if (this._f) {
                    this._f = this._f.toLowerCase();
                  }
                }
            }

            // Remove it if it's empty
            if (!this._f) {
              this._f = undefined;
            }
          }
        }, {
          key: 'queryMask',
          value: function queryMask(cptCode) {
            if (isBitNotSet(this._m1, cptCode)) {
              return null;
            }
            return isBitSet(this._m2, cptCode);
          }
        }, {
          key: 'setMask',
          value: function setMask(cptCode) {
            var value = arguments.length <= 1 || arguments[1] === undefined ? 1 : arguments[1];

            this._m1 = setBit(this._m1, cptCode);
            if (value) {
              this._m2 = setBit(this._m2, cptCode);
            } else {
              this._m2 = clearBit(this._m2, cptCode);
            }
          }
        }, {
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
              log('failed to compile regex ' + filter + ' with error ' + ex + ' ' + ex.stack);
              // Regex will always fail
              return { test: function test() {
                  return false;
                } };
            }
          }
        }, {
          key: 'parseOptions',
          value: function parseOptions(rawOptions) {
            var _this = this;

            // TODO: This could be implemented without string copy,
            // using indices, like in main parsing functions.
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
                  {
                    var _ret = (function () {
                      var optDomains = [];
                      var optNotDomains = [];

                      optionValues.forEach(function (value) {
                        if (value) {
                          if (value.startsWith('~')) {
                            optNotDomains.push(value.substring(1));
                          } else {
                            optDomains.push(value);
                          }
                        }
                      });

                      if (optDomains.length > 0) {
                        _this._d = optDomains.join('|');
                      }
                      if (optNotDomains.length > 0) {
                        _this._nd = optNotDomains.join('|');
                      }

                      return 'break';
                    })();

                    if (_ret === 'break') break;
                  }
                case 'image':
                  _this.setMask(NETWORK_FILTER_MASK.fromImage, !negation);
                  break;
                case 'media':
                  _this.setMask(NETWORK_FILTER_MASK.fromMedia, !negation);
                  break;
                case 'object':
                  _this.setMask(NETWORK_FILTER_MASK.fromObject, !negation);
                  break;
                case 'object-subrequest':
                  _this.setMask(NETWORK_FILTER_MASK.fromObjectSubrequest, !negation);
                  break;
                case 'other':
                  _this.setMask(NETWORK_FILTER_MASK.fromOther, !negation);
                  break;
                case 'ping':
                  _this.setMask(NETWORK_FILTER_MASK.fromPing, !negation);
                  break;
                case 'script':
                  _this.setMask(NETWORK_FILTER_MASK.fromScript, !negation);
                  break;
                case 'stylesheet':
                  _this.setMask(NETWORK_FILTER_MASK.fromStylesheet, !negation);
                  break;
                case 'subdocument':
                  _this.setMask(NETWORK_FILTER_MASK.fromSubdocument, !negation);
                  break;
                case 'xmlhttprequest':
                  _this.setMask(NETWORK_FILTER_MASK.fromXmlHttpRequest, !negation);
                  break;
                case 'important':
                  // Note: `negation` should always be `false` here.
                  _this.setMask(NETWORK_FILTER_MASK.isImportant, 1);
                  break;
                case 'match-case':
                  // Note: `negation` should always be `false` here.
                  // TODO: Include in bitmask
                  _this.setMask(NETWORK_FILTER_MASK.matchCase, 1);
                  break;
                case 'third-party':
                  _this.setMask(NETWORK_FILTER_MASK.thirdParty, !negation);
                  break;
                case 'first-party':
                  _this.setMask(NETWORK_FILTER_MASK.firstParty, !negation);
                  break;
                case 'websocket':
                  _this.setMask(NETWORK_FILTER_MASK.fromWebsocket, !negation);
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
              }
            });

            // Check if any of the fromX flag is set
            var fromAny = this.fromImage === null && this.fromMedia === null && this.fromObject === null && this.fromObjectSubrequest === null && this.fromOther === null && this.fromPing === null && this.fromScript === null && this.fromStylesheet === null && this.fromSubdocument === null && this.fromWebsocket === null && this.fromXmlHttpRequest === null;
            this.setMask(NETWORK_FILTER_MASK.fromAny, fromAny);
          }
        }, {
          key: 'optNotDomains',
          get: function get() {
            if (this._nds === undefined) {
              if (!this._nd) {
                this._nds = new Set();
              } else if (typeof this._nd === 'string') {
                this._nds = new Set(this._nd.split('|'));
              }
            }

            return this._nds;
          }
        }, {
          key: 'optDomains',
          get: function get() {
            if (this._ds === undefined) {
              if (!this._d) {
                this._ds = new Set();
              } else if (typeof this._d === 'string') {
                this._ds = new Set(this._d.split('|'));
              }
            }

            return this._ds;
          }
        }, {
          key: 'regex',
          get: function get() {
            if (this._r === undefined) {
              this._r = this.compileRegex(this._f);
            }

            return this._r;
          }
        }, {
          key: 'hostname',
          set: function set(value) {
            this._h = value;
          },
          get: function get() {
            return this._h;
          }
        }, {
          key: 'filterStr',
          set: function set(value) {
            this._f = value;
          },
          get: function get() {
            return this._f || '';
          }
        }, {
          key: 'isException',
          get: function get() {
            return this.queryMask(NETWORK_FILTER_MASK.isException) === true;
          }
        }, {
          key: 'isHostnameAnchor',
          get: function get() {
            return this.queryMask(NETWORK_FILTER_MASK.isHostnameAnchor) === true;
          }
        }, {
          key: 'isRightAnchor',
          get: function get() {
            return this.queryMask(NETWORK_FILTER_MASK.isRightAnchor) === true;
          }
        }, {
          key: 'isLeftAnchor',
          get: function get() {
            return this.queryMask(NETWORK_FILTER_MASK.isLeftAnchor) === true;
          }
        }, {
          key: 'matchCase',
          get: function get() {
            return this.queryMask(NETWORK_FILTER_MASK.matchCase) === true;
          }
        }, {
          key: 'isImportant',
          get: function get() {
            return this.queryMask(NETWORK_FILTER_MASK.isImportant) === true;
          }
        }, {
          key: 'isRegex',
          get: function get() {
            return this.queryMask(NETWORK_FILTER_MASK.isRegex) === true;
          }
        }, {
          key: 'isPlain',
          get: function get() {
            return this.queryMask(NETWORK_FILTER_MASK.isPlain) === true;
          }
        }, {
          key: 'isHostname',
          get: function get() {
            return this.queryMask(NETWORK_FILTER_MASK.isHostname) === true;
          }
        }, {
          key: 'fromAny',
          get: function get() {
            return this.queryMask(NETWORK_FILTER_MASK.fromAny) === true;
          }
        }, {
          key: 'thirdParty',
          get: function get() {
            return this.queryMask(NETWORK_FILTER_MASK.thirdParty);
          }
        }, {
          key: 'firstParty',
          get: function get() {
            return this.queryMask(NETWORK_FILTER_MASK.firstParty);
          }
        }, {
          key: 'fromImage',
          get: function get() {
            return this.queryMask(NETWORK_FILTER_MASK.fromImage);
          }
        }, {
          key: 'fromMedia',
          get: function get() {
            return this.queryMask(NETWORK_FILTER_MASK.fromMedia);
          }
        }, {
          key: 'fromObject',
          get: function get() {
            return this.queryMask(NETWORK_FILTER_MASK.fromObject);
          }
        }, {
          key: 'fromObjectSubrequest',
          get: function get() {
            return this.queryMask(NETWORK_FILTER_MASK.fromObjectSubrequest);
          }
        }, {
          key: 'fromOther',
          get: function get() {
            return this.queryMask(NETWORK_FILTER_MASK.fromOther);
          }
        }, {
          key: 'fromPing',
          get: function get() {
            return this.queryMask(NETWORK_FILTER_MASK.fromPing);
          }
        }, {
          key: 'fromScript',
          get: function get() {
            return this.queryMask(NETWORK_FILTER_MASK.fromScript);
          }
        }, {
          key: 'fromStylesheet',
          get: function get() {
            return this.queryMask(NETWORK_FILTER_MASK.fromStylesheet);
          }
        }, {
          key: 'fromSubdocument',
          get: function get() {
            return this.queryMask(NETWORK_FILTER_MASK.fromSubdocument);
          }
        }, {
          key: 'fromWebsocket',
          get: function get() {
            return this.queryMask(NETWORK_FILTER_MASK.fromWebsocket);
          }
        }, {
          key: 'fromXmlHttpRequest',
          get: function get() {
            return this.queryMask(NETWORK_FILTER_MASK.fromXmlHttpRequest);
          }
        }]);

        return NetworkFilter;
      })();

      SPACE = /\s/;
    }
  };
});