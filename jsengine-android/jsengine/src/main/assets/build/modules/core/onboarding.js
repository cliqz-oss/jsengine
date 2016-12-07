System.register("core/onboarding", ["core/cliqz", "core/config"], function (_export) {
  "use strict";

  var utils, config;

  _export("version", version);

  _export("shouldShowOnboardingV2", shouldShowOnboardingV2);

  function version() {
    return config.settings.onBoardingVersion;
  }

  function shouldShowOnboardingV2() {
    var step = utils.getPref(utils.BROWSER_ONBOARDING_STEP_PREF, 1),
        existingUser = utils.hasPref(utils.BROWSER_ONBOARDING_PREF),
        shouldShow = false;
    if (!existingUser) {
      if (step < 3) {
        shouldShow = true;
      }
    }

    return shouldShow;
  }

  return {
    setters: [function (_coreCliqz) {
      utils = _coreCliqz.utils;
    }, function (_coreConfig) {
      config = _coreConfig["default"];
    }],
    execute: function () {}
  };
});