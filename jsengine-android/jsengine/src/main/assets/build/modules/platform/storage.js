System.register("platform/storage", [], function (_export) {
  "use strict";

  return {
    setters: [],
    execute: function () {
      _export("default", {

        getItem: function getItem(id) {
          return new Promise(function (resolve, reject) {
            fs.readFile(id, function (data) {
              resolve(data);
            });
          });
        },

        setItem: function setItem(id, value) {
          fs.writeFile(id, value);
        },

        removeItem: function removeItem(id) {
          fs.writeFile(id, "");
        },

        clear: function clear() {}
      });
    }
  };
});