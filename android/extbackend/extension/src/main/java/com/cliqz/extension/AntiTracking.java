package com.cliqz.extension;

import android.util.Log;

import com.eclipsesource.v8.V8;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeoutException;

/**
 * Created by sammacbeth on 21/10/2016.
 */

public class AntiTracking {

    private final ExtensionBackend extension;

    public AntiTracking(ExtensionBackend extension) {
        this.extension = extension;
    }

    public JSONObject getTabBlockingInfo(final int tabId) {
        try {
            final Object blockingInfo = extension.system.callFunctionOnModuleDefault("antitracking/attrack", "getTabBlockingInfo", tabId);
            return new JSONObject(blockingInfo.toString());
        } catch (ExecutionException e) {
            Log.e("attrack", "getTabBlockingInfo error", e);
        } catch (JSONException e) {
            // shouldn't happen - the parsed json comes directly from JSON.stringify in JS
            throw new RuntimeException(e);
        }
        // on failure return empty object
        return new JSONObject();
    }
}
