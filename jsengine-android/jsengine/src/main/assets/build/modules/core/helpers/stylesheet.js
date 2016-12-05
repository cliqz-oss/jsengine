System.register('core/helpers/stylesheet', [], function (_export) {
  'use strict';

  _export('addStylesheet', addStylesheet);

  _export('removeStylesheet', removeStylesheet);

  function addStylesheet(document, url) {
    var stylesheet = document.createElementNS('http://www.w3.org/1999/xhtml', 'h:link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = url;
    stylesheet.type = 'text/css';
    stylesheet.style.display = 'none';
    stylesheet.classList.add('cliqz-theme');

    document.documentElement.appendChild(stylesheet);
  }

  function removeStylesheet(document, url) {
    var styles = [].slice.call(document.getElementsByClassName('cliqz-theme'));
    styles.filter(function (style) {
      return style.href === url;
    }).forEach(function (stylesheet) {
      if (!stylesheet.parentNode) {
        return;
      }

      stylesheet.parentNode.removeChild(stylesheet);
    });
  }

  return {
    setters: [],
    execute: function () {}
  };
});