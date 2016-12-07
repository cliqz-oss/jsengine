System.register('core/anacron', ['core/cliqz'], function (_export) {
  'use strict';

  var utils, ONE_SECOND, ONE_MINUTE, ONE_HOUR, Task, Queue, Cron, _default;

  var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

  var _get = function get(_x6, _x7, _x8) { var _again = true; _function: while (_again) { var object = _x6, property = _x7, receiver = _x8; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x6 = parent; _x7 = property; _x8 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

  return {
    setters: [function (_coreCliqz) {
      utils = _coreCliqz.utils;
    }],
    execute: function () {
      ONE_SECOND = 1000;
      ONE_MINUTE = 60 * ONE_SECOND;
      ONE_HOUR = 60 * ONE_MINUTE;

      Task = (function () {
        function Task(run, pattern) {
          _classCallCheck(this, Task);

          this.run = run;
          this.pattern = this.parse(pattern);
        }

        // TODO: return false if currently running

        _createClass(Task, [{
          key: 'shouldRun',
          value: function shouldRun() {
            var date = arguments.length <= 0 || arguments[0] === undefined ? new Date() : arguments[0];

            var pattern = this.pattern;
            var minutes = date.getMinutes();
            var hours = date.getHours();

            return (minutes % pattern.minutes.interval === 0 || isNaN(pattern.minutes.interval) && (isNaN(pattern.minutes.absolute) || pattern.minutes.absolute === minutes)) && (hours % pattern.hours.interval === 0 || isNaN(pattern.hours.interval) && (isNaN(pattern.hours.absolute) || pattern.hours.absolute === hours));
          }
        }, {
          key: 'parse',
          value: function parse(pattern) {
            var _pattern$split$map = pattern.split(' ').map(function (unit) {
              var _unit$split$map = unit.split('/').map(Number);

              var _unit$split$map2 = _slicedToArray(_unit$split$map, 2);

              var absolute = _unit$split$map2[0];
              var interval = _unit$split$map2[1];

              return { absolute: absolute, interval: interval };
            });

            var _pattern$split$map2 = _slicedToArray(_pattern$split$map, 2);

            var minutes = _pattern$split$map2[0];
            var hours = _pattern$split$map2[1];

            return { hours: hours, minutes: minutes };
          }
        }]);

        return Task;
      })();

      _export('Task', Task);

      Queue = (function () {
        function Queue() {
          _classCallCheck(this, Queue);

          this.consumers = [];
          this.queue = [];
        }

        _createClass(Queue, [{
          key: 'isEmpty',
          value: function isEmpty() {
            return !this.queue.length;
          }

          // TODO: add tests
        }, {
          key: 'head',
          value: function head() {
            return this.queue[0];
          }

          // TODO: add tests
        }, {
          key: 'enqueue',
          value: function enqueue(item) {
            this.queue.push(item);
            if (!this.timeout) {
              this.timeout = utils.setTimeout(this.consume.bind(this), 0);
            }
          }

          // TODO: add tests
        }, {
          key: 'subscribe',
          value: function subscribe(callback) {
            this.consumers.push(callback);
          }

          // TODO: add tests
        }, {
          key: 'consume',
          value: function consume() {
            var _this = this;

            var _loop = function () {
              var item = _this.queue.shift();
              _this.consumers.forEach(function (callback) {
                return callback(item);
              });
              // TODO: make asynch, use setTimeout for next item
            };

            while (!this.isEmpty()) {
              _loop();
            }
            this.timeout = null;
          }
        }]);

        return Queue;
      })();

      _export('Queue', Queue);

      Cron = (function () {
        function Cron() {
          _classCallCheck(this, Cron);

          this.isRunning = false;
          this.tasks = [];
        }

        // Anacron

        _createClass(Cron, [{
          key: 'start',
          value: function start() {
            if (this.isRunning) {
              return;
            }

            this.clock = utils.setInterval(this.onTick.bind(this), ONE_MINUTE);
            this.isRunning = true;
          }
        }, {
          key: 'stop',
          value: function stop() {
            if (!this.isRunning) {
              return;
            }

            utils.clearInterval(this.clock);
            this.isRunning = false;
          }
        }, {
          key: 'schedule',
          value: function schedule(func, pattern) {
            var task = new Task(func, pattern);
            this.tasks.push(task);
            return task;
          }
        }, {
          key: 'unschedule',
          value: function unschedule(task) {
            var index = this.tasks.indexOf(task);
            if (index >= 0) {
              this.tasks.splice(index, 1);
            }
          }
        }, {
          key: 'run',
          value: function run(date) {
            var _ref = arguments.length <= 1 || arguments[1] === undefined ? { force: false } : arguments[1];

            var force = _ref.force;

            this.tasks.filter(function (task) {
              return force || task.shouldRun(date);
            }).forEach(function (task) {
              return utils.setTimeout(task.run, 0, date);
            });
          }
        }, {
          key: 'onTick',
          value: function onTick() {
            var date = arguments.length <= 0 || arguments[0] === undefined ? new Date() : arguments[0];

            this.run(date);
          }
        }]);

        return Cron;
      })();

      _export('Cron', Cron);

      _default = (function (_Cron) {
        _inherits(_default, _Cron);

        function _default(storage) {
          var _ref2 = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

          var _ref2$name = _ref2.name;
          var name = _ref2$name === undefined ? 'core.anacron' : _ref2$name;

          _classCallCheck(this, _default);

          _get(Object.getPrototypeOf(_default.prototype), 'constructor', this).call(this);
          this.storage = storage;
          // TODO: test getting of setting
          this.setting = name + '.last';
          this.last = Number(this.storage.get(this.setting, 0));
          this.queue = new Queue();
          // TODO: move to `start`; also call `unsubscribe` from `stop`
          this.queue.subscribe(this.run.bind(this));
        }

        // TODO: add tests

        _createClass(_default, [{
          key: 'run',
          value: function run(date) {
            // `super.run` runs tasks asynchronously, thus does not block
            _get(Object.getPrototypeOf(_default.prototype), 'run', this).call(this, date);
            // TODO: test setting of setting
            this.last = date.getTime();
            // TODO: since `super.run` is asynchronous, not all tasks are completed at this point;
            //       timestamp setting should only be set once alls tasks are completed to avoid missing
            //       tasks (e.g., due to browser shutdown)
            this.storage.set(this.setting, String(this.last));
          }
        }, {
          key: 'converge',
          value: function converge(date) {
            var now = date.getTime();
            if (!this.last || this.last > now) {
              this.last = now - ONE_MINUTE;
            }
            var next = this.last + ONE_MINUTE;
            while (now - next >= 0) {
              this.queue.enqueue(new Date(next));
              next += ONE_MINUTE;
            }
          }
        }, {
          key: 'onTick',
          value: function onTick() {
            var date = arguments.length <= 0 || arguments[0] === undefined ? new Date() : arguments[0];

            this.converge(date);
          }
        }]);

        return _default;
      })(Cron);

      _export('default', _default);
    }
  };
});