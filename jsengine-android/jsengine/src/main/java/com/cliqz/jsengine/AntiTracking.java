package com.cliqz.jsengine;

import android.util.Log;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.concurrent.ExecutionException;

/**
 * Created by sammacbeth on 21/10/2016.
 */

public class AntiTracking {

    private final Engine engine;

    public AntiTracking(Engine engine) {
        this.engine = engine;
    }

    public JSONObject getTabBlockingInfo(final int tabId) {
        try {
            final Object blockingInfo = engine.system.callFunctionOnModuleDefault("antitracking/attrack", "getTabBlockingInfo", tabId);
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
