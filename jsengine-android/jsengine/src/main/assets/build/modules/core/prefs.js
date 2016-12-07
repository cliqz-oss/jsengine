System.register("core/prefs", ["platform/prefs"], function (_export) {
  "use strict";

  var getPref, setPref, hasPref, clearPref;
  return {
    setters: [function (_platformPrefs) {
      getPref = _platformPrefs.getPref;
      setPref = _platformPrefs.setPref;
      hasPref = _platformPrefs.hasPref;
      clearPref = _platformPrefs.clearPref;
    }],
    execute: function () {
      _export("default", {
        /**
         * Get a value from preferences db
         * @param {string}  pref - preference identifier
         * @param {*=}      defautlValue - returned value in case pref is not defined
         * @param {string=} prefix - prefix for pref
         */
        get: getPref,
        /**
         * Set a value in preferences db
         * @param {string}  pref - preference identifier
         * @param {string=} prefix - prefix for pref
         */
        set: setPref,
        /**
         * Check if there is a value in preferences db
         * @param {string}  pref - preference identifier
         * @param {string=} prefix - prefix for pref
         */
        has: hasPref,
        /**
         * Clear value in preferences db
         * @param {string}  pref - preference identifier
         * @param {string=} prefix - prefix for pref
         */
        clear: clearPref
      });
    }
  };
});