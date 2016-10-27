package com.cliqz.jsengine;

import android.util.Log;

import com.cliqz.jsengine.v8.api.WebRequest;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ExecutionException;

/**
 * Created by sammacbeth on 21/10/2016.
 */

public class AntiTracking {

    private final static String MODULE_NAME = "antitracking";
    private final static String ENABLE_PREF = "antiTrackTest";
    private final static String QSBLOCKING_PREF = "attrackRemoveQueryStringTracking";
    private final static String BLOOM_FILTER_PREF = "attrackBloomFilter";
    private final static String FORCE_BLOCK_PREF = "attrackForceBlock";

    private final Engine engine;
    private final WebRequest webRequest;

    public AntiTracking(Engine engine) {
        this.engine = engine;
        this.webRequest = engine.webRequest;
    }

    public Map<String, Object> getDefaultPrefs() {
        final Map<String, Object> prefs = new HashMap<>();
        prefs.put(BLOOM_FILTER_PREF, true);
        prefs.put(ENABLE_PREF, true);
        prefs.put(QSBLOCKING_PREF, true);
        return prefs;
    }

    public void setEnabled(final boolean enabled) throws ExecutionException {
        engine.setPref(BLOOM_FILTER_PREF, true);
        engine.setPref(QSBLOCKING_PREF, true);
        engine.setPref(ENABLE_PREF, true);
        engine.setPref("modules."+ MODULE_NAME + ".enabled", enabled);
    }

    public void setForceBlockEnabled(final boolean enabled) throws ExecutionException {
        engine.setPref(FORCE_BLOCK_PREF, enabled);
    }

    public JSONObject getTabBlockingInfo(final int tabId) {
        try {
            final Object blockingInfo = engine.system.callFunctionOnModuleDefault("antitracking/attrack", "getTabBlockingInfo", tabId, webRequest.getUrlForTab(tabId));
            Log.d("XXX", blockingInfo.toString());
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
