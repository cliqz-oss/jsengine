System.register('core/base/background', ['core/events'], function (_export) {
  'use strict';

  var events;
  return {
    setters: [function (_coreEvents) {
      events = _coreEvents['default'];
    }],
    execute: function () {
      _export('default', function (originalBackground) {
        var background = Object.assign({}, originalBackground);
        var bgInit = background.init;
        var bgUnload = background.unload;
        var bgEvents = background.events;

        // bind actions to background object
        Object.keys(background.actions || {}).forEach(function (action) {
          background.actions[action] = background.actions[action].bind(background);
        });

        background.init = function init() {
          for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
          }

          var promise = Promise.resolve(bgInit.apply(background, args));

          Object.keys(bgEvents || {}).forEach(function (event) {
            bgEvents[event] = bgEvents[event].bind(background);
            events.sub(event, bgEvents[event]);
          });
          return promise;
        };

        background.unload = function unload() {
          Object.keys(bgEvents || {}).forEach(function (event) {
            events.un_sub(event, bgEvents[event]);
          });

          for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
            args[_key2] = arguments[_key2];
          }

          bgUnload.apply(background, args);
        };

        return background;
      });
    }
  };
});