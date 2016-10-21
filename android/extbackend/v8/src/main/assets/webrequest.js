
var webRequest = {
    onBeforeRequest: {
        listeners: [],
        addListener(listener, filter, extraInfo) {
          this.listeners.push({fn: listener, filter, extraInfo});
        },
        removeListener(listener) {},

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