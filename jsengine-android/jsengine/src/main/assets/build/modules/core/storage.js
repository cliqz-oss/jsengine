System.register('core/storage', ['platform/storage'], function (_export) {

  /**
  * @namespace core
  */
  'use strict';

  var getStorage, Storage;

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

  return {
    setters: [function (_platformStorage) {
      getStorage = _platformStorage['default'];
    }],
    execute: function () {
      Storage = (function () {
        function Storage(url) {
          _classCallCheck(this, Storage);

          // if not called as constructor, still act as one
          if (!(this instanceof Storage)) {
            return new Storage(url);
          }

          this.storage = getStorage.bind(null, url);
          this.url = url;
        }

        _createClass(Storage, [{
          key: 'getItem',
          value: function getItem(key) {
            return this.storage().getItem(key);
          }
        }, {
          key: 'setItem',
          value: function setItem(key, value) {
            return this.storage().setItem(key, value);
          }
        }, {
          key: 'removeItem',
          value: function removeItem(key) {
            return this.storage().removeItem(key);
          }
        }, {
          key: 'clear',
          value: function clear() {
            return this.storage().clear();
          }

          /**
           * @method setObject
           * @param key {string}
           * @param object
           */
        }, {
          key: 'setObject',
          value: function setObject(key, object) {
            this.storage().setItem(key, JSON.stringify(object));
          }

          /**
           * @method getObject
           * @param key {string}
           * @param notFound {Boolean}
           */
        }, {
          key: 'getObject',
          value: function getObject(key) {
            var notFound = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

            var o = this.storage().getItem(key);
            if (o) {
              return JSON.parse(o);
            }
            return notFound;
          }
        }]);

        return Storage;
      })();

      _export('default', Storage);
    }
  };
});