System.register("core/tabs", [], function (_export) {
  "use strict";

  _export("pinTab", pinTab);

  _export("queryActiveTabs", queryActiveTabs);

  function pinTab(window, tab) {
    var t = undefined;
    if (typeof tab.index === "number") {
      t = window.gBrowser.tabs[tab.index];
    } else {
      t = tab;
    }
    if (!t.pinned) {
      window.gBrowser.pinTab(t);
    }
  }

  function queryActiveTabs(window) {
    var selectedBrowser = window.gBrowser.selectedBrowser;
    return Array.prototype.map.call(window.gBrowser.tabs, function (tab, index) {
      return {
        index: index,
        url: tab.linkedBrowser.currentURI.spec,
        isCurrent: selectedBrowser === tab.linkedBrowser,
        isPinned: tab.pinned
      };
    });
  }

  return {
    setters: [],
    execute: function () {}
  };
});