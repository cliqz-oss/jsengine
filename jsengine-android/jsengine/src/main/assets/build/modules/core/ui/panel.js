System.register('core/ui/panel', ['../utils', '../helpers/maybe'], function (_export) {
  'use strict';

  var utils, maybe, _default;

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

  return {
    setters: [function (_utils) {
      utils = _utils['default'];
    }, function (_helpersMaybe) {
      maybe = _helpersMaybe['default'];
    }],
    execute: function () {
      _default = (function () {
        function _default(window, url, id) {
          var autohide = arguments.length <= 3 || arguments[3] === undefined ? true : arguments[3];
          var actions = arguments.length <= 4 || arguments[4] === undefined ? {} : arguments[4];

          _classCallCheck(this, _default);

          this.window = window;
          this.document = this.window.document;
          this.url = url;
          this.id = id;
          this.autohide = autohide;
          this.actions = actions;
          this.shouldBeOpen = false;

          this.onShowing = this.onShowing.bind(this);
          this.onHiding = this.onHiding.bind(this);
          this.onMouseOver = this.onMouseOver.bind(this);
          this.onMouseOut = this.onMouseOut.bind(this);
          this.onMessage = this.onMessage.bind(this);
        }

        _createClass(_default, [{
          key: 'createPanel',
          value: function createPanel() {
            var panel = this.document.createElement('panelview');
            var vbox = this.document.createElement('vbox');

            panel.setAttribute('id', this.id);
            panel.setAttribute('flex', '1');
            panel.setAttribute('panelopen', 'true');
            panel.setAttribute('animate', 'true');
            panel.setAttribute('type', 'arrow');

            vbox.classList.add('panel-subview-body');
            panel.appendChild(vbox);

            panel.addEventListener('ViewShowing', this.onShowing);
            panel.addEventListener('ViewHiding', this.onHiding);

            this.panel = panel;
          }
        }, {
          key: 'createIframe',
          value: function createIframe() {
            var iframe = this.document.createElement('iframe');

            function onPopupReady() {
              var body = iframe.contentDocument.body;
              var clientHeight = body.scrollHeight;
              var clientWidth = body.scrollWidth;

              iframe.style.height = clientHeight + 'px';
              iframe.style.width = clientWidth + 'px';

              iframe.contentWindow.addEventListener('message', this.onMessage);
            }

            iframe.setAttribute('type', 'content');
            iframe.setAttribute('src', this.url);
            iframe.addEventListener('load', onPopupReady.bind(this), true);

            this.iframe = iframe;
          }
        }, {
          key: 'sendMessage',
          value: function sendMessage(message) {
            var json = JSON.stringify(message);
            this.iframe.contentWindow.postMessage(json, '*');
          }
        }, {
          key: 'onMessage',
          value: function onMessage(event) {
            var data = JSON.parse(event.data);
            if (data.target === 'cliqz-control-center' && data.origin === 'iframe') {
              var message = data.message;
              this.actions[message.action](message.data);
            }
          }
        }, {
          key: 'onMouseOver',
          value: function onMouseOver() {
            this.shouldBeOpen = true;
          }
        }, {
          key: 'onMouseOut',
          value: function onMouseOut() {
            if (this.autohide) {
              this.hide();
            }
          }
        }, {
          key: 'onShowing',
          value: function onShowing() {
            var _this = this;

            this.createIframe();
            this.panel.querySelector('vbox').appendChild(this.iframe);

            // TODO: need a better way to attach those events
            utils.setTimeout(function () {
              maybe(_this, 'wrapperPanel').then(function (panel) {
                panel.addEventListener('mouseover', _this.onMouseOver);
              });
              maybe(_this, 'wrapperPanel').then(function (panel) {
                panel.addEventListener('mouseout', _this.onMouseOut);
              });
            }, 200);
          }
        }, {
          key: 'onHiding',
          value: function onHiding() {
            var _this2 = this;

            this.panel.querySelector('vbox').removeChild(this.iframe);

            maybe(this, 'wrapperPanel').then(function (panel) {
              panel.removeEventListener('mouseover', _this2.onMouseOver);
            });
            maybe(this, 'wrapperPanel').then(function (panel) {
              panel.removeEventListener('mouseout', _this2.onMouseOut);
            });
          }
        }, {
          key: 'open',
          value: function open(button) {
            this.shouldBeOpen = true;
            this.window.PanelUI.showSubView(this.id, button, this.window.CustomizableUI.AREA_NAVBAR);
          }
        }, {
          key: 'hide',
          value: function hide() {
            var _this3 = this;

            this.shouldBeOpen = false;
            utils.setTimeout(function () {
              if (!_this3.shouldBeOpen) {
                maybe(_this3, 'wrapperPanel').then(function (panel) {
                  return panel.hidePopup();
                });
              }
            }, 300);
          }
        }, {
          key: 'destroyPanel',
          value: function destroyPanel() {
            delete this.panel;
          }
        }, {
          key: 'wrapperPanel',
          value: function wrapperPanel() {
            return this.document.querySelector('[viewId=' + this.id + ']');
          }
        }, {
          key: 'panelUI',
          value: function panelUI() {
            return this.document.getElementById('PanelUI-multiView');
          }
        }, {
          key: 'attach',
          value: function attach() {
            var _this4 = this;

            this.createPanel();
            maybe(this, 'panelUI').then(function (panelui) {
              panelui.appendChild(_this4.panel);
            });
          }
        }, {
          key: 'detach',
          value: function detach() {
            var panelui = this.panelUI();
            if (panelui) {
              panelui.removeChild(this.panel);
              this.destroyPanel();
            }
          }
        }]);

        return _default;
      })();

      _export('default', _default);
    }
  };
});