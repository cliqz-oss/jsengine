package com.cliqz.jsengine.ui;

import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.WritableNativeArray;
import com.facebook.react.bridge.WritableNativeMap;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;

/**
 * Created by sammacbeth on 05/01/2017.
 */

public class HistoryModule extends ReactContextBaseJavaModule {

    final BrowserHistory history;

    public HistoryModule(ReactApplicationContext reactContext, BrowserHistory history) {
        super(reactContext);
        this.history = history;
    }

    @Override
    public String getName() {
        return "History";
    }

    @ReactMethod
    public void getHistoryItems(int start, int end, Promise promise) {
        JsonArray historyItems = this.history.getHistoryItems(start, end);
        WritableNativeArray result = new WritableNativeArray();
        for(JsonElement item : historyItems){
            WritableNativeMap jsItem = new WritableNativeMap();
            JsonObject entry = item.getAsJsonObject();
            jsItem.putString("url", entry.get("url").getAsString());
            jsItem.putString("title", entry.get("title").getAsString());
            result.pushMap(jsItem);
        }
        promise.resolve(result);
    }
}
