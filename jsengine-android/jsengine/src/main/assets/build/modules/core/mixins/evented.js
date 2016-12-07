System.register('core/mixins/evented', ['../utils'], function (_export) {

  // TODO: use in TabObserver and others
  'use strict';

  var utils;

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

  function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

  return {
    setters: [function (_utils) {
      utils = _utils['default'];
    }],
    execute: function () {
      _export('default', function (base) {
        return (function (_base) {
          _inherits(_class, _base);

          function _class() {
            _classCallCheck(this, _class);

            _get(Object.getPrototypeOf(_class.prototype), 'constructor', this).call(this);
            this.eventListeners = {};
          }

          _createClass(_class, [{
            key: 'addEventListener',
            value: function addEventListener(eventName, handler) {
              this.eventListeners[eventName] = this.eventListeners[eventName] || [];
              this.eventListeners[eventName].push(handler);
            }
          }, {
            key: 'removeEventListener',
            value: function removeEventListener(eventName, handler) {
              var eventListeners = this.eventListeners[eventName] || [];
              var index = eventListeners.indexOf(handler);

              this.eventListeners[eventName] = eventListeners;

              if (index >= 0) {
                eventListeners.splice(index, 1);
              }
            }
          }, {
            key: 'publishEvent',
            value: function publishEvent(eventName) {
              for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
                args[_key - 1] = arguments[_key];
              }

              var eventListeners = this.eventListeners[eventName] || [];
              eventListeners.forEach(function (handler) {
                utils.setTimeout.apply(utils, [handler, 0].concat(args));
              });
            }
          }]);

          return _class;
        })(base);
      });
    }
  };
});