System.register("core/helpers/maybe", [], function (_export) {
  "use strict";

  _export("default", maybe);

  function maybe(object, methodName) {
    for (var _len = arguments.length, args = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
      args[_key - 2] = arguments[_key];
    }

    return new Promise(function (resolve, reject) {
      var method = object[methodName];
      var returnedValue = method.call(object, args);

      if (returnedValue) {
        resolve(returnedValue);
      } else {
        reject(methodName + " returned falsy value");
      }
    });
  }

  return {
    setters: [],
    execute: function () {}
  };
});