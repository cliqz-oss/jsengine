package com.cliqz.jsengine;

import android.util.Log;

import com.cliqz.jsengine.v8.api.WebRequest;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.concurrent.ExecutionException;

/**
 * Created by sammacbeth on 21/10/2016.
 */

public class AntiTracking {

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

    public void setEnabled(final boolean enabled) throws ExecutionException {
        engine.setPref(BLOOM_FILTER_PREF, true);
        engine.setPref(ENABLE_PREF, enabled);
        engine.setPref(QSBLOCKING_PREF, true);
    }

    public void setForceBlockEnabled(final boolean enabled) throws ExecutionException {
        engine.setPref(FORCE_BLOCK_PREF, enabled);
    }

    public JSONObject getTabBlockingInfo(final int tabId) {
        try {
            final Object blockingInfo = engine.system.callFunctionOnModuleDefault("antitracking/attrack", "getTabBlockingInfo", tabId, webRequest.getUrlForTab(tabId));
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
