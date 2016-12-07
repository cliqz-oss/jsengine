
var webRequest = {
    onBeforeRequest: {
        listeners: [],
        addListener(listener, filter, extraInfo) {
          this.listeners.push({fn: listener, filter, extraInfo});
        },
        removeListener(listener) {
          const ind = this.listeners.findIndex((l) => {
            return l.fn === listener;
          });
          if (ind > -1) {
            this.listeners.splice(ind, 1);
          }
        },

        _triggerJson(requestInfoJson) {
          const requestInfo = JSON.parse(requestInfoJson);
          try {
              const response = webRequest.onBeforeRequest._trigger(requestInfo) || {};
              return JSON.stringify(response);
          } catch(e) {
            console.error('webrequest trigger error', e);
          }
        },

        _trigger(requestInfo) {
          // getter for request headers
          requestInfo.getRequestHeader = function(header) {
            return requestInfo.requestHeaders[header];
          };
          for (let listener of this.listeners) {
              const {fn, filter, extraInfo} = listener;
              const blockingResponse = fn(requestInfo);
              if (blockingResponse && Object.keys(blockingResponse).length > 0) {
                return blockingResponse;
              }
          }
          return {};
        }
      },

      onBeforeSendHeaders: {
        addListener(listener, filter, extraInfo) {},
        removeListener(listener) {}
      },

      onHeadersReceived: {
        addListener(listener, filter, extraInfo) {},
        removeListener(listener) {}
      }
}