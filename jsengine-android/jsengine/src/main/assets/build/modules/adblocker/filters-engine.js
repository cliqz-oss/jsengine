System.register('adblocker/filters-engine', ['antitracking/url', 'adblocker/utils', 'adblocker/filters-parsing', 'adblocker/filters-matching'], function (_export) {
  'use strict';

  var URLInfo, log, parseList, parseJSResource, serializeFilter, deserializeFilter, matchNetworkFilter, matchCosmeticFilter, TLDs, TOKEN_BLACKLIST, FuzzyIndex, FilterReverseIndex, FilterHostnameDispatch, FilterSourceDomainDispatch, CosmeticBucket, CosmeticEngine, _default;

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  _export('tokenizeURL', tokenizeURL);

  _export('serializeFiltersEngine', serializeFiltersEngine);

  _export('deserializeFiltersEngine', deserializeFiltersEngine);

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

  function tokenizeHostname(hostname) {
    return hostname.split('.').filter(function (token) {
      return token && !TLDs[token] && !TOKEN_BLACKLIST.has(token);
    });
  }

  function tokenizeURL(pattern) {
    return (pattern.match(/[a-zA-Z0-9]+/g) || []).filter(function (token) {
      return token.length > 1;
    });
  }

  function serializeFuzzyIndex(fi, serializeBucket) {
    var index = Object.create(null);
    fi.index.forEach(function (value, key) {
      index[key] = serializeBucket(value);
    });

    return {
      i: index,
      o: fi.indexOnlyOne,
      s: fi.size
    };
  }

  function deserializeFuzzyIndex(fi, serialized, deserializeBucket) {
    var index = serialized.i;
    var indexOnlyOne = serialized.o;
    var size = serialized.s;

    Object.keys(index).forEach(function (key) {
      var value = index[key];
      fi.index.set(key, deserializeBucket(value));
    });

    fi.size = size;
    fi.indexOnlyOne = indexOnlyOne;
  }

  /* A filter reverse index is the lowest level of optimization we apply on filter
   * matching. To avoid inspecting filters that have no chance of matching, we
   * dispatch them in an index { ngram -> list of filter }.
   *
   * When we need to know if there is a match for an URL, we extract ngrams from it
   * and find all the buckets for which filters contains at list one of the ngram of
   * the URL. We then stop at the first match.
   */

  function serializeFilterReverseIndex(fri) {
    return {
      n: fri.name,
      s: fri.size,
      m: fri.miscFilters.map(function (filter) {
        return filter.id;
      }),
      i: serializeFuzzyIndex(fri.index, function (bucket) {
        return bucket.map(function (filter) {
          return filter.id;
        });
      })
    };
  }

  function deserializeFilterReverseIndex(serialized, filtersIndex) {
    var name = serialized.n;
    var size = serialized.s;
    var miscFilters = serialized.m;
    var index = serialized.i;

    var fri = new FilterReverseIndex(name);
    fri.size = size;
    fri.miscFilters = miscFilters.map(function (id) {
      return filtersIndex[id];
    });
    deserializeFuzzyIndex(fri.index, index, function (bucket) {
      return bucket.map(function (id) {
        return filtersIndex[id];
      });
    });
    return fri;
  }

  /* A Bucket manages a subsets of all the filters. To avoid matching too many
   * useless filters, there is a second level of dispatch here.
   *
   * [ hostname anchors (||filter) ]    [ remaining filters ]
   *
   * The first structure map { domain -> filters that apply only on domain }
   * as the `hostname anchors` only apply on a specific domain name.
   *
   * Each group of filters is stored in a Filter index that is the last level
   * of dispatch of our matching engine.
   */

  function serializeFilterHostnameDispatch(fhd) {
    return {
      n: fhd.name,
      s: fhd.size,
      h: serializeFuzzyIndex(fhd.hostnameAnchors, function (bucket) {
        return serializeFilterReverseIndex(bucket);
      }),
      f: serializeFilterReverseIndex(fhd.filters)
    };
  }

  function deserializeFilterHostnameDispatch(serialized, filtersIndex) {
    var name = serialized.n;
    var size = serialized.s;
    var hostnameAnchors = serialized.h;
    var filters = serialized.f;

    var fhd = new FilterHostnameDispatch(name);
    fhd.size = size;
    fhd.filters = deserializeFilterReverseIndex(filters, filtersIndex);
    deserializeFuzzyIndex(fhd.hostnameAnchors, hostnameAnchors, function (bucket) {
      return deserializeFilterReverseIndex(bucket, filtersIndex);
    });
    return fhd;
  }

  function serializeSourceDomainDispatch(sdd) {
    var sourceDomainDispatch = Object.create(null);
    sdd.sourceDomainDispatch.forEach(function (value, key) {
      sourceDomainDispatch[key] = serializeFilterHostnameDispatch(value);
    });

    return {
      sd: sourceDomainDispatch,
      m: serializeFilterHostnameDispatch(sdd.miscFilters),
      n: sdd.name,
      s: sdd.size
    };
  }

  function deserializeSourceDomainDispatch(serialized, filtersIndex) {
    var sourceDomainDispatch = serialized.sd;
    var miscFilters = serialized.m;
    var name = serialized.n;
    var size = serialized.s;

    var sdd = new FilterSourceDomainDispatch(name);

    sdd.size = size;
    sdd.miscFilters = deserializeFilterHostnameDispatch(miscFilters, filtersIndex);
    Object.keys(sourceDomainDispatch).forEach(function (key) {
      var value = sourceDomainDispatch[key];
      sdd.sourceDomainDispatch.set(key, deserializeFilterHostnameDispatch(value, filtersIndex));
    });

    return sdd;
  }

  /**
   * Dispatch cosmetics filters on selectors
   */

  function serializeCosmeticBucket(cb) {
    return {
      n: cb.name,
      s: cb.size,
      m: cb.miscFilters.map(function (filter) {
        return filter.id;
      }),
      i: serializeFuzzyIndex(cb.index, function (bucket) {
        return bucket.map(function (filter) {
          return filter.id;
        });
      })
    };
  }

  function deserializeCosmeticBucket(serialized, filtersIndex) {
    var name = serialized.n;
    var size = serialized.s;
    var miscFilters = serialized.m;
    var index = serialized.i;

    var cb = new CosmeticBucket(name);
    cb.size = size;
    cb.miscFilters = miscFilters.map(function (id) {
      return filtersIndex[id];
    });
    deserializeFuzzyIndex(cb.index, index, function (bucket) {
      return bucket.map(function (id) {
        return filtersIndex[id];
      });
    });
    return cb;
  }

  function serializeCosmeticEngine(cosmetics) {
    return {
      s: cosmetics.size,
      m: serializeCosmeticBucket(cosmetics.miscFilters),
      c: serializeFuzzyIndex(cosmetics.cosmetics, serializeCosmeticBucket)
    };
  }

  function deserializeCosmeticEngine(engine, serialized, filtersIndex) {
    var size = serialized.s;
    var miscFilters = serialized.m;
    var cosmetics = serialized.c;

    engine.size = size;
    engine.miscFilters = deserializeCosmeticBucket(miscFilters, filtersIndex);
    deserializeFuzzyIndex(engine.cosmetics, cosmetics, function (bucket) {
      return deserializeCosmeticBucket(bucket, filtersIndex);
    });
  }

  /* Manage a list of filters and match them in an efficient way.
   * To avoid inspecting to many filters for each request, we create
   * the following accelerating structure:
   *
   * [ Importants ]    [ Exceptions ] [ Redirect ] [ Remaining filters ]
   *
   * Each of theses is a `FilterHostnameDispatch`, which manage a subset of filters.
   *
   * Importants filters are not subject to exceptions, hence we try it first.
   * If no important filter matched, try to use the remaining filters bucket.
   * If we have a match, try to find an exception.
   */

  function checkEngineRec(serialized, validFilterIds) {
    Object.keys(serialized).filter(function (key) {
      return key !== 's';
    }).forEach(function (key) {
      var value = serialized[key];
      if (typeof value === 'number') {
        if (validFilterIds[value] === undefined) {
          throw new Error('Filter ' + serialized + ' was not found in serialized engine');
        }
      } else if (typeof value === 'object') {
        checkEngineRec(value, validFilterIds);
      }
    });
  }

  function serializedEngineSanityCheck(serialized) {
    var cosmetics = serialized.cosmetics;
    var filtersIndex = serialized.filtersIndex;
    var exceptions = serialized.exceptions;
    var importants = serialized.importants;
    var redirect = serialized.redirect;
    var filters = serialized.filters;

    [cosmetics, exceptions, importants, redirect, filters].forEach(function (bucket) {
      checkEngineRec(bucket, filtersIndex);
    });
  }

  function serializeFiltersEngine(engine, adbVersion) {
    var checkEngine = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];

    // Create a global index of filters to avoid redundancy
    // From `engine.lists` create a mapping: uid => filter
    var filters = Object.create(null);
    engine.lists.forEach(function (entry) {
      Object.keys(entry).filter(function (key) {
        return entry[key] instanceof Array;
      }).forEach(function (key) {
        entry[key].forEach(function (filter) {
          filters[filter.id] = serializeFilter(filter);
        });
      });
    });

    // Serialize `engine.lists` but replacing each filter by its uid
    var lists = Object.create(null);
    engine.lists.forEach(function (entry, asset) {
      lists[asset] = { checksum: entry.checksum };
      Object.keys(entry).filter(function (key) {
        return entry[key] instanceof Array;
      }).forEach(function (key) {
        lists[asset][key] = entry[key].map(function (filter) {
          return filter.id;
        });
      });
    });

    var serializedEngine = {
      version: adbVersion,
      cosmetics: serializeCosmeticEngine(engine.cosmetics),
      filtersIndex: filters,
      size: engine.size,
      lists: lists,
      exceptions: serializeSourceDomainDispatch(engine.exceptions),
      importants: serializeSourceDomainDispatch(engine.importants),
      redirect: serializeSourceDomainDispatch(engine.redirect),
      filters: serializeSourceDomainDispatch(engine.filters)
    };

    if (checkEngine) {
      serializedEngineSanityCheck(serializedEngine);
    }

    return serializedEngine;
  }

  function deserializeFiltersEngine(engine, serialized, adbVersion) {
    var checkEngine = arguments.length <= 3 || arguments[3] === undefined ? false : arguments[3];

    if (checkEngine) {
      serializedEngineSanityCheck(serialized);
    }

    var version = serialized.version;
    var cosmetics = serialized.cosmetics;
    var filtersIndex = serialized.filtersIndex;
    var size = serialized.size;
    var lists = serialized.lists;
    var exceptions = serialized.exceptions;
    var importants = serialized.importants;
    var redirect = serialized.redirect;
    var filters = serialized.filters;

    if (version !== adbVersion) {
      // If the version does not match, then we invalidate the engine and start fresh
      return;
    }

    // Deserialize filters index
    var filtersReverseIndex = Object.create(null);
    Object.keys(filtersIndex).forEach(function (id) {
      filtersReverseIndex[id] = deserializeFilter(filtersIndex[id]);
    });

    // Deserialize engine.lists
    Object.keys(lists).forEach(function (asset) {
      var entry = lists[asset];
      Object.keys(entry).filter(function (key) {
        return entry[key] instanceof Array;
      }).forEach(function (key) {
        entry[key] = entry[key].map(function (id) {
          return filtersReverseIndex[id];
        });
      });
      engine.lists.set(asset, entry);
    });

    // Deserialize cosmetic engine and filters
    deserializeCosmeticEngine(engine.cosmetics, cosmetics, filtersReverseIndex);
    engine.exceptions = deserializeSourceDomainDispatch(exceptions, filtersReverseIndex);
    engine.importants = deserializeSourceDomainDispatch(importants, filtersReverseIndex);
    engine.redirect = deserializeSourceDomainDispatch(redirect, filtersReverseIndex);
    engine.filters = deserializeSourceDomainDispatch(filters, filtersReverseIndex);
    engine.size = size;
  }

  return {
    setters: [function (_antitrackingUrl) {
      URLInfo = _antitrackingUrl.URLInfo;
    }, function (_adblockerUtils) {
      log = _adblockerUtils['default'];
    }, function (_adblockerFiltersParsing) {
      parseList = _adblockerFiltersParsing['default'];
      parseJSResource = _adblockerFiltersParsing.parseJSResource;
      serializeFilter = _adblockerFiltersParsing.serializeFilter;
      deserializeFilter = _adblockerFiltersParsing.deserializeFilter;
    }, function (_adblockerFiltersMatching) {
      matchNetworkFilter = _adblockerFiltersMatching.matchNetworkFilter;
      matchCosmeticFilter = _adblockerFiltersMatching.matchCosmeticFilter;
      TLDs = _adblockerFiltersMatching.TLDs;
    }],
    execute: function () {
      TOKEN_BLACKLIST = new Set(['com', 'http', 'https', 'icon', 'images', 'img', 'js', 'net', 'news', 'www']);

      FuzzyIndex = (function () {
        function FuzzyIndex(tokenizer, buildBucket, indexOnlyOne) {
          _classCallCheck(this, FuzzyIndex);

          // Define tokenizer
          this.tokenizer = tokenizer;
          if (this.tokenizer === undefined) {
            this.tokenizer = function (key, cb) {
              tokenizeURL(key).forEach(cb);
            };
          }

          // Should we index with all tokens, or just one
          this.indexOnlyOne = indexOnlyOne;

          // Function used to create a new bucket
          this.buildBucket = buildBucket;
          if (this.buildBucket === undefined) {
            this.buildBucket = function () {
              return [];
            };
          }

          // {token -> list of values}
          this.index = new Map();
          this.size = 0;
        }

        _createClass(FuzzyIndex, [{
          key: 'set',
          value: function set(key, value) {
            var _this = this;

            // Only true if we insert something (we have at least 1 token)
            log('SET ' + key + ' => ' + JSON.stringify(value));
            var inserted = false;
            var insertValue = function insertValue(token) {
              log('FOUND TOKEN ' + token);
              if (!(_this.indexOnlyOne && inserted)) {
                inserted = true;
                var bucket = _this.index.get(token);
                if (bucket === undefined) {
                  var newBucket = _this.buildBucket(token);
                  newBucket.push(value);
                  _this.index.set(token, newBucket);
                } else {
                  bucket.push(value);
                }
              }
            };

            // Split tokens into good, common, tld
            // common: too common tokens
            // tld: corresponding to hostname extensions
            // good: anything else
            // TODO: What about trying to insert bigger tokens first?
            var goodTokens = [];
            var commonTokens = [];
            var tldTokens = [];
            this.tokenizer(key, function (token) {
              if (TOKEN_BLACKLIST.has(token)) {
                commonTokens.push(token);
              } else if (TLDs[token]) {
                tldTokens.push(token);
              } else {
                goodTokens.push(token);
              }
            });

            // Try to insert
            goodTokens.forEach(insertValue);
            if (!inserted) {
              tldTokens.forEach(insertValue);
            }
            if (!inserted) {
              commonTokens.forEach(insertValue);
            }

            if (inserted) {
              this.size += 1;
            }

            return inserted;
          }
        }, {
          key: 'getFromKey',
          value: function getFromKey(key) {
            var _this2 = this;

            var buckets = [];
            this.tokenizer(key, function (token) {
              var bucket = _this2.index.get(token);
              if (bucket !== undefined) {
                log('BUCKET ' + token + ' size ' + bucket.length);
                buckets.push(bucket);
              }
            });
            return buckets;
          }
        }, {
          key: 'getFromTokens',
          value: function getFromTokens(tokens) {
            var _this3 = this;

            var buckets = [];
            tokens.forEach(function (token) {
              var bucket = _this3.index.get(token);
              if (bucket !== undefined) {
                log('BUCKET ' + token + ' size ' + bucket.length);
                buckets.push(bucket);
              }
            });
            return buckets;
          }
        }, {
          key: 'length',
          get: function get() {
            return this.size;
          }
        }]);

        return FuzzyIndex;
      })();

      FilterReverseIndex = (function () {
        function FilterReverseIndex(name, filters) {
          _classCallCheck(this, FilterReverseIndex);

          // Name of this index (for debugging purpose)
          this.name = name;

          // Remaining filters not stored in the index
          this.miscFilters = [];
          this.size = 0;

          // Tokenizer used on patterns for fuzzy matching
          this.tokenizer = function (pattern, cb) {
            pattern.split(/[*^]/g).forEach(function (part) {
              tokenizeURL(part).forEach(cb);
            });
          };
          this.index = new FuzzyIndex(this.tokenizer, undefined, true);

          // Update index
          if (filters) {
            filters.forEach(this.push.bind(this));
          }
        }

        _createClass(FilterReverseIndex, [{
          key: 'push',
          value: function push(filter) {
            log('REVERSE INDEX ' + this.name + ' INSERT ' + JSON.stringify(filter));
            this.size += 1;
            var inserted = false;
            if (filter.filterStr) {
              inserted = this.index.set(filter.filterStr, filter);
            }

            if (!inserted) {
              log(this.name + ' MISC FILTER ' + JSON.stringify(filter));
              this.miscFilters.push(filter);
            }
          }
        }, {
          key: 'matchList',
          value: function matchList(request, list, checkedFilters) {
            for (var i = 0; i < list.length; i += 1) {
              var filter = list[i];
              if (!checkedFilters.has(filter.id)) {
                checkedFilters.add(filter.id);
                if (matchNetworkFilter(filter, request)) {
                  log('INDEX ' + this.name + ' MATCH ' + JSON.stringify(filter) + ' ~= ' + request.url);
                  return filter;
                }
              }
            }
            return null;
          }
        }, {
          key: 'match',
          value: function match(request, checkedFilters) {
            // Keep track of filters checked
            if (checkedFilters === undefined) {
              checkedFilters = new Set();
            }

            var buckets = this.index.getFromTokens(request.tokens);

            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
              for (var _iterator = buckets[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var bucket = _step.value;

                log('INDEX ' + this.name + ' BUCKET => ' + bucket.length);
                var result = this.matchList(request, bucket, checkedFilters);
                if (result !== null) {
                  return result;
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

            log('INDEX ' + this.name + ' ' + this.miscFilters.length + ' remaining filters checked');

            // If no match found, check regexes
            return this.matchList(request, this.miscFilters, checkedFilters);
          }
        }, {
          key: 'length',
          get: function get() {
            return this.size;
          }
        }]);

        return FilterReverseIndex;
      })();

      FilterHostnameDispatch = (function () {
        function FilterHostnameDispatch(name, filters) {
          _classCallCheck(this, FilterHostnameDispatch);

          // TODO: Dispatch also on:
          // - fromImage
          // - fromMedia
          // - fromObject
          // - fromObjectSubrequest
          // - fromOther
          // - fromPing
          // - fromScript
          // - fromStylesheet
          // - fromXmlHttpRequest
          // To avoid matching filter if request type doesn't match
          // If we do it, we could simplify the match function of Filter

          this.name = name;
          this.size = 0;

          // ||hostname filter
          this.hostnameAnchors = new FuzzyIndex(
          // Tokenize key
          function (hostname, cb) {
            tokenizeHostname(hostname).forEach(cb);
          },
          // Create a new empty bucket
          function (token) {
            return new FilterReverseIndex(token + '_' + name);
          });

          // All other filters
          this.filters = new FilterReverseIndex(this.name);

          // Dispatch filters
          if (filters !== undefined) {
            filters.forEach(this.push.bind(this));
          }

          log(name + ' CREATE BUCKET: ' + this.filters.length + ' filters +' + (this.hostnameAnchors.size + ' hostnames'));
        }

        _createClass(FilterHostnameDispatch, [{
          key: 'push',
          value: function push(filter) {
            this.size += 1;

            var inserted = false;
            if (filter.hostname) {
              inserted = this.hostnameAnchors.set(filter.hostname, filter);
            }

            if (!inserted) {
              this.filters.push(filter);
            }
          }
        }, {
          key: 'matchWithDomain',
          value: function matchWithDomain(request, domain, checkedFilters) {
            var buckets = this.hostnameAnchors.getFromKey(domain);
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
              for (var _iterator2 = buckets[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                var bucket = _step2.value;

                if (bucket !== undefined) {
                  log(this.name + ' bucket try to match hostnameAnchors (' + domain + '/' + bucket.name + ')');
                  var result = bucket.match(request, checkedFilters);
                  if (result !== null) {
                    return result;
                  }
                }
              }
            } catch (err) {
              _didIteratorError2 = true;
              _iteratorError2 = err;
            } finally {
              try {
                if (!_iteratorNormalCompletion2 && _iterator2['return']) {
                  _iterator2['return']();
                }
              } finally {
                if (_didIteratorError2) {
                  throw _iteratorError2;
                }
              }
            }

            return null;
          }
        }, {
          key: 'match',
          value: function match(request, checkedFilters) {
            if (checkedFilters === undefined) {
              checkedFilters = new Set();
            }

            var result = this.matchWithDomain(request, request.hostname, checkedFilters);
            if (result === null) {
              // Try to find a match with remaining filters
              log(this.name + ' bucket try to match misc');
              result = this.filters.match(request, checkedFilters);
            }

            return result;
          }
        }, {
          key: 'length',
          get: function get() {
            return this.size;
          }
        }]);

        return FilterHostnameDispatch;
      })();

      FilterSourceDomainDispatch = (function () {
        function FilterSourceDomainDispatch(name, filters) {
          _classCallCheck(this, FilterSourceDomainDispatch);

          this.name = name;
          this.size = 0;

          // Dispatch on source domain
          this.sourceDomainDispatch = new Map();
          // Filters without source domain specified
          this.miscFilters = new FilterHostnameDispatch(this.name);

          if (filters) {
            filters.forEach(this.push.bind(this));
          }
        }

        _createClass(FilterSourceDomainDispatch, [{
          key: 'push',
          value: function push(filter) {
            var _this4 = this;

            this.size += 1;

            if (filter.optNotDomains.length === 0 && filter.optDomains.length > 0) {
              filter.optDomains.split('|').forEach(function (domain) {
                log('SOURCE DOMAIN DISPATCH ' + domain + ' filter: ' + JSON.stringify(filter));
                var bucket = _this4.sourceDomainDispatch.get(domain);
                if (bucket === undefined) {
                  var newIndex = new FilterHostnameDispatch(_this4.name + '_' + domain);
                  newIndex.push(filter);
                  _this4.sourceDomainDispatch.set(domain, newIndex);
                } else {
                  bucket.push(filter);
                }
              });
            } else {
              this.miscFilters.push(filter);
            }
          }
        }, {
          key: 'match',
          value: function match(request, checkedFilters) {
            // Check bucket for source domain
            var bucket = this.sourceDomainDispatch.get(request.sourceGD);
            var result = null;
            if (bucket !== undefined) {
              log('Source domain dispatch ' + request.sourceGD + ' size ' + bucket.length);
              result = bucket.match(request, checkedFilters);
            }

            if (result === null) {
              log('Source domain dispatch misc size ' + this.miscFilters.length);
              result = this.miscFilters.match(request, checkedFilters);
            }

            return result;
          }
        }, {
          key: 'length',
          get: function get() {
            return this.size;
          }
        }]);

        return FilterSourceDomainDispatch;
      })();

      CosmeticBucket = (function () {
        function CosmeticBucket(name, filters) {
          _classCallCheck(this, CosmeticBucket);

          this.name = name;
          this.size = 0;

          this.miscFilters = [];
          this.index = new FuzzyIndex(function (selector, cb) {
            selector.split(/[^#.\w_-]/g).filter(function (token) {
              return token.length > 0;
            }).forEach(cb);
          });

          if (filters) {
            filters.forEach(this.push.bind(this));
          }
        }

        _createClass(CosmeticBucket, [{
          key: 'push',
          value: function push(filter) {
            this.size += 1;
            var inserted = this.index.set(filter.selector, filter);

            if (!inserted) {
              this.miscFilters.push(filter);
            }
          }

          /**
           * Return element hiding rules and exception rules
           * @param {string} hostname - domain of the page.
           * @param {Array} nodeInfo - Array of tuples [id, tagName, className].
          **/
        }, {
          key: 'getMatchingRules',
          value: function getMatchingRules(hostname, nodeInfo) {
            var _this5 = this;

            var rules = [];
            var uniqIds = new Set();

            // Deal with misc filters
            this.miscFilters.filter(function (rule) {
              return matchCosmeticFilter(rule, hostname);
            }).forEach(function (rule) {
              if (!uniqIds.has(rule.id)) {
                rules.push(rule);
                uniqIds.add(rule.id);
              }
            });

            // Find other matching rules in engine
            nodeInfo.forEach(function (node) {
              // [id, tagName, className] = node
              node.forEach(function (token) {
                _this5.index.getFromKey(token).forEach(function (bucket) {
                  bucket.forEach(function (rule) {
                    if (!uniqIds.has(rule.id) && matchCosmeticFilter(rule, hostname)) {
                      rules.push(rule);
                      uniqIds.add(rule.id);
                    }
                  });
                });
              });
            });

            var matchingRules = {};
            function addRule(rule, matchingHost, exception) {
              var value = { rule: rule, matchingHost: matchingHost, exception: exception };
              if (rule.selector in matchingRules) {
                var oldMatchingHost = matchingRules[rule.selector].matchingHost;
                if (matchingHost.length > oldMatchingHost.length) {
                  matchingRules[rule.selector] = value;
                }
              } else {
                matchingRules[rule.selector] = value;
              }
            }

            // filter by hostname
            rules.forEach(function (rule) {
              if (rule.hostnames.length === 0) {
                addRule(rule, '', false);
              } else {
                rule.hostnames.forEach(function (h) {
                  var exception = false;
                  if (h.startsWith('~')) {
                    exception = true;
                    h = h.substr(1);
                  }
                  if (rule.unhide) {
                    exception = true;
                  }
                  if (hostname === h || hostname.endsWith('.' + h)) {
                    addRule(rule, h, exception);
                  }
                });
              }
            });

            return matchingRules;
          }
        }, {
          key: 'length',
          get: function get() {
            return this.size;
          }
        }]);

        return CosmeticBucket;
      })();

      CosmeticEngine = (function () {
        function CosmeticEngine(filters) {
          var _this6 = this;

          _classCallCheck(this, CosmeticEngine);

          this.size = 0;

          this.miscFilters = new CosmeticBucket('misc');
          this.cosmetics = new FuzzyIndex(function (hostname, cb) {
            tokenizeHostname(hostname).forEach(cb);
          }, function (token) {
            return new CosmeticBucket(token + '_cosmetics');
          });

          if (filters) {
            filters.forEach(function (filter) {
              return _this6.push(filter);
            });
          }
        }

        _createClass(CosmeticEngine, [{
          key: 'push',
          value: function push(filter) {
            var _this7 = this;

            var inserted = false;
            this.size += 1;

            if (filter.hostnames.length > 0) {
              filter.hostnames.forEach(function (hostname) {
                inserted = _this7.cosmetics.set(hostname, filter) || inserted;
              });
            }

            if (!inserted) {
              this.miscFilters.push(filter);
            }
          }

          /**
           * Return a list of potential cosmetics filters
           *
           * @param {string} url - url of the page.
           * @param {Array} nodeInfo - Array of tuples [id, tagName, className].
          **/
        }, {
          key: 'getMatchingRules',
          value: function getMatchingRules(url, nodeInfo) {
            var uniqIds = new Set();
            var rules = [];
            var hostname = URLInfo.get(url).hostname;
            if (hostname.startsWith('www.')) {
              hostname = hostname.substr(4);
            }
            log('getMatchingRules ' + url + ' => ' + hostname + ' (' + JSON.stringify(nodeInfo) + ')');

            // Check misc bucket
            var miscMatchingRules = this.miscFilters.getMatchingRules(hostname, nodeInfo);

            // Check hostname buckets
            this.cosmetics.getFromKey(hostname).forEach(function (bucket) {
              log('Found bucket ' + bucket.size);
              var matchingRules = bucket.getMatchingRules(hostname, nodeInfo);
              Object.keys(matchingRules).forEach(function (selector) {
                var r = matchingRules[selector];
                if (!r.exception && !uniqIds.has(r.rule.id)) {
                  rules.push(r.rule);
                  uniqIds.add(r.rule.id);
                } else if (selector in miscMatchingRules) {
                  // handle exception rules
                  delete miscMatchingRules[selector];
                }
              });
            });

            Object.keys(miscMatchingRules).forEach(function (selector) {
              rules.push(miscMatchingRules[selector].rule);
            });

            log('COSMETICS found ' + rules.length + ' potential rules for ' + url);
            return rules;
          }

          /**
           * Return all the cosmetic filters on a domain
           *
           * @param {string} url - url of the page
          **/
        }, {
          key: 'getDomainRules',
          value: function getDomainRules(url, js) {
            var hostname = URLInfo.get(url).hostname;
            var rules = [];
            var uniqIds = new Set();
            log('getDomainRules ' + url + ' => ' + hostname);
            this.cosmetics.getFromKey(hostname).forEach(function (bucket) {
              var _iteratorNormalCompletion3 = true;
              var _didIteratorError3 = false;
              var _iteratorError3 = undefined;

              try {
                for (var _iterator3 = bucket.index.index.values()[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                  var value = _step3.value;

                  value.forEach(function (rule) {
                    if (!uniqIds.has(rule.id)) {
                      // check if one of the preceeding rules has the same selector
                      var selectorMatched = rules.find(function (r) {
                        return r.unhide !== rule.unhide && r.selector === rule.selector;
                      });
                      if (!selectorMatched) {
                        // if not then check if it should be added to the rules
                        if (rule.scriptInject) {
                          // make sure the selector was replaced by javascript
                          if (!rule.scriptReplaced) {
                            if (rule.selector.includes(',')) {
                              rule.scriptArguments = rule.selector.split(',').slice(1).map(String.trim);
                              rule.selector = rule.selector.split(',')[0];
                            }
                            rule.selector = js.get(rule.selector);
                            if (rule.scriptArguments) {
                              rule.scriptArguments.forEach(function (e, idx) {
                                rule.selector = rule.selector.replace('{{' + ++idx + '}}', e);
                              });
                            }
                            rule.scriptReplaced = true;
                          }
                        }
                        if (rule.selector) {
                          rules.push(rule);
                          uniqIds.add(rule.id);
                        }
                      } else {
                        // otherwise, then this implies that the two rules
                        // negating each others and should be removed
                        rules.splice(rules.indexOf(selectorMatched), 1);
                        uniqIds.add(rule.id);
                      }
                    }
                  });
                }
              } catch (err) {
                _didIteratorError3 = true;
                _iteratorError3 = err;
              } finally {
                try {
                  if (!_iteratorNormalCompletion3 && _iterator3['return']) {
                    _iterator3['return']();
                  }
                } finally {
                  if (_didIteratorError3) {
                    throw _iteratorError3;
                  }
                }
              }
            });
            return rules;
          }
        }, {
          key: 'length',
          get: function get() {
            return this.size;
          }
        }]);

        return CosmeticEngine;
      })();

      _default = (function () {
        function _default() {
          _classCallCheck(this, _default);

          this.lists = new Map();
          this.resourceChecksum = null;

          this.size = 0;
          this.updated = false;

          // *************** //
          // Network filters //
          // *************** //

          // @@filter
          this.exceptions = new FilterSourceDomainDispatch('exceptions');
          // $important
          this.importants = new FilterSourceDomainDispatch('importants');
          // $redirect
          this.redirect = new FilterSourceDomainDispatch('redirect');
          // All other filters
          this.filters = new FilterSourceDomainDispatch('filters');

          // ***************** //
          // Cosmetic filters  //
          // ***************** //

          this.cosmetics = new CosmeticEngine();

          // injections
          this.js = new Map();
          this.resources = new Map();
        }

        _createClass(_default, [{
          key: 'hasList',
          value: function hasList(asset, checksum) {
            if (this.lists.has(asset)) {
              return this.lists.get(asset).checksum === checksum;
            }
            return false;
          }
        }, {
          key: 'onUpdateResource',
          value: function onUpdateResource(updates) {
            var _this8 = this;

            updates.forEach(function (resource) {
              var filters = resource.filters;
              var checksum = resource.checksum;

              // NOTE: Here we can only handle one resource file at a time.
              _this8.resourceChecksum = checksum;
              var typeToResource = parseJSResource(filters);

              // the resource containing javascirpts to be injected
              if (typeToResource.has('application/javascript')) {
                _this8.js = typeToResource.get('application/javascript');
              }

              // Create a mapping from resource name to { contentType, data }
              // used for request redirection.
              typeToResource.forEach(function (resources, contentType) {
                resources.forEach(function (data, name) {
                  _this8.resources.set(name, {
                    contentType: contentType,
                    data: data
                  });
                });
              });
            });
          }
        }, {
          key: 'onUpdateFilters',
          value: function onUpdateFilters(lists) {
            var _this9 = this;

            var debug = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

            // Mark the engine as updated, so that it will be serialized on disk
            if (lists.length > 0) {
              this.updated = true;
            }

            // Check if one of the list is an update to an existing list
            var update = false;
            lists.forEach(function (list) {
              var asset = list.asset;

              if (_this9.lists.has(asset)) {
                update = true;
              }
            });

            // Parse all filters and update `this.lists`
            lists.forEach(function (list) {
              var asset = list.asset;
              var filters = list.filters;
              var checksum = list.checksum;

              // Network filters
              var miscFilters = [];
              var exceptions = [];
              var importants = [];
              var redirect = [];

              // Parse and dispatch filters depending on type
              var parsed = parseList(filters, debug);

              // Cosmetic filters
              var cosmetics = parsed.cosmeticFilters;

              parsed.networkFilters.forEach(function (filter) {
                if (filter.isException) {
                  exceptions.push(filter);
                } else if (filter.isImportant) {
                  importants.push(filter);
                } else if (filter.redirect) {
                  redirect.push(filter);
                } else {
                  miscFilters.push(filter);
                }
              });

              _this9.lists.set(asset, {
                checksum: checksum,
                filters: miscFilters,
                exceptions: exceptions,
                importants: importants,
                redirect: redirect,
                cosmetics: cosmetics
              });
            });

            // Update the engine with new rules

            if (update) {
              (function () {
                // If it's an update then recreate the whole engine
                var allFilters = {
                  filters: [],
                  exceptions: [],
                  importants: [],
                  redirect: [],
                  cosmetics: []
                };

                var newSize = 0;
                _this9.lists.forEach(function (list) {
                  Object.keys(list).filter(function (key) {
                    return list[key] instanceof Array;
                  }).forEach(function (key) {
                    list[key].forEach(function (filter) {
                      newSize += 1;
                      allFilters[key].push(filter);
                    });
                  });
                });

                _this9.size = newSize;
                _this9.filters = new FilterSourceDomainDispatch('filters', allFilters.filters);
                _this9.exceptions = new FilterSourceDomainDispatch('exceptions', allFilters.exceptions);
                _this9.importants = new FilterSourceDomainDispatch('importants', allFilters.importants);
                _this9.redirect = new FilterSourceDomainDispatch('redirect', allFilters.redirect);
                _this9.cosmetics = new CosmeticEngine(allFilters.cosmetics);
              })();
            } else {
              // If it's not an update, just add new lists in engine.
              lists.forEach(function (list) {
                var asset = list.asset;

                var _lists$get = _this9.lists.get(asset);

                var filters = _lists$get.filters;
                var exceptions = _lists$get.exceptions;
                var importants = _lists$get.importants;
                var redirect = _lists$get.redirect;
                var cosmetics = _lists$get.cosmetics;

                _this9.size += filters.length + exceptions.length + redirect.length + importants.length + cosmetics.length;

                filters.forEach(_this9.filters.push.bind(_this9.filters));
                exceptions.forEach(_this9.exceptions.push.bind(_this9.exceptions));
                importants.forEach(_this9.importants.push.bind(_this9.importants));
                redirect.forEach(_this9.redirect.push.bind(_this9.redirect));
                cosmetics.forEach(_this9.cosmetics.push.bind(_this9.cosmetics));
              });
            }
          }
        }, {
          key: 'getCosmeticsFilters',
          value: function getCosmeticsFilters(url, nodes) {
            return this.cosmetics.getMatchingRules(url, nodes);
          }
        }, {
          key: 'getDomainFilters',
          value: function getDomainFilters(url) {
            return this.cosmetics.getDomainRules(url, this.js);
          }
        }, {
          key: 'match',
          value: function match(request) {
            log('MATCH ' + JSON.stringify(request));
            request.tokens = tokenizeURL(request.url);

            var checkedFilters = new Set();
            var result = null;

            // Check the filters in the following order:
            // 1. redirection ($redirect=resource)
            // 2. $important (not subject to exceptions)
            // 3. normal filters
            // 4. exceptions
            result = this.redirect.match(request, checkedFilters);
            if (result === null) {
              result = this.importants.match(request, checkedFilters);
              if (result === null) {
                result = this.filters.match(request, checkedFilters);
                if (result !== null) {
                  if (this.exceptions.match(request, checkedFilters)) {
                    result = null;
                  }
                }
              }
            }

            log('Total filters ' + checkedFilters.size);
            if (result !== null) {
              if (result.redirect) {
                var _resources$get = this.resources.get(result.redirect);

                var data = _resources$get.data;
                var contentType = _resources$get.contentType;

                var dataUrl = undefined;
                if (contentType.includes(';')) {
                  dataUrl = 'data:' + contentType + ',' + data;
                } else {
                  dataUrl = 'data:' + contentType + ';base64,' + btoa(data);
                }

                return {
                  match: true,
                  redirect: dataUrl.trim()
                };
              }
              return { match: true };
            }

            return { match: false };
          }
        }]);

        return _default;
      })();

      _export('default', _default);
    }
  };
});