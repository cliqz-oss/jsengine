System.register('antitracking/steps/token-checker', ['antitracking/md5', 'antitracking/domain', 'antitracking/time', 'antitracking/hash', 'antitracking/url'], function (_export) {
    'use strict';

    var md5, getGeneralDomain, datetime, HashProb, dURIC, STAT_KEYS, _default;

    var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

    return {
        setters: [function (_antitrackingMd5) {
            md5 = _antitrackingMd5['default'];
        }, function (_antitrackingDomain) {
            getGeneralDomain = _antitrackingDomain.getGeneralDomain;
        }, function (_antitrackingTime) {
            datetime = _antitrackingTime;
        }, function (_antitrackingHash) {
            HashProb = _antitrackingHash.HashProb;
        }, function (_antitrackingUrl) {
            dURIC = _antitrackingUrl.dURIC;
        }],
        execute: function () {
            STAT_KEYS = ['cookie', 'private', 'cookie_b64', 'private_b64', 'safekey', 'whitelisted', 'cookie_newToken', 'cookie_countThreshold', 'private_newToken', 'private_countThreshold', 'short_no_hash', 'cookie_b64_newToken', 'cookie_b64_countThreshold', 'private_b64_newToken', 'private_b64_countThreshold', 'qs_newToken', 'qs_countThreshold'];

            _default = (function () {
                function _default(qsWhitelist, blockLog, tokenDomainCountThreshold, shortTokenLength, privateValues, hashProb) {
                    _classCallCheck(this, _default);

                    this.qsWhitelist = qsWhitelist;
                    this.blockLog = blockLog;
                    this.tokenDomainCountThreshold = tokenDomainCountThreshold;
                    this.shortTokenLength = shortTokenLength;
                    this.debug = false;
                    this.privateValues = privateValues;
                    this.hashProb = hashProb;
                }

                _createClass(_default, [{
                    key: 'init',
                    value: function init() {}
                }, {
                    key: 'findBadTokens',
                    value: function findBadTokens(state) {
                        var stats = {};
                        state.badTokens = this.checkTokens(state.urlParts, state.sourceUrl, state.cookieValues, stats, state.sourceUrlParts);
                        // set stats
                        if (state.incrementStat) {
                            Object.keys(stats).forEach(function (key) {
                                if (stats[key] > 0) {
                                    state.incrementStat('token.has_' + key);
                                    state.incrementStat('token.' + key, stats[key]);
                                }
                            });
                            if (state.badTokens.length > 0) {
                                state.incrementStat('bad_qs');
                                state.incrementStat('bad_tokens', state.badTokens.length);
                            }
                        }
                        return true;
                    }
                }, {
                    key: 'checkTokens',
                    value: function checkTokens(url_parts, source_url, cookievalue, stats, source_url_parts) {
                        var self = this;
                        // bad tokens will still be returned in the same format
                        var s = getGeneralDomain(url_parts.hostname);
                        s = md5(s).substr(0, 16);
                        // If it's a rare 3rd party, we don't do the rest
                        if (!this.qsWhitelist.isTrackerDomain(s)) return [];

                        var sourceD = md5(source_url_parts.hostname).substr(0, 16);
                        var today = datetime.getTime().substr(0, 8);

                        if (url_parts['query'].length == 0 && url_parts['parameters'].length == 0) return [];
                        var tok;

                        var badTokens = [];

                        // stats keys
                        STAT_KEYS.forEach(function (k) {
                            stats[k] = 0;
                        });

                        var _countCheck = function _countCheck(tok) {
                            // for token length < 12 and may be not a hash, we let it pass
                            if (tok.length < 12 && !self.hashProb.isHash(tok)) return 0;
                            // update tokenDomain
                            tok = md5(tok);
                            self.blockLog.tokenDomain.addTokenOnFirstParty(tok, sourceD);
                            return self.blockLog.tokenDomain.getNFirstPartiesForToken(tok);
                        };

                        var _incrStats = function _incrStats(cc, prefix, tok, key, val) {
                            if (cc == 0) stats['short_no_hash']++;else if (cc < self.tokenDomainCountThreshold) stats[prefix + '_newToken']++;else {
                                _addBlockLog(s, key, val, prefix);
                                badTokens.push(val);
                                if (cc == self.tokenDomainCountThreshold) stats[prefix + '_countThreshold']++;
                                stats[prefix]++;
                                return true;
                            }
                            return false;
                        };

                        var _addBlockLog = function _addBlockLog(s, key, val, prefix) {
                            self.blockLog.blockLog.add(source_url, s, key, val, prefix);
                        };

                        var _checkTokens = function _checkTokens(key, val) {
                            self.blockLog.incrementCheckedTokens();

                            var tok = dURIC(val);
                            while (tok != dURIC(tok)) {
                                tok = dURIC(tok);
                            }

                            if (tok.length < self.shortTokenLength || source_url.indexOf(tok) > -1) return;

                            // Bad values (cookies)
                            for (var c in cookievalue) {
                                if (tok.indexOf(c) > -1 && c.length >= self.shortTokenLength || c.indexOf(tok) > -1) {
                                    if (self.debug) CliqzUtils.log('same value as cookie ' + val, 'tokk');
                                    var cc = _countCheck(tok);
                                    if (c != tok) {
                                        cc = Math.max(cc, _countCheck(c));
                                    }
                                    if (_incrStats(cc, 'cookie', tok, key, val)) return;
                                }
                            }

                            // private value (from js function returns)
                            for (var c in self.privateValues) {
                                if (tok.indexOf(c) > -1 && c.length >= self.shortTokenLength || c.indexOf(tok) > -1) {
                                    if (self.debug) CliqzUtils.log('same private values ' + val, 'tokk');
                                    var cc = _countCheck(tok);
                                    if (c != tok) {
                                        cc = Math.max(cc, _countCheck(c));
                                    }
                                    if (_incrStats(cc, 'private', tok, key, val)) return;
                                }
                            }
                            var b64 = null;
                            try {
                                b64 = atob(tok);
                            } catch (e) {}
                            if (b64 != null) {
                                for (var c in cookievalue) {
                                    if (b64.indexOf(c) > -1 && c.length >= self.shortTokenLength || c.indexOf(b64) > -1) {
                                        if (self.debug) CliqzUtils.log('same value as cookie ' + b64, 'tokk-b64');
                                        var cc = _countCheck(tok);
                                        if (c != tok) {
                                            cc = Math.max(cc, _countCheck(c));
                                        }
                                        if (_incrStats(cc, 'cookie_b64', tok, key, val)) return;
                                    }
                                }
                                for (var c in self.privateValues) {
                                    if (b64.indexOf(c) > -1 && c.length >= self.shortTokenLength) {
                                        if (self.debug) CliqzUtils.log('same private values ' + b64, 'tokk-b64');
                                        var cc = _countCheck(tok);
                                        if (c != tok) {
                                            cc = Math.max(cc, _countCheck(c));
                                        }
                                        if (_incrStats(cc, 'private_b64', tok, key, val)) return;
                                    }
                                }
                            }

                            // Good keys.
                            if (self.qsWhitelist.isSafeKey(s, md5(key))) {
                                stats['safekey']++;
                                return;
                            }

                            if (source_url.indexOf(tok) == -1) {
                                if (!self.qsWhitelist.isSafeToken(s, md5(tok))) {
                                    var cc = _countCheck(tok);
                                    _incrStats(cc, 'qs', tok, key, val);
                                } else stats['whitelisted']++;
                            }
                        };

                        url_parts.getKeyValues().forEach(function (kv) {
                            _checkTokens(kv.k, kv.v);
                        });

                        // update blockedToken
                        this.blockLog.incrementBlockedTokens(badTokens.length);
                        return badTokens;
                    }
                }]);

                return _default;
            })();

            _export('default', _default);
        }
    };
});