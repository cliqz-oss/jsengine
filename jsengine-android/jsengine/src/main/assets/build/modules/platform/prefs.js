System.register('platform/prefs', [], function (_export) {
  'use strict';

  var PREFS_FILE, defaultPrefs, prefs;

  _export('getPref', getPref);

  _export('setPref', setPref);

  _export('hasPref', hasPref);

  _export('clearPref', clearPref);

  function persistPrefs() {
    fs.writeFile(PREFS_FILE, JSON.stringify(prefs));
  }

  function getPref(prefKey, defaultValue) {
    if (prefs[prefKey] !== undefined) {
      return prefs[prefKey];
    } else {
      return defaultValue;
    }
  }

  function setPref(prefKey, value) {
    var changed = prefs[prefKey] !== value;
    prefs[prefKey] = value;
    persistPrefs();
    // trigger prefchange event
    if (changed) {
      System['import']('core/events').then(function (ev) {
        ev['default'].pub('prefchange', prefKey);
      });
    }
  }

  function hasPref(prefKey) {
    return prefKey in prefs;
  }

  function clearPref(prefKey) {
    delete prefs[prefKey];
    persistPrefs();
  }

  return {
    setters: [],
    execute: function () {
      PREFS_FILE = 'cliqz.prefs.json';

      // default prefs
      defaultPrefs = __DEFAULTPREFS__ || {};
      prefs = defaultPrefs;

      // load prefs from file
      fs.readFile(PREFS_FILE, function (data) {
        prefs = JSON.parse(data || '{}');
        // merge with default prefs
        Object.keys(defaultPrefs).forEach(function (pref) {
          if (prefs[pref] === undefined) {
            prefs[pref] = defaultPrefs[pref];
          }
        });
      });
    }
  };
});