System.register("core/events", ["core/console", "core/utils"], function (_export) {
  /*
   * This method implements the publish subscribe design pattern
   *
   * Event naming scheme:
   *    cliqz.module_name.event_name
   *
   *  single sender -> multiple potential recipients
   *    for example: cliqz.core.urlbar_focus (inform others about urlbar focus)
   *    module_name describes sender
   *  multiple potential senders -> single recipient
   *    for example: cliqz.msg_center.show_message (tell the message center to show a message)
   *    module_name describes recipient (this is more like a RPC)
   */

  "use strict";

  var console, CliqzUtils, CliqzEvents, subscribe;
  return {
    setters: [function (_coreConsole) {
      console = _coreConsole["default"];
    }, function (_coreUtils) {
      CliqzUtils = _coreUtils["default"];
    }],
    execute: function () {
      CliqzEvents = CliqzEvents || {
        //use a javascript object to push the message ids and the callbacks
        cache: {},
        tickCallbacks: [],
        /*
         * Publish events of interest with a specific id
         */
        queue: [],

        pub: function pub(id) {
          var _this = this;

          var args = Array.prototype.slice.call(arguments, 1);

          var callbacks = (CliqzEvents.cache[id] || []).map(function (ev) {
            return new CliqzUtils.Promise(function (resolve) {
              CliqzUtils.setTimeout(function () {
                try {
                  ev.apply(null, args);
                } catch (e) {
                  console.error("CliqzEvents error: " + id, e);
                }
                resolve();
              }, 0);
            });
          });

          var finishedPromise = CliqzUtils.Promise.all(callbacks).then(function () {
            var index = _this.queue.indexOf(finishedPromise);
            _this.queue.splice(index, 1);
            if (_this.queue.length === 0) {
              _this.triggerNextTick();
            }
          });
          this.queue.push(finishedPromise);
        },

        triggerNextTick: function triggerNextTick() {
          this.tickCallbacks.forEach(function (cb) {
            try {
              cb();
            } catch (e) {}
          });
          this.tickCallbacks = [];
        },

        nextTick: function nextTick() {
          var cb = arguments.length <= 0 || arguments[0] === undefined ? function () {} : arguments[0];

          this.tickCallbacks = this.tickCallbacks || [];
          this.tickCallbacks.push(cb);
        },

        /* Subscribe to events of interest
         * with a specific id and a callback
         * to be executed when the event is observed
         */
        sub: function sub(id, fn) {
          CliqzEvents.cache[id] = CliqzEvents.cache[id] || [];
          CliqzEvents.cache[id].push(fn);
        },

        subscribe: function subscribe(eventName, callback, that) {
          var cb = undefined;
          if (that) {
            cb = callback.bind(that);
          } else {
            cb = callback;
          }

          CliqzEvents.sub(eventName, cb);

          return {
            unsubscribe: function unsubscribe() {
              CliqzEvents.un_sub(eventName, cb);
            }
          };
        },

        un_sub: function un_sub(id, fn) {
          if (!CliqzEvents.cache[id] || CliqzEvents.cache[id].length === 0) {
            console.error("Trying to unsubscribe event that had no subscribers");
            return;
          }

          var index = CliqzEvents.cache[id].indexOf(fn);
          if (index > -1) {
            CliqzEvents.cache[id].splice(index, 1);
          } else {
            console.error("Trying to unsubscribe an unknown listener");
          }
        },

        clean_channel: function clean_channel(id) {
          if (!CliqzEvents.cache[id]) {
            throw "Trying to unsubscribe an unknown channel";
          }
          CliqzEvents.cache[id] = [];
        },

        /**
         * Adds a listener to eventTarget for events of type eventType, and republishes them
         *  through CliqzEvents with id cliqzEventName.
         */
        proxyEvent: function proxyEvent(cliqzEventName, eventTarget, eventType) {
          var propagate = arguments.length <= 3 || arguments[3] === undefined ? false : arguments[3];

          var handler = CliqzEvents.pub.bind(CliqzEvents, cliqzEventName);
          eventTarget.addEventListener(eventType, handler, propagate);
          return {
            unsubscribe: function unsubscribe() {
              eventTarget.removeEventListener(eventType, handler);
            }
          };
        },

        nextId: function nextId() {
          nextId.id = nextId.id || 0;
          nextId.id += 1;
          return nextId.id;
        }
      };

      _export("default", CliqzEvents);

      subscribe = CliqzEvents.subscribe;

      _export("subscribe", subscribe);
    }
  };
});